"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createListing, getToken } from "@/lib/api";

export default function CreateListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startingPrice, setStartingPrice] = useState("100");
  const [minIncrement, setMinIncrement] = useState("5");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const token = getToken();
    if (!token) {
      setError("You need to be signed in to list an item.");
      router.push("/login");
      return;
    }

    const parsedStartingPrice = Number(startingPrice);
    const parsedMinIncrement = Number(minIncrement);
    const parsedDurationMinutes = Number(durationMinutes);

    if (!Number.isFinite(parsedStartingPrice) || parsedStartingPrice <= 0) {
      setError("Starting price must be greater than 0.");
      return;
    }

    if (!Number.isFinite(parsedMinIncrement) || parsedMinIncrement <= 0) {
      setError("Minimum increment must be greater than 0.");
      return;
    }

    if (!Number.isFinite(parsedDurationMinutes) || parsedDurationMinutes <= 0) {
      setError("Auction duration must be greater than 0 minutes.");
      return;
    }

    setLoading(true);
    try {
      await createListing(
        {
          title,
          description,
          imageUrl: imageUrl.trim() || undefined,
          startingPrice: parsedStartingPrice,
          minIncrement: parsedMinIncrement,
          durationMinutes: parsedDurationMinutes,
        },
        token
      );
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <Link href="/" className="inline-block mb-8">
          <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Auction<span className="text-[#D4AF37]">House</span>
          </span>
        </Link>

        <h1 className="text-3xl mb-8" style={{ fontFamily: "var(--font-display)" }}>
          List an item
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8A9690] mb-1.5">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              placeholder="Vintage watch"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8A9690] mb-1.5">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors resize-none"
              placeholder="Describe the item, condition, provenance, and any notable details."
            />
          </div>

          <div>
            <label className="block text-xs text-[#8A9690] mb-1.5">Image URL (optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              placeholder="https://example.com/item.jpg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#8A9690] mb-1.5">Starting price</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8A9690] mb-1.5">Min increment</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8A9690] mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#FF4757] bg-[#FF4757]/10 border border-[#FF4757]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-[#0A120D] font-medium rounded-lg py-2.5 text-sm hover:bg-[#E5C158] transition-colors disabled:opacity-50"
          >
            {loading ? "Listing item…" : "List item"}
          </button>
        </form>
      </div>
    </div>
  );
}
