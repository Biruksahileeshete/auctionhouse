"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, saveToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await login(email, password);
      saveToken(token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign you in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block mb-10">
          <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Auction<span className="text-[#D4AF37]">House</span>
          </span>
        </Link>

        <h1 className="text-3xl mb-8" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8A9690] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8A9690] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F1B14] border border-[#D4AF37]/20 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
              placeholder="••••••••"
            />
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-sm text-[#8A9690]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#D4AF37] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
