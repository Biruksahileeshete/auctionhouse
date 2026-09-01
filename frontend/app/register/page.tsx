"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, saveToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await register(name, email, password);
      saveToken(token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-700/80 bg-slate-950/75 p-7 shadow-[0_0_30px_rgba(14,165,233,0.1)] backdrop-blur-xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-lg font-bold text-slate-950 shadow-[0_0_30px_rgba(96,165,250,0.45)]">
            A
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">
            Auction<span className="text-cyan-300">House</span>
          </span>
        </Link>

        <h1 className="mb-8 text-3xl font-semibold text-white">Create your account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Full name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="At least 8 characters"
            />
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-300 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}