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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(184,166,130,0.32),transparent_32%),linear-gradient(180deg,#f7f3ec_0%,#eef6f3_48%,#f7f3ec_100%)] text-slate-800">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#C7B38A]/40">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#C89B3C] via-[#E7D7A8] to-[#90B4A4] shadow-lg shadow-[#C89B3C]/25 flex items-center justify-center text-lg font-bold text-[#17342E]">A</div>
          <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Auction<span className="text-[#BA8A26]">House</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/create-listing"
                className="rounded-full bg-[#17342E] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#214a43]"
              >
                List an item
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-[#17342E]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#17342E] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-[#17342E] transition hover:text-[#BA8A26]">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#BA8A26] px-4 py-2 text-sm font-medium text-[#17342E] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#D9AF46]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#BA8A26]">Live Auctions</p>
            <h1 className="max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Curated deals, real bidding energy, and better moments.
            </h1>
          </div>

          <div className="rounded-[2rem] border border-[#D8C7A1] bg-white/75 p-5 shadow-[0_18px_50px_rgba(94,75,40,0.08)] backdrop-blur-sm">
            {featuredListing ? (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Featured drop</p>
                <div className="mb-3 overflow-hidden rounded-2xl border border-[#E2D4A8] bg-[#F7F1E2]">
                  {featuredListing.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featuredListing.imageUrl} alt={featuredListing.title} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-sm text-slate-500">No image</div>
                  )}
                </div>
                <p className="text-lg font-semibold text-[#17342E]">{featuredListing.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Starting at ${featuredListing.startingPrice.toLocaleString()} · Ends soon
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No featured listings yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#D8C7A1] bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Active auctions</p>
            <p className="mt-2 text-3xl font-bold text-[#17342E]">{listings.length}</p>
          </div>
          <div className="rounded-2xl border border-[#D8C7A1] bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Ending soon</p>
            <p className="mt-2 text-3xl font-bold text-[#17342E]">
              {listings.filter((listing) => new Date(listing.endsAt).getTime() - Date.now() <= 60 * 60 * 1000).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D8C7A1] bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Your listings</p>
            <p className="mt-2 text-3xl font-bold text-[#17342E]">{myListingsCount}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-[#D8C7A1] bg-white/70 p-4 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-full border border-[#D8C7A1] bg-[#F9F5EE] px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BA8A26] focus:ring-2 focus:ring-[#BA8A26]/20"
          />
          <div className="flex gap-2">
            {(["all", "ending-soon", "my-auctions"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === option
                    ? "bg-[#17342E] text-white"
                    : "border border-[#D8C7A1] bg-white text-slate-700 hover:bg-[#F4E9D1]"
                }`}
              >
                {option === "all" ? "All" : option === "ending-soon" ? "Ending soon" : "My auctions"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading auctions…</p>
        ) : visibleListings.length === 0 ? (
          <div className="border border-[#D8C7A1] rounded-[2rem] bg-white/70 p-12 text-center shadow-sm">
            <p className="text-slate-600">No auctions match your search right now.</p>
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
          <stop offset="0%" stop-color="#F7E7C0"/>
          <stop offset="52%" stop-color="#D8EAE2"/>
          <stop offset="100%" stop-color="#E9F0F6"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="920" cy="170" r="120" fill="#E6C76F" fill-opacity="0.42"/>
      <circle cx="250" cy="740" r="170" fill="#9EB7A8" fill-opacity="0.4"/>
      <rect x="160" y="300" width="880" height="250" rx="32" fill="#FFFFFF" fill-opacity="0.55"/>
      <text x="600" y="448" text-anchor="middle" fill="#17342E" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700">${safeTitle}</text>
      <text x="600" y="520" text-anchor="middle" fill="#4B5D58" font-family="Arial, Helvetica, sans-serif" font-size="28">AuctionHouse</text>
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
        <div className="group overflow-hidden rounded-[1.5rem] border border-[#E0D0A6] bg-white/80 shadow-[0_12px_30px_rgba(71,55,25,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#BA8A26]/50 hover:shadow-[0_18px_40px_rgba(116,89,43,0.12)]">
          <div className="relative h-48 overflow-hidden bg-[#F1E8D7]">
            {!imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={() => {
                  setImageFailed(true);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(201,155,60,0.24),rgba(247,243,236,1)_58%)] text-xs font-medium text-slate-500">
                No image
              </div>
            )}
          </div>

          <div className="space-y-3 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-base font-semibold text-[#17342E]">{listing.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  urgent ? "bg-[#FCE6E6] text-[#D14A4A]" : "bg-[#F3EAC6] text-[#8D6723]"
                }`}
              >
                {timeLeft || "Live"}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Current bid</p>
                <p className="mt-1 text-xl text-[#17342E]" style={{ fontFamily: "var(--font-display)" }}>
                  ${(listing.currentPrice ?? listing.startingPrice).toLocaleString()}
                </p>
              </div>
              <span className="text-[11px] text-slate-500">{listing.bids?.length ?? 0} bids</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
