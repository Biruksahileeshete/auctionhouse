import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app"; // NOTE: requires the same app.ts/index.ts split we did for CareerAI
import prisma from "../src/lib/prisma";

// The core claim of this whole project: when many bids arrive on the
// same listing at nearly the same instant, the backend must accept
// exactly one as the final winning bid, with the correct final price —
// never a lost update, never two "winners." This test proves it by
// firing a burst of concurrent requests and checking the aggregate
// result, not just testing bids one at a time in sequence.

const sellerEmail = `seller-${Date.now()}@example.com`;
const password = "testpassword123";

let sellerId: string;
let sellerToken: string;
let listingId: string;
let bidderTokens: string[] = [];
let bidderIds: string[] = [];

const CONCURRENT_BIDDERS = 20;

describe("Concurrent bidding", () => {
  beforeAll(async () => {
    const sellerRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "Seller", email: sellerEmail, password });
    sellerId = sellerRes.body.user.id;
    sellerToken = sellerRes.body.token;

    const listingRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        title: "Stress Test Item",
        description: "Used to verify concurrent bid handling.",
        startingPrice: 100,
        minIncrement: 1,
        durationMinutes: 5,
      });
    listingId = listingRes.body.listing.id;

    // Register N distinct bidders, each bidding a different, strictly
    // increasing amount — so there IS a single correct winner (the
    // highest bidder), and we can verify the system finds it correctly
    // even when all bids arrive at once rather than in order.
    for (let i = 0; i < CONCURRENT_BIDDERS; i++) {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: `Bidder ${i}`, email: `bidder-${Date.now()}-${i}@example.com`, password });
      bidderTokens.push(res.body.token);
      bidderIds.push(res.body.user.id);
    }
  });

  it("accepts exactly one correct winning bid under concurrent load", async () => {
    // Fire all bids essentially simultaneously — Promise.all doesn't
    // guarantee true OS-level simultaneity, but it does guarantee all
    // requests are in flight and racing against each other before any
    // of them resolve, which is enough to exercise the row-locking path.
    const results = await Promise.all(
      bidderTokens.map((token, i) =>
        request(app)
          .post(`/api/listings/${listingId}/bids`)
          .set("Authorization", `Bearer ${token}`)
          .send({ amount: 101 + i }) // bidder i bids 101+i, so bidder 19 bids 120 (the correct winner)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status !== 201);

    // Every bid here is genuinely valid relative to the STARTING price
    // (100) — the only reason any of them should fail is if a
    // higher-numbered bidder's request committed first, making an
    // earlier, lower amount fall below the new minimum. This is the
    // real-world race: they should all eventually be evaluated against
    // the TRUE current price at the moment their transaction runs, not
    // a stale price read before the race began.
    console.log(`${successes.length} succeeded, ${failures.length} rejected as too-low`);

    // The critical assertion: the database's final state must be
    // internally consistent — exactly one highest bid, and the
    // listing's cached currentPrice must exactly match it. This is
    // true regardless of exactly how many individual requests
    // succeeded vs. got rejected for being too low by the time their
    // transaction ran.
    const finalListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { bids: { orderBy: { amount: "desc" } } },
    });

    const highestBid = finalListing!.bids[0];

    expect(finalListing!.currentPrice).toBe(highestBid.amount);
    // The highest possible bid (120, from the last bidder) should be
    // the one that won, since it's higher than every other bid
    // regardless of arrival order.
    expect(highestBid.amount).toBe(120);

    // No two bids should have been double-counted as "the" winner —
    // there is exactly one bid at the winning amount.
    const bidsAtWinningAmount = finalListing!.bids.filter((b) => b.amount === highestBid.amount);
    expect(bidsAtWinningAmount).toHaveLength(1);
  }, 30000); // generous timeout — 20 real transactions against a real DB

  afterAll(async () => {
    await prisma.bid.deleteMany({ where: { listingId } });
    await prisma.listing.deleteMany({ where: { id: listingId } });
    await prisma.user.deleteMany({ where: { id: { in: [sellerId, ...bidderIds] } } });
    await prisma.$disconnect();
  });
});
