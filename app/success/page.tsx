"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ─── Plan Data ─── */
const PLANS: Record<string, {
  name: string;
  price: number;
  monthlyEquiv: number;
  bots: string;
  credits: string;
  features: string[];
  badge: string;
  badgeColor: string;
}> = {
  ltd_starter: {
    name: "Starter",
    price: 99,
    monthlyEquiv: 49,
    bots: "5 AI Agents",
    credits: "10,000",
    features: [
      "5 AI Chatbot Agents",
      "10,000 credits loaded",
      "Website embed widget",
      "Lead capture & analytics",
      "All future updates — free forever",
      "Priority email support",
    ],
    badge: "Lifetime Starter",
    badgeColor: "from-blue-500 to-cyan-400",
  },
  ltd_pro: {
    name: "Pro",
    price: 199,
    monthlyEquiv: 149,
    bots: "Unlimited AI Agents",
    credits: "50,000",
    features: [
      "Unlimited AI Chatbot Agents",
      "50,000 credits loaded",
      "Website + Instagram integration",
      "Voice agent support",
      "Advanced lead capture & CRM",
      "All future updates — free forever",
      "Priority support",
    ],
    badge: "Lifetime Pro",
    badgeColor: "from-purple-500 to-pink-500",
  },
  ltd_agency: {
    name: "Agency",
    price: 399,
    monthlyEquiv: 149,
    bots: "Unlimited AI Agents",
    credits: "200,000",
    features: [
      "Unlimited AI Chatbot Agents",
      "200,000 credits loaded",
      "White-label & custom branding",
      "Resell to your clients",
      "All integrations included",
      "Custom voice agent",
      "Dedicated account manager",
      "All future updates — free forever",
    ],
    badge: "Lifetime Agency",
    badgeColor: "from-amber-400 to-orange-500",
  },
};

/* ─── Confetti Particle ─── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
      "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF8C00",
      "#00CED1", "#FF69B4", "#7B68EE", "#00FA9A",
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frame++;
      const fadeStart = maxFrames * 0.6;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;

        if (frame > fadeStart) {
          p.opacity = Math.max(0, 1 - (frame - fadeStart) / (maxFrames - fadeStart));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
        ctx.restore();
      }

      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      }
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}

/* ─── Animated Check ─── */
function AnimatedCheck() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => setShow(true), 300);
  }, []);

  return (
    <div className="relative mx-auto mb-6" style={{ width: 100, height: 100 }}>
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000"
        style={{
          background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)",
          transform: show ? "scale(1.5)" : "scale(0)",
          opacity: show ? 1 : 0,
        }}
      />
      <div
        className="absolute inset-0 rounded-full border-4 border-green-400 flex items-center justify-center transition-all duration-700"
        style={{
          transform: show ? "scale(1)" : "scale(0)",
          opacity: show ? 1 : 0,
          boxShadow: show ? "0 0 40px rgba(74,222,128,0.4)" : "none",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={50}
          height={50}
          className="transition-all duration-500"
          style={{
            transform: show ? "scale(1)" : "scale(0)",
            transitionDelay: "400ms",
          }}
        >
          <path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="#4ade80"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: show ? 0 : 30,
              transition: "stroke-dashoffset 0.6s ease 0.5s",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ─── Savings Counter ─── */
function SavingsCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
      ${count.toLocaleString()}
    </span>
  );
}

/* ─── Feature Item ─── */
function FeatureItem({ text, delay }: { text: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => setShow(true), delay);
  }, [delay]);

  return (
    <li
      className="flex items-center gap-3 transition-all duration-500"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateX(0)" : "translateX(-20px)",
      }}
    >
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-white/90 text-sm md:text-base">{text}</span>
    </li>
  );
}

/* ─── Main Content ─── */
function SuccessContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "ltd_starter";
  const plan = PLANS[planId] || PLANS.ltd_starter;

  const savingsPerYear = plan.monthlyEquiv * 12;
  const savingsOver3Years = savingsPerYear * 3 - plan.price;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #030712 0%, #0a0f1e 40%, #0d1117 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <ConfettiCanvas />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(168,85,247,0.4) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-20">

        {/* Hero */}
        <div
          className="text-center mb-12 transition-all duration-1000"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
          }}
        >
          <AnimatedCheck />

          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Welcome to Agent Forja
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mt-1">
              — Forever.
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl mt-4">
            Your <span className="text-white font-semibold">{plan.name} Lifetime Deal</span> is now active.
          </p>
        </div>

        {/* Lifetime Member Badge */}
        <div
          className="mx-auto mb-10 max-w-sm transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.8)",
            transitionDelay: "500ms",
          }}
        >
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-amber-400/60 via-yellow-300/40 to-orange-500/60">
            <div className="rounded-2xl bg-[#0a0f1e]/95 backdrop-blur-xl px-6 py-5 text-center">
              <div className="text-xs text-amber-400/70 uppercase tracking-[0.2em] font-semibold mb-1">
                Exclusive Member
              </div>
              <div className={`text-xl font-black bg-gradient-to-r ${plan.badgeColor} bg-clip-text text-transparent`}>
                {plan.badge}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                One-time payment • Lifetime access • All future updates
              </div>
            </div>
          </div>
        </div>

        {/* Savings */}
        <div
          className="text-center mb-10 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "700ms",
          }}
        >
          <p className="text-slate-400 text-sm mb-1">You saved over 3 years</p>
          <SavingsCounter target={savingsOver3Years} />
          <p className="text-slate-500 text-xs mt-2">
            vs ${plan.monthlyEquiv}/mo × 36 months = ${savingsPerYear * 3}. You paid just ${plan.price}.
          </p>
        </div>

        {/* What You Unlocked */}
        <div
          className="mb-10 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "300ms",
          }}
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-2xl">🎁</span> What You Unlocked
            </h2>
            <ul className="space-y-3">
              {plan.features.map((f, i) => (
                <FeatureItem key={i} text={f} delay={800 + i * 150} />
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Start Actions */}
        <div
          className="mb-10 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "500ms",
          }}
        >
          <h2 className="text-lg font-bold text-white mb-4 text-center">
            Get Started Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/"
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300"
            >
              <div className="text-3xl mb-3">🚀</div>
              <div className="text-white font-semibold text-sm mb-1">Create Your First Bot</div>
              <div className="text-slate-500 text-xs">Build an AI agent in 60 seconds</div>
            </a>

            <a
              href="/dashboard"
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300"
            >
              <div className="text-3xl mb-3">📊</div>
              <div className="text-white font-semibold text-sm mb-1">Go to Dashboard</div>
              <div className="text-slate-500 text-xs">Manage your agents & leads</div>
            </a>

            <a
              href="mailto:support@agentforja.com"
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300"
            >
              <div className="text-3xl mb-3">💬</div>
              <div className="text-white font-semibold text-sm mb-1">Get Help</div>
              <div className="text-slate-500 text-xs">We&apos;re here for you — always</div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center text-slate-600 text-xs space-y-2 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transitionDelay: "700ms",
          }}
        >
          <p>A payment receipt has been emailed to you by Paddle.</p>
          <p>
            Need help?{" "}
            <a href="mailto:support@agentforja.com" className="text-purple-400 hover:text-purple-300 transition-colors">
              support@agentforja.com
            </a>
          </p>
          <p className="text-slate-700 mt-4">© 2026 Agent Forja. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#030712" }}
        >
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
