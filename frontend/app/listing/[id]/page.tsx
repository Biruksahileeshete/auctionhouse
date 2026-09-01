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
  const [startingPrice, setStartingPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      const { listing } = await createListing(
        {
          title,
          description,
          imageUrl: imageUrl || undefined,
          startingPrice: parseFloat(startingPrice),
          minIncrement: parseFloat(minIncrement),
          durationMinutes: parseInt(durationMinutes),
        },
        token
      );
      router.push(`/listing/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-lg mx-auto">
        <nav className="flex items-center justify-between mb-10">
          <Link href="/">
            <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Auction<span className="text-[#D4AF37]">House</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-[#8A9690] hover:text-[#F0EDE4] transition-colors">
            ← Cancel
          </Link>
        </nav>

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
              placeholder="Vintage Camera"
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
              placeholder="Describe the item…"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8A9690] mb-1.5">
              Image URL <span className="text-[#3A4A40]">(optional)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              placeholder="https://…"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#8A9690] mb-1.5">Starting price</label>
              <input
                type="number"
                step="0.01"
                required
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8A9690] mb-1.5">Min increment</label>
              <input
                type="number"
                step="0.01"
                required
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8A9690] mb-1.5">Duration (min)</label>
              <input
                type="number"
                required
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
            disabled={submitting}
            className="w-full bg-[#D4AF37] text-[#0A120D] font-medium rounded-lg py-2.5 text-sm hover:bg-[#E5C158] transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Start auction"}
          </button>
        </form>
      </div>
    </div>
  );
}
