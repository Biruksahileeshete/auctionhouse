"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Simple Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">AuctionHouse</span>
            </Link>

            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/create-listing"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                  >
                    List an item
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Discover & bid on amazing items
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Find unique items, place bids, and win auctions in real-time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                >
                  Start bidding
                </Link>
                <Link
                  href="#auctions"
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Browse auctions
                </Link>
              </div>
            </div>

            {/* Featured Listing */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              {featuredListing ? (
                <>
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Featured</div>
                  <div className="mt-2 h-48 bg-gray-200 rounded-md overflow-hidden">
                    {featuredListing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredListing.imageUrl}
                        alt={featuredListing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900">{featuredListing.title}</h3>
                  <p className="text-sm text-gray-600">
                    Starting at ${featuredListing.startingPrice.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">No featured listings available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Active auctions</p>
            <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Ending soon</p>
            <p className="text-2xl font-bold text-gray-900">
              {listings.filter((listing) => new Date(listing.endsAt).getTime() - Date.now() <= 60 * 60 * 1000).length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Your listings</p>
            <p className="text-2xl font-bold text-gray-900">{myListingsCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div id="auctions" className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              {(["all", "ending-soon", "my-auctions"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    filter === option
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option === "all" ? "All" : option === "ending-soon" ? "Ending soon" : "My auctions"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <p className="text-gray-600">Loading auctions...</p>
        ) : visibleListings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">No auctions match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleListings.map((listing, i) => (
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

  const imageUrl = listing.imageUrl && listing.imageUrl.trim() ? listing.imageUrl : null;

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-48 bg-gray-100 overflow-hidden">
          {imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{listing.title}</h3>
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                urgent ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {timeLeft || "Live"}
            </span>
          </div>

          <div className="mt-3 flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current bid</p>
              <p className="text-xl font-bold text-gray-900">
                ${(listing.currentPrice ?? listing.startingPrice).toLocaleString()}
              </p>
            </div>
            <span className="text-sm text-gray-600">
              {listing.bids?.length ?? 0} bids
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}