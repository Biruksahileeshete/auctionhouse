"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getListing, placeBid, getToken, clearToken, Listing, Bid } from "@/lib/api";
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
  const [imageFailed, setImageFailed] = useState(false);
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

  const handleSignOut = () => {
    clearToken();
    router.push("/");
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(184,166,130,0.2),transparent_24%),linear-gradient(180deg,#f7f3ec_0%,#eef6f3_50%,#f7f3ec_100%)]">
        <p className="text-sm text-slate-600">Loading…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(184,166,130,0.2),transparent_24%),linear-gradient(180deg,#f7f3ec_0%,#eef6f3_50%,#f7f3ec_100%)]">
        <p className="text-sm text-slate-600">Listing not found.</p>
      </div>
    );
  }

  const currentPrice = listing.currentPrice ?? listing.startingPrice;
  const minNextBid = listing.currentPrice ? currentPrice + listing.minIncrement : listing.startingPrice;
  const imageUrl = listing.imageUrl && listing.imageUrl.trim() ? listing.imageUrl : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(184,166,130,0.24),transparent_28%),linear-gradient(180deg,#f7f3ec_0%,#eef6f3_50%,#f7f3ec_100%)] text-slate-800">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#C7B38A]/40">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#C89B3C] via-[#E7D7A8] to-[#90B4A4] shadow-lg shadow-[#C89B3C]/25 flex items-center justify-center text-lg font-bold text-[#17342E]">A</div>
          <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Auction<span className="text-[#BA8A26]">House</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-[#17342E] transition hover:text-[#BA8A26]">
            ← All auctions
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-[#17342E]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#17342E] transition hover:-translate-y-0.5 hover:bg-white"
          >
            Sign out
          </button>
        </div>
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

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-[#E0D0A6] bg-white/75 shadow-[0_18px_50px_rgba(94,75,40,0.08)]">
            {imageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-[420px] w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(201,155,60,0.2),rgba(247,243,236,1)_60%)] text-lg font-medium text-slate-500">
                No image
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-[#E0D0A6] bg-white/80 p-6 shadow-[0_12px_40px_rgba(71,55,25,0.04)]">
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Sold by {listing.seller?.name}</p>
            <h1 className="mb-4 text-3xl text-[#17342E]" style={{ fontFamily: "var(--font-display)" }}>
              {listing.title}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">{listing.description}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-[2rem] border border-[#E0D0A6] bg-white/85 p-6 shadow-[0_18px_50px_rgba(94,75,40,0.08)] backdrop-blur-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">Current bid</p>
                <motion.p
                  key={priceFlashKey}
                  initial={{ scale: 1.15, color: "#BA8A26" }}
                  animate={{ scale: 1, color: "#17342E" }}
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
                  className="mb-4 rounded-xl border border-[#D6B368] bg-[#F7E7C0] px-3 py-2 text-xs text-[#7A5B14]"
                >
                  ⏱ Auction extended — a bid landed in the final seconds.
                </motion.div>
              )}
            </AnimatePresence>

            {listing.status === "ACTIVE" ? (
              <form onSubmit={handleBid} className="mb-6 space-y-3">
                <div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`${minNextBid.toLocaleString()} or more`}
                    className="w-full rounded-xl border border-[#D8C7A1] bg-[#F9F5EE] px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BA8A26] focus:ring-2 focus:ring-[#BA8A26]/20"
                  />
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Minimum bid: ${minNextBid.toLocaleString()}
                  </p>
                </div>
                {error && (
                  <p className="rounded-lg border border-[#FFB2B2] bg-[#FFF2F2] px-3 py-2 text-xs text-[#B93131]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#17342E] px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#214a43] disabled:opacity-50"
                >
                  {submitting ? "Placing bid…" : "Place bid"}
                </button>
              </form>
            ) : (
              <p className="mb-6 text-sm text-slate-500">This auction has ended.</p>
            )}

            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Bid history ({bids.length})
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {bids.map((bid) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between border-b border-[#F0E3C3] py-2 text-sm"
                    >
                      <span className="text-slate-600">{bid.bidder?.name || "Bidder"}</span>
                      <span className="font-semibold text-[#17342E]">${bid.amount.toLocaleString()}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {bids.length === 0 && <p className="text-sm text-slate-500">No bids yet — be the first.</p>}
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