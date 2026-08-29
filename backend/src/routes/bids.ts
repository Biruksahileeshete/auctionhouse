import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getIO } from "../lib/socket";

const router = Router();

// How close to the deadline a bid has to land to trigger an extension.
const SNIPE_WINDOW_MS = 30 * 1000; // 30 seconds
// How much time gets added when a snipe-window bid comes in.
const EXTENSION_MS = 30 * 1000; // 30 seconds

// ---------------------------------------------------------------------
// POST /api/listings/:id/bids — place a bid
// ---------------------------------------------------------------------
// This is the correctness-critical endpoint of the whole project. The
// entire read-check-write sequence happens inside a single Prisma
// interactive transaction using SELECT ... FOR UPDATE (via
// $queryRaw on the listing row) to lock it — so if two bids arrive at
// nearly the same instant, the second transaction blocks until the
// first commits, sees the now-updated price, and correctly rejects
// itself if it's no longer high enough. No race condition where both
// could read the same stale price and both get accepted.
router.post("/:id/bids", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { amount } = req.body;
  const listingId = req.params.id;
  const bidderId = req.userId as string;

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Row-level lock: SELECT ... FOR UPDATE via raw query, since
      // Prisma's normal findUnique doesn't support locking directly.
      // This blocks any other transaction trying to read/lock the same
      // row until this transaction commits or rolls back.
      const rows = await tx.$queryRaw<
        { id: string; status: string; currentPrice: number | null; startingPrice: number; minIncrement: number; endsAt: Date; sellerId: string }[]
      >`SELECT id, status, "currentPrice", "startingPrice", "minIncrement", "endsAt", "sellerId"
        FROM listings WHERE id = ${listingId} FOR UPDATE`;

      const listing = rows[0];

      if (!listing) {
        throw new Error("LISTING_NOT_FOUND");
      }
      if (listing.status !== "ACTIVE") {
        throw new Error("LISTING_NOT_ACTIVE");
      }
      if (listing.sellerId === bidderId) {
        throw new Error("CANNOT_BID_OWN_LISTING");
      }
      if (new Date() >= new Date(listing.endsAt)) {
        throw new Error("LISTING_ENDED");
      }

      const minValidBid = (listing.currentPrice ?? listing.startingPrice) +
        (listing.currentPrice != null ? listing.minIncrement : 0);

      if (amount < minValidBid) {
        throw new Error(`BID_TOO_LOW:${minValidBid}`);
      }

      // Capture the previous highest bidder (if any) before inserting
      // the new bid, so we know who to send an "outbid" notification to.
      const previousTopBid = await tx.bid.findFirst({
        where: { listingId },
        orderBy: { amount: "desc" },
      });

      const newBid = await tx.bid.create({
        data: { listingId, bidderId, amount },
      });

      // Anti-sniping: if this bid landed within the snipe window of the
      // current deadline, push the deadline out. Entirely server-side —
      // the client never gets a say in what "now" is.
      const now = new Date();
      const currentEndsAt = new Date(listing.endsAt);
      const withinSnipeWindow = currentEndsAt.getTime() - now.getTime() <= SNIPE_WINDOW_MS;
      const newEndsAt = withinSnipeWindow
        ? new Date(currentEndsAt.getTime() + EXTENSION_MS)
        : currentEndsAt;

      const updatedListing = await tx.listing.update({
        where: { id: listingId },
        data: { currentPrice: amount, endsAt: newEndsAt },
      });

      return { newBid, updatedListing, previousTopBid, wasExtended: withinSnipeWindow };
    });

    // Broadcast only AFTER the transaction has committed — everyone
    // watching this listing sees the true, persisted state, never an
    // optimistic value that might have been rolled back.
    const io = getIO();
    io.to(`listing:${listingId}`).emit("new-bid", {
      listingId,
      amount: result.newBid.amount,
      bidderId: result.newBid.bidderId,
      currentPrice: result.updatedListing.currentPrice,
      endsAt: result.updatedListing.endsAt,
      wasExtended: result.wasExtended,
    });

    if (result.previousTopBid && result.previousTopBid.bidderId !== bidderId) {
      io.to(`listing:${listingId}`).emit("outbid", {
        listingId,
        outbidUserId: result.previousTopBid.bidderId,
      });
    }

    return res.status(201).json({
      bid: result.newBid,
      currentPrice: result.updatedListing.currentPrice,
      endsAt: result.updatedListing.endsAt,
      wasExtended: result.wasExtended,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "LISTING_NOT_FOUND") {
      return res.status(404).json({ error: "Listing not found" });
    }
    if (message === "LISTING_NOT_ACTIVE") {
      return res.status(400).json({ error: "This listing is no longer active" });
    }
    if (message === "LISTING_ENDED") {
      return res.status(400).json({ error: "This listing has already ended" });
    }
    if (message === "CANNOT_BID_OWN_LISTING") {
      return res.status(400).json({ error: "You cannot bid on your own listing" });
    }
    if (message.startsWith("BID_TOO_LOW:")) {
      const minValid = message.split(":")[1];
      return res.status(400).json({ error: `Bid too low — minimum valid bid is ${minValid}` });
    }

    console.error("Bid placement error:", err);
    return res.status(500).json({ error: "Failed to place bid" });
  }
});

export default router;
