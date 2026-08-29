import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// ---------------------------------------------------------------------
// POST /api/listings — create a new auction
// ---------------------------------------------------------------------
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, imageUrl, startingPrice, minIncrement, durationMinutes } = req.body;

    if (!title || !description || startingPrice == null || !durationMinutes) {
      return res.status(400).json({
        error: "title, description, startingPrice, and durationMinutes are required",
      });
    }
    if (startingPrice <= 0) {
      return res.status(400).json({ error: "startingPrice must be greater than 0" });
    }
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: "durationMinutes must be greater than 0" });
    }

    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const listing = await prisma.listing.create({
      data: {
        sellerId: req.userId as string,
        title,
        description,
        imageUrl: imageUrl || null,
        startingPrice,
        minIncrement: minIncrement || 1.0,
        endsAt,
        originalEndsAt: endsAt,
      },
    });

    return res.status(201).json({ listing });
  } catch (err) {
    console.error("Listing creation error:", err);
    return res.status(500).json({ error: "Failed to create listing" });
  }
});

// ---------------------------------------------------------------------
// GET /api/listings — browse active listings
// ---------------------------------------------------------------------
router.get("/", async (_req, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { endsAt: "asc" }, // soonest-ending first — natural "act now" ordering
      include: { seller: { select: { id: true, name: true } } },
    });

    return res.json({ listings });
  } catch (err) {
    console.error("List listings error:", err);
    return res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// ---------------------------------------------------------------------
// GET /api/listings/:id — single listing detail, with bid history
// ---------------------------------------------------------------------
router.get("/:id", async (req, res: Response) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, name: true } },
        bids: {
          orderBy: { amount: "desc" },
          include: { bidder: { select: { id: true, name: true } } },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.json({ listing });
  } catch (err) {
    console.error("Get listing error:", err);
    return res.status(500).json({ error: "Failed to fetch listing" });
  }
});

export default router;
