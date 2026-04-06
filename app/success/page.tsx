"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ─── Plan Data ─── */
const PLANS: Record<string, {
  name: string;
  price: number;
  monthlyEquiv: number;
  features: string[];
  badge: string;
  badgeColor: string;
}> = {
  ltd_starter: {
    name: "Starter",
    price: 99,
    monthlyEquiv: 49,
    features: ["5 AI Agents", "10,000 credits", "Website embed", "Lead capture", "Free updates forever", "Priority support"],
    badge: "Lifetime Starter",
    badgeColor: "from-blue-500 to-cyan-400",
  },
  ltd_pro: {
    name: "Pro",
    price: 199,
    monthlyEquiv: 149,
    features: ["Unlimited AI Agents", "50,000 credits", "Instagram integration", "Voice agent", "Advanced CRM", "Free updates forever"],
    badge: "Lifetime Pro",
    badgeColor: "from-purple-500 to-pink-500",
  },
  ltd_agency: {
    name: "Agency",
    price: 399,
    monthlyEquiv: 149,
    features: ["Unlimited AI Agents", "200,000 credits", "White-label branding", "Resell to clients", "All integrations", "Dedicated manager"],
    badge: "Lifetime Agency",
    badgeColor: "from-amber-400 to-orange-500",
  },
};

/* ─── Confetti ─── */
interface Particle { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rotSpeed: number; opacity: number; }

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#FF8C00","#00CED1","#FF69B4","#7B68EE","#00FA9A"];
    const particles: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 7 + 3, rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10, opacity: 1 });
    }
    let frame = 0;
    const maxFrames = 160;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      const fadeStart = maxFrames * 0.6;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rotation += p.rotSpeed;
        if (frame > fadeStart) p.opacity = Math.max(0, 1 - (frame - fadeStart) / (maxFrames - fadeStart));
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4); ctx.restore();
      }
      if (frame < maxFrames) requestAnimationFrame(animate);
    }
    animate();
    const h = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }} />;
}

/* ─── Main Content ─── */
function SuccessContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "ltd_starter";
  const plan = PLANS[planId] || PLANS.ltd_starter;
  const savings = plan.monthlyEquiv * 12 * 3 - plan.price;

  const [mounted, setMounted] = useState(false);
  const [checkShow, setCheckShow] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); setTimeout(() => setCheckShow(true), 300); }, []);

  return (
    <div className="h-screen relative overflow-hidden flex flex-col" style={{ background: "linear-gradient(135deg, #030712 0%, #0a0f1e 40%, #0d1117 100%)", fontFamily: "'Inter', sans-serif" }}>
      <ConfettiCanvas />

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.4) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)" }} />

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-2xl mx-auto px-4 w-full">

        {/* Check + Title Row */}
        <div className="text-center mb-5 transition-all duration-700" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)" }}>
          {/* Animated Check */}
          <div className="relative mx-auto mb-4" style={{ width: 64, height: 64 }}>
            <div className="absolute inset-0 rounded-full transition-all duration-1000" style={{ background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)", transform: checkShow ? "scale(1.5)" : "scale(0)", opacity: checkShow ? 1 : 0 }} />
            <div className="absolute inset-0 rounded-full border-[3px] border-green-400 flex items-center justify-center transition-all duration-700" style={{ transform: checkShow ? "scale(1)" : "scale(0)", opacity: checkShow ? 1 : 0, boxShadow: checkShow ? "0 0 30px rgba(74,222,128,0.4)" : "none" }}>
              <svg viewBox="0 0 24 24" width={32} height={32}><path d="M5 13l4 4L19 7" fill="none" stroke="#4ade80" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 30, strokeDashoffset: checkShow ? 0 : 30, transition: "stroke-dashoffset 0.6s ease 0.5s" }} /></svg>
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Welcome to Agent Forja <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">— Forever.</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            Your <span className="text-white font-semibold">{plan.name} Lifetime Deal</span> is now active.
          </p>
        </div>

        {/* Badge + Savings Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 transition-all duration-700" style={{ opacity: mounted ? 1 : 0, transitionDelay: "400ms" }}>
          {/* Badge */}
          <div className="p-[1px] rounded-xl bg-gradient-to-r from-amber-400/60 via-yellow-300/40 to-orange-500/60">
            <div className="rounded-xl bg-[#0a0f1e]/95 px-5 py-3 text-center">
              <div className="text-[10px] text-amber-400/70 uppercase tracking-[0.15em] font-semibold">Exclusive Member</div>
              <div className={`text-base font-black bg-gradient-to-r ${plan.badgeColor} bg-clip-text text-transparent`}>{plan.badge}</div>
            </div>
          </div>
          {/* Savings */}
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Saved over 3 years</div>
            <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">${savings.toLocaleString()}</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-6 transition-all duration-700" style={{ opacity: mounted ? 1 : 0, transitionDelay: "500ms" }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="flex-shrink-0"><path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-white/90 text-xs md:text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 transition-all duration-700" style={{ opacity: mounted ? 1 : 0, transitionDelay: "600ms" }}>
          <a href="/" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 px-6 py-3 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-purple-500/20">
            🚀 Create Your First Bot
          </a>
          <a href="/dashboard" className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] px-6 py-3 text-white font-semibold text-sm transition-all duration-300">
            📊 Go to Dashboard
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-600 text-[11px] transition-all duration-700" style={{ opacity: mounted ? 1 : 0, transitionDelay: "700ms" }}>
          Receipt sent by Paddle · <a href="mailto:support@agentforja.com" className="text-purple-400 hover:text-purple-300">support@agentforja.com</a>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ background: "#030712" }}><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
