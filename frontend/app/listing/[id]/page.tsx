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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_right,_rgba(139,92,246,0.15),transparent_24%),linear-gradient(180deg,#040b14_0%,#091a29_36%,#040b14_100%)]">
        <p className="text-sm text-slate-300">Loading…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_right,_rgba(139,92,246,0.15),transparent_24%),linear-gradient(180deg,#040b14_0%,#091a29_36%,#040b14_100%)]">
        <p className="text-sm text-slate-300">Listing not found.</p>
      </div>
    );
  }

  const currentPrice = listing.currentPrice ?? listing.startingPrice;
  const minNextBid = listing.currentPrice ? currentPrice + listing.minIncrement : listing.startingPrice;
  const imageUrl = listing.imageUrl && listing.imageUrl.trim() ? listing.imageUrl : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_right,_rgba(139,92,246,0.15),transparent_24%),linear-gradient(180deg,#040b14_0%,#091a29_36%,#040b14_100%)] text-slate-100">
      <nav className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-3 shadow-[0_0_30px_rgba(14,165,233,0.12)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-lg font-bold text-slate-950 shadow-[0_0_30px_rgba(96,165,250,0.55)]">
              A
            </div>
            <span className="text-2xl font-semibold tracking-tight text-white">
              Auction<span className="text-cyan-300">House</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-slate-300 transition hover:text-cyan-300">
              ← All auctions
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {outbidFlash && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500 px-4 py-2 text-center text-sm font-medium text-white"
          >
            You&apos;ve been outbid! Someone just placed a higher bid.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-700/80 bg-slate-950/70 shadow-[0_18px_60px_rgba(14,116,144,0.16)]">
            {imageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-[420px] w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),rgba(15,23,42,1)_60%)] text-lg font-medium text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-700/80 bg-slate-950/70 p-6 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-400">Sold by {listing.seller?.name}</p>
            <h1 className="mb-4 text-3xl font-semibold text-white">{listing.title}</h1>
            <p className="text-sm leading-relaxed text-slate-300">{listing.description}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-[2rem] border border-slate-700/80 bg-slate-950/75 p-6 shadow-[0_18px_60px_rgba(14,116,144,0.18)] backdrop-blur-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">Current bid</p>
                <motion.p
                  key={priceFlashKey}
                  initial={{ scale: 1.15, color: "#7dd3fc" }}
                  animate={{ scale: 1, color: "#f8fafc" }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl font-semibold"
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
                  className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Minimum bid: ${minNextBid.toLocaleString()}
                  </p>
                </div>
                {error && (
                  <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Placing bid…" : "Place bid"}
                </button>
              </form>
            ) : (
              <p className="mb-6 text-sm text-slate-400">This auction has ended.</p>
            )}

            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Bid history ({bids.length})
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {bids.map((bid) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between border-b border-slate-800 py-2 text-sm"
                    >
                      <span className="text-slate-300">{bid.bidder?.name || "Bidder"}</span>
                      <span className="font-semibold text-white">${bid.amount.toLocaleString()}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {bids.length === 0 && <p className="text-sm text-slate-400">No bids yet — be the first.</p>}
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
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Time left</p>
      <p className={`text-xl font-mono ${urgent ? "animate-pulse text-rose-300" : "text-cyan-200"}`}>
        {timeLeft}
      </p>
    </div>
  );
}