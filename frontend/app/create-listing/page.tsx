"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createListing, getToken } from "@/lib/api";

export default function CreateListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [startingPrice, setStartingPrice] = useState("100");
  const [minIncrement, setMinIncrement] = useState("5");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(result);
      setImageUrl("");
    };
    reader.readAsDataURL(file);
  }

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
          imageUrl: (imageUrl.trim() || imagePreview || undefined)?.trim() || undefined,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_right,_rgba(139,92,246,0.18),transparent_22%),linear-gradient(180deg,#040b14_0%,#091a29_36%,#040b14_100%)] px-6 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-slate-700/80 bg-slate-950/75 p-6 shadow-[0_0_30px_rgba(14,165,233,0.1)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-lg font-bold text-slate-950 shadow-[0_0_30px_rgba(96,165,250,0.45)]">
            A
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">
            Auction<span className="text-cyan-300">House</span>
          </span>
        </Link>

        <h1 className="mb-8 text-3xl font-semibold text-white">List an item</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Vintage watch"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Describe the item, condition, provenance, and any notable details."
            />
          </div>

          <div className="space-y-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Photo upload or image URL
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value.trim()) setImagePreview(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="https://example.com/item.jpg"
              />
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(96,165,250,0.35)] transition hover:brightness-110">
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            {imagePreview && (
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80">
                <img src={imagePreview} alt="Listing preview" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Starting price</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Min increment</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Duration</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Listing item…" : "List item"}
          </button>
        </form>
      </div>
    </div>
  );
}
