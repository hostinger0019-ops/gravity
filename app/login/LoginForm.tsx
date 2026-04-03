"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginForm({ fallbackNext }: { fallbackNext: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") || fallbackNext;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  // Email OTP state
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      localStorage.setItem("user_email", session.user.email || "");
      localStorage.setItem("user_id", (session.user as any).gpu_id || "");
      localStorage.setItem("user_name", session.user.name || "");
      localStorage.setItem("user_avatar", session.user.image || "");
      router.replace(next);
    }
  }, [status, session, router, next]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: next });
  }

  async function handleSendOTP() {
    if (!email || !email.includes("@")) {
      setOtpError("Please enter a valid email");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setCountdown(60);
      } else {
        setOtpError(data.error || "Failed to send code");
      }
    } catch {
      setOtpError("Network error. Try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (otpCode.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      // Let NextAuth CredentialsProvider handle verification directly
      const result = await signIn("credentials", {
        redirect: false,
        email,
        otp: otpCode,
      });
      if (result?.ok) {
        router.replace(next);
      } else {
        setOtpError("Invalid or expired code. Try again.");
      }
    } catch {
      setOtpError("Network error. Try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="w-full max-w-md border border-white/10 rounded-xl p-6 bg-white/5">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md border border-white/10 rounded-xl p-6 bg-white/5">
      <h1 className="text-2xl font-semibold mb-2">Welcome to Agent Forja</h1>
      <p className="text-sm text-slate-400 mb-6">Sign in to create and manage your AI chatbots</p>

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-black py-3 px-4 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px bg-white/10 flex-1"></div>
        <span className="text-xs text-slate-500 uppercase">or</span>
        <div className="h-px bg-white/10 flex-1"></div>
      </div>

      {/* Email OTP Login */}
      {!otpSent ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
              className="w-full rounded bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          {otpError && <p className="text-red-400 text-sm">{otpError}</p>}
          <button
            onClick={handleSendOTP}
            disabled={otpLoading}
            className="w-full rounded bg-blue-600 hover:bg-blue-500 py-2.5 font-medium transition-colors disabled:opacity-50"
          >
            {otpLoading ? "Sending..." : "Send verification code"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
          </p>
          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
              className="w-full rounded bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-blue-500/50 transition-colors text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
              autoFocus
            />
          </div>
          {otpError && <p className="text-red-400 text-sm">{otpError}</p>}
          <button
            onClick={handleVerifyOTP}
            disabled={otpLoading || otpCode.length !== 6}
            className="w-full rounded bg-blue-600 hover:bg-blue-500 py-2.5 font-medium transition-colors disabled:opacity-50"
          >
            {otpLoading ? "Verifying..." : "Verify & sign in"}
          </button>
          <div className="flex justify-between items-center">
            <button
              onClick={() => { setOtpSent(false); setOtpCode(""); setOtpError(""); }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Change email
            </button>
            <button
              onClick={handleSendOTP}
              disabled={countdown > 0 || otpLoading}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-center text-slate-500">
        By signing in, you agree to our Terms of Service and Privacy Policy.
        <br />You get <span className="text-blue-400 font-medium">50 free credits</span> on signup! 🎉
      </p>
    </div>
  );
}
