"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getListing, placeBid, getToken, Listing, Bid } from "@/lib/api";
import { getSocket, watchListing, unwatchListing } from "@/lib/socket";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceFlashKey, setPriceFlashKey] = useState(0);
  const [extendedFlash, setExtendedFlash] = useState(false);
  const [outbidFlash, setOutbidFlash] = useState(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        currentUserId.current = payload.userId;
      } catch {
        // ignore
      }
    }

    getListing(listingId)
      .then(({ listing }) => {
        setListing(listing);
        setBids(listing.bids || []);
      })
      .finally(() => setLoading(false));

    watchListing(listingId);
    const socket = getSocket();

    socket.on("new-bid", (data: { listingId: string; amount: number; bidderId: string; endsAt: string; wasExtended: boolean }) => {
      if (data.listingId !== listingId) return;
      setListing((prev) => (prev ? { ...prev, currentPrice: data.amount, endsAt: data.endsAt } : prev));
      setPriceFlashKey((k) => k + 1);
      if (data.wasExtended) {
        setExtendedFlash(true);
        setTimeout(() => setExtendedFlash(false), 3000);
      }
      getListing(listingId).then(({ listing }) => setBids(listing.bids || []));
    });

    socket.on("outbid", (data: { listingId: string; outbidUserId: string }) => {
      if (data.listingId !== listingId) return;
      if (data.outbidUserId === currentUserId.current) {
        setOutbidFlash(true);
        setTimeout(() => setOutbidFlash(false), 4000);
      }
    });

    return () => {
      unwatchListing(listingId);
      socket.off("new-bid");
      socket.off("outbid");
    };
  }, [listingId]);

  async function handleBid(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      setError("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await placeBid(listingId, amount, token);
      setBidAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#8A9690] text-sm">Loading…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#8A9690] text-sm">Listing not found.</p>
      </div>
    );
  }

  const currentPrice = listing.currentPrice ?? listing.startingPrice;
  const minNextBid = listing.currentPrice ? currentPrice + listing.minIncrement : listing.startingPrice;

  return (
    <div className="min-h-screen">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#D4AF37]/10">
        <Link href="/">
          <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Auction<span className="text-[#D4AF37]">House</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-[#8A9690] hover:text-[#F0EDE4] transition-colors">
          ← All auctions
        </Link>
      </nav>

      <AnimatePresence>
        {outbidFlash && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#FF4757] text-white text-sm text-center py-2.5"
          >
            You&apos;ve been outbid! Someone just placed a higher bid.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] bg-[#12201A] rounded-2xl overflow-hidden mb-6 border border-[#D4AF37]/10">
            {listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#3A4A40] text-sm">
                No image
              </div>
            )}
          </div>
          <p className="text-xs text-[#8A9690] mb-2">Sold by {listing.seller?.name}</p>
          <h1 className="text-2xl mb-4" style={{ fontFamily: "var(--font-display)" }}>
            {listing.title}
          </h1>
          <p className="text-sm text-[#B8C2BC] leading-relaxed">{listing.description}</p>
        </div>

        <div className="lg:col-span-2">
          <div className="border border-[#D4AF37]/15 rounded-2xl p-6 bg-[#0F1B14] sticky top-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-[#8A9690] uppercase tracking-wide mb-1">Current bid</p>
                <motion.p
                  key={priceFlashKey}
                  initial={{ scale: 1.15, color: "#D4AF37" }}
                  animate={{ scale: 1, color: "#F0EDE4" }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  ${currentPrice.toLocaleString()}
                </motion.p>
              </div>
              <CountdownDisplay endsAt={listing.endsAt} />
            </div>

            <AnimatePresence>
              {extendedFlash && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 text-xs text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg px-3 py-2"
                >
                  ⏱ Auction extended — a bid landed in the final seconds.
                </motion.div>
              )}
            </AnimatePresence>

            {listing.status === "ACTIVE" ? (
              <form onSubmit={handleBid} className="space-y-3 mb-6">
                <div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`${minNextBid.toLocaleString()} or more`}
                    className="w-full bg-[#0A120D] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
                  />
                  <p className="text-[10px] text-[#8A9690] mt-1.5">
                    Minimum bid: ${minNextBid.toLocaleString()}
                  </p>
                </div>
                {error && (
                  <p className="text-xs text-[#FF4757] bg-[#FF4757]/10 border border-[#FF4757]/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#D4AF37] text-[#0A120D] font-medium rounded-lg py-2.5 text-sm hover:bg-[#E5C158] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Placing bid…" : "Place bid"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-[#8A9690] mb-6">This auction has ended.</p>
            )}

            <div>
              <p className="text-xs text-[#8A9690] uppercase tracking-wide mb-3">
                Bid history ({bids.length})
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {bids.map((bid) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center text-xs py-1.5 border-b border-[#D4AF37]/5"
                    >
                      <span className="text-[#B8C2BC]">{bid.bidder?.name || "Bidder"}</span>
                      <span className="text-[#D4AF37]">${bid.amount.toLocaleString()}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {bids.length === 0 && (
                  <p className="text-xs text-[#3A4A40]">No bids yet — be the first.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownDisplay({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      setUrgent(diff <= 30000);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="text-right">
      <p className="text-xs text-[#8A9690] uppercase tracking-wide mb-1">Time left</p>
      <p
        className={`text-xl font-mono ${urgent ? "text-[#FF4757] animate-pulse" : "text-[#F0EDE4]"}`}
      >
        {timeLeft}
      </p>
    </div>
  );
}