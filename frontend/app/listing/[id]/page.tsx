"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { decodeJwtPayload, getListing, placeBid, getToken, clearToken, Listing, Bid } from "@/lib/api";
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
  const [imageFailed, setImageFailed] = useState(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = decodeJwtPayload<{ userId?: string }>(token);
      currentUserId.current = payload?.userId ?? null;
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
      getListing(listingId).then(({ listing }) => setBids(listing.bids || []));
    });

    socket.on("outbid", (data: { listingId: string; outbidUserId: string }) => {
      if (data.listingId !== listingId) return;
      if (data.outbidUserId === currentUserId.current) {
        // Show a simple alert or notification
        alert("You've been outbid!");
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Listing not found.</p>
      </div>
    );
  }

  const currentPrice = listing.currentPrice ?? listing.startingPrice;
  const minNextBid = listing.currentPrice ? currentPrice + listing.minIncrement : listing.startingPrice;
  const imageUrl = listing.imageUrl && listing.imageUrl.trim() ? listing.imageUrl : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">AuctionHouse</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                ← All auctions
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Image & Details */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
              {imageUrl && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={listing.title}
                  className="w-full h-96 object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-gray-100 text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Sold by {listing.seller?.name}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          </div>

          {/* Right Column - Bid Card */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current bid</p>
                  <p key={priceFlashKey} className="text-3xl font-bold text-gray-900">
                    ${currentPrice.toLocaleString()}
                  </p>
                </div>
                <CountdownDisplay endsAt={listing.endsAt} />
              </div>

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
                      className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1.5 text-sm text-gray-600">
                      Minimum bid: ${minNextBid.toLocaleString()}
                    </p>
                  </div>
                  {error && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Placing bid..." : "Place bid"}
                  </button>
                </form>
              ) : (
                <p className="mb-6 text-gray-600">This auction has ended.</p>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Bid history ({bids.length})
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {bids.map((bid) => (
                    <div key={bid.id} className="flex justify-between items-center border-b border-gray-100 py-2 text-sm">
                      <span className="text-gray-700">{bid.bidder?.name || "Bidder"}</span>
                      <span className="font-semibold text-gray-900">${bid.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {bids.length === 0 && <p className="text-gray-500 text-sm">No bids yet — be the first.</p>}
                </div>
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
      <p className="text-sm text-gray-600 mb-1">Time left</p>
      <p className={`text-xl font-mono ${urgent ? "text-red-600 font-bold" : "text-gray-900"}`}>
        {timeLeft}
      </p>
    </div>
  );
}