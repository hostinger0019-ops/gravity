"use client";

import { useEffect, useState } from "react";

const devNoAuth = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // In dev-no-auth mode, show a placeholder user
    if (devNoAuth) {
      setEmail("dev@localhost");
      return;
    }
    // In production, we'd integrate with a proper auth provider.
    // For now, check if there's a stored user session.
    try {
      const stored = localStorage.getItem("user_email");
      if (stored) setEmail(stored);
    } catch { }
  }, []);

  if (!email) {
    return (
      <a href="/login" className="text-sm text-slate-300 hover:text-white">Sign in</a>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span>{email}</span>
      <button
        className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
        onClick={() => {
          localStorage.removeItem("user_email");
          window.location.href = "/";
        }}
      >
        Sign out
      </button>
    </div>
  );
}
