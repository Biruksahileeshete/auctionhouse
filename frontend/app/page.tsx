"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { listListings, getToken, getCurrentUserId, clearToken, Listing } from "@/lib/api";

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "ending-soon" | "my-auctions">("all");

  useEffect(() => {
    const token = getToken();
    const userId = getCurrentUserId();
    setIsLoggedIn(!!token);
    setCurrentUserId(userId);

    listListings()
      .then(({ listings }) => setListings(listings))
      .finally(() => setLoading(false));
  }, []);

  const visibleListings = useMemo(() => {
    return listings
      .filter((listing) => {
        const matchesQuery = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
          filter === "all"
            ? true
            : filter === "ending-soon"
              ? new Date(listing.endsAt).getTime() - Date.now() <= 60 * 60 * 1000
              : currentUserId !== null && listing.sellerId === currentUserId;

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
  }, [listings, searchTerm, filter, currentUserId]);

  const featuredListing = listings.find((listing) => Boolean(listing.imageUrl)) ?? listings[0];
  const myListingsCount = listings.filter((listing) => listing.sellerId === currentUserId).length;

  const handleSignOut = () => {
    clearToken();
    setIsLoggedIn(false);
    setCurrentUserId(null);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_right,_rgba(139,92,246,0.18),transparent_24%),linear-gradient(180deg,#040b14_0%,#091a29_36%,#040b14_100%)] text-slate-100">
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
            {isLoggedIn ? (
              <>
                <Link
                  href="/create-listing"
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  List an item
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 transition hover:text-cyan-300">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(96,165,250,0.35)] transition hover:brightness-110"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pb-8 pt-12">
        <div className="grid items-center gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
              AI-powered live market
            </p>
            <h1 className="max-w-xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-sans)" }}>
              Smarter bidding for rare finds and standout moments.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Discover high-signal auctions, monitor fast-moving bids, and place confident offers with real-time market intelligence.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(14,165,233,0.32)] transition hover:brightness-110"
              >
                Start bidding
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Explore auctions
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(14,116,144,0.25)] backdrop-blur-xl">
            {featuredListing ? (
              <div>
                <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-400">
                  <span>Featured drop</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    +24.8%
                  </span>
                </div>
                <div className="mb-4 overflow-hidden rounded-[1.4rem] border border-slate-700/80 bg-slate-900">
                  {featuredListing.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featuredListing.imageUrl} alt={featuredListing.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-slate-400">No image</div>
                  )}
                </div>
                <p className="text-lg font-semibold text-white">{featuredListing.title}</p>
                <p className="mt-2 text-sm text-slate-300">
                  Starting at ${featuredListing.startingPrice.toLocaleString()} · Ends soon
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No featured listings yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.4rem] border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_0_20px_rgba(14,165,233,0.08)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Active auctions</p>
            <p className="mt-2 text-3xl font-bold text-white">{listings.length}</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_0_20px_rgba(14,165,233,0.08)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Ending soon</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {listings.filter((listing) => new Date(listing.endsAt).getTime() - Date.now() <= 60 * 60 * 1000).length}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_0_20px_rgba(14,165,233,0.08)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Your listings</p>
            <p className="mt-2 text-3xl font-bold text-white">{myListingsCount}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-[1.6rem] border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_0_25px_rgba(14,165,233,0.06)] backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title…"
            className="w-full max-w-[260px] rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            {(["all", "ending-soon", "my-auctions"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition sm:text-sm ${
                  filter === option
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
                    : "border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                }`}
              >
                {option === "all" ? "All" : option === "ending-soon" ? "Ending soon" : "My auctions"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-300">Loading auctions…</p>
        ) : visibleListings.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-700/80 bg-slate-950/70 p-12 text-center shadow-[0_0_20px_rgba(14,165,233,0.06)]">
            <p className="text-slate-300">No auctions match your search right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleListings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function makeListingPlaceholder(title: string) {
  const safeTitle = title.replace(/&/g, "and").slice(0, 28) || "Auction item";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="32%" stop-color="#172554"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="930" cy="170" r="120" fill="#7dd3fc" fill-opacity="0.2"/>
      <circle cx="250" cy="740" r="180" fill="#8b5cf6" fill-opacity="0.18"/>
      <rect x="160" y="300" width="880" height="250" rx="32" fill="#E2E8F0" fill-opacity="0.08" stroke="#94a3b8" stroke-opacity="0.32"/>
      <text x="600" y="448" text-anchor="middle" fill="#E2E8F0" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700">${safeTitle}</text>
      <text x="600" y="520" text-anchor="middle" fill="#BFDBFE" font-family="Arial, Helvetica, sans-serif" font-size="30">AuralBid</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function ListingCard({ listing, index }: { listing: Listing; index: number }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(listing.endsAt).getTime() - Date.now();
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
  }, [listing.endsAt]);

  const imageUrl = listing.imageUrl && listing.imageUrl.trim() ? listing.imageUrl : makeListingPlaceholder(listing.title);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link href={`/listing/${listing.id}`}>
        <div className="group overflow-hidden rounded-[1.5rem] border border-slate-700/80 bg-slate-950/75 shadow-[0_12px_40px_rgba(8,15,22,0.55)] transition duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_18px_40px_rgba(34,211,238,0.12)]">
          <div className="relative h-48 overflow-hidden bg-slate-900">
            {!imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.16),rgba(15,23,42,1)_52%)] text-xs font-medium text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="space-y-3 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-base font-semibold text-white">{listing.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  urgent ? "bg-rose-500/10 text-rose-300" : "bg-cyan-500/10 text-cyan-300"
                }`}
              >
                {timeLeft || "Live"}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Current bid</p>
                <p className="mt-1 text-xl text-white" style={{ fontFamily: "var(--font-sans)" }}>
                  ${(listing.currentPrice ?? listing.startingPrice).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200">
                {listing.bids?.length ?? 0} bids
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
