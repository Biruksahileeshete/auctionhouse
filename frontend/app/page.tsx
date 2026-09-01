"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { listListings, getToken, Listing } from "@/lib/api";

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
    listListings()
      .then(({ listings }) => setListings(listings))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#D4AF37]/10">
        <Link href="/">
          <span
            className="text-2xl tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Auction<span className="text-[#D4AF37]">House</span>
          </span>
        </Link>
        <div className="flex items-center gap-5">
          {isLoggedIn ? (
            <Link
              href="/create-listing"
              className="text-sm bg-[#D4AF37] text-[#0A120D] font-medium rounded-lg px-4 py-2 hover:bg-[#E5C158] transition-colors"
            >
              List an item
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#8A9690] hover:text-[#F0EDE4] transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-[#D4AF37] text-[#0A120D] font-medium rounded-lg px-4 py-2 hover:bg-[#E5C158] transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-4">Live Auctions</p>
        <h1
          className="text-4xl sm:text-5xl leading-[1.1] max-w-xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Every bid, live. Every second, counted.
        </h1>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <p className="text-[#8A9690] text-sm">Loading auctions…</p>
        ) : listings.length === 0 ? (
          <div className="border border-[#D4AF37]/10 rounded-2xl p-12 text-center">
            <p className="text-[#8A9690] text-sm">No active auctions right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing, index }: { listing: Listing; index: number }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/listing/${listing.id}`}>
        <div className="border border-[#D4AF37]/10 rounded-2xl overflow-hidden bg-[#0F1B14] hover:border-[#D4AF37]/30 transition-colors group">
          <div className="aspect-[4/3] bg-[#12201A] flex items-center justify-center overflow-hidden">
            {listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#3A4A40] text-xs">No image</span>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-1">
              {listing.title}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-[#8A9690] uppercase tracking-wide mb-0.5">
                  Current bid
                </p>
                <p className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
                  ${(listing.currentPrice ?? listing.startingPrice).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-xs font-mono px-2 py-1 rounded-md ${
                  urgent
                    ? "bg-[#FF4757]/15 text-[#FF4757] animate-pulse"
                    : "bg-[#D4AF37]/10 text-[#D4AF37]"
                }`}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
