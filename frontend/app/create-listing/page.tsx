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
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto w-full max-w-2xl bg-white rounded-lg border border-gray-200 p-6 shadow-sm sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">AuctionHouse</span>
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">List an item</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Vintage watch"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Describe the item, condition, provenance, and any notable details."
            />
          </div>

          <div className="space-y-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                className="w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="https://example.com/item.jpg"
              />
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            {imagePreview && (
              <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                <img src={imagePreview} alt="Listing preview" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Starting price</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Min increment</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Listing item..." : "List item"}
          </button>
        </form>
      </div>
    </div>
  );
}