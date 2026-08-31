/**
 * Standalone concurrency stress test.
 *
 * Run this with your dev server already running (`npm run dev` in another
 * window). This bypasses Vitest entirely and just makes real HTTP calls
 * against the live server — the same way our PowerShell testing has been
 * working reliably throughout this project — to prove the core claim:
 * many simultaneous bids on the same listing resolve to exactly one
 * correct winner, with no race condition.
 *
 * Usage:
 *   npx tsx scripts/stress-test-bids.ts
 */

const BASE_URL = "http://localhost:4001";
const CONCURRENT_BIDDERS = 20;

async function registerUser(name: string, email: string): Promise<{ token: string; id: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: "testpassword123" }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to register ${email}: ${data.error}`);
  }
  return { token: data.token, id: data.user.id };
}

async function main() {
  console.log("Setting up seller and listing...");

  const runId = Date.now();
  const seller = await registerUser("Seller", `seller-${runId}@example.com`);

  const listingRes = await fetch(`${BASE_URL}/api/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${seller.token}`,
    },
    body: JSON.stringify({
      title: "Stress Test Item",
      description: "Used to verify concurrent bid handling.",
      startingPrice: 100,
      minIncrement: 1,
      durationMinutes: 5,
    }),
  });
  const listingData = await listingRes.json();
  if (!listingRes.ok) {
    throw new Error(`Failed to create listing: ${listingData.error}`);
  }
  const listingId = listingData.listing.id;
  console.log(`Listing created: ${listingId}`);

  console.log(`Registering ${CONCURRENT_BIDDERS} bidders...`);
  const bidders = [];
  for (let i = 0; i < CONCURRENT_BIDDERS; i++) {
    bidders.push(await registerUser(`Bidder ${i}`, `bidder-${runId}-${i}@example.com`));
  }

  console.log("Firing all bids simultaneously...");
  const bidPromises = bidders.map((bidder, i) =>
    fetch(`${BASE_URL}/api/listings/${listingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bidder.token}`,
      },
      body: JSON.stringify({ amount: 101 + i }), // bidder 19 bids 120 — the correct winner
    }).then(async (res) => ({ status: res.status, body: await res.json() }))
  );

  const results = await Promise.all(bidPromises);

  const successes = results.filter((r) => r.status === 201);
  const failures = results.filter((r) => r.status !== 201);

  console.log(`\n${successes.length} bids succeeded, ${failures.length} failed.\n`);

  // Show the ACTUAL error from each failure — don't assume they're all
  // "too low" rejections without checking.
  if (failures.length > 0) {
    console.log("Failure reasons (status: error message):");
    const reasonCounts = new Map<string, number>();
    for (const f of failures) {
      const key = `${f.status}: ${f.body.error || JSON.stringify(f.body)}${f.body.detail ? ` (${f.body.detail})` : ""}`;
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
    for (const [reason, count] of reasonCounts) {
      console.log(`  [x${count}] ${reason}`);
    }
    console.log("");
  }

  const finalListingRes = await fetch(`${BASE_URL}/api/listings/${listingId}`);
  const finalListingData = await finalListingRes.json();
  const bids = finalListingData.listing.bids as { amount: number; bidderId: string }[];

  const highestBid = bids[0]; // already sorted desc by the API
  const bidsAtWinningAmount = bids.filter((b) => b.amount === highestBid.amount);

  console.log("=== RESULTS ===");
  console.log(`Final currentPrice on listing: ${finalListingData.listing.currentPrice}`);
  console.log(`Highest bid in bid history: ${highestBid.amount}`);
  console.log(`Total bids recorded: ${bids.length}`);
  console.log(`Bids at the winning amount: ${bidsAtWinningAmount.length} (should be exactly 1)`);

  const currentPriceMatches = finalListingData.listing.currentPrice === highestBid.amount;
  const expectedWinner = highestBid.amount === 120;
  const exactlyOneWinner = bidsAtWinningAmount.length === 1;

  console.log("\n=== PASS/FAIL ===");
  console.log(`currentPrice matches highest bid: ${currentPriceMatches ? "PASS" : "FAIL"}`);
  console.log(`Correct bidder (120) won: ${expectedWinner ? "PASS" : "FAIL"}`);
  console.log(`Exactly one bid at winning amount: ${exactlyOneWinner ? "PASS" : "FAIL"}`);

  if (currentPriceMatches && expectedWinner && exactlyOneWinner) {
    console.log("\n✅ Concurrency test PASSED — no race condition detected.");
    process.exit(0);
  } else {
    console.log("\n❌ Concurrency test FAILED — investigate the bid transaction logic.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
