"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const devNoAuth = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

export default function SignupForm({ fallbackNext }: { fallbackNext: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get("next") || fallbackNext;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (devNoAuth) {
      // In dev mode, just store credentials and redirect
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000000");
      router.replace(next);
      setLoading(false);
      return;
    }

    // Store credentials locally (in production, call a real auth API)
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000000");
    setMsg("Account created! Redirecting...");
    setTimeout(() => router.replace(next), 1000);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md border border-white/10 rounded-xl p-6 bg-white/5">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      {msg && <p className="mb-3 text-sm text-slate-300">{msg}</p>}
      <form className="space-y-3" onSubmit={signUp}>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 outline-none"
            placeholder="••••••••"
          />
        </div>
        <button disabled={loading} className="w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-500">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-300">
        Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`} className="text-blue-400 hover:underline">Sign in</a>
      </p>
    </div>
  );
}
