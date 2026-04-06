"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ─── Plan Data ─── */
const PLANS: Record<string, {
  name: string;
  price: number;
  monthlyEquiv: number;
  features: string[];
  badge: string;
  gradient: string;
  glow: string;
}> = {
  ltd_starter: {
    name: "Starter",
    price: 99,
    monthlyEquiv: 49,
    features: ["5 AI Agents", "10,000 Credits", "Website Embed", "Lead Capture", "Lifetime Updates", "Priority Support"],
    badge: "LIFETIME STARTER",
    gradient: "from-sky-400 via-blue-500 to-indigo-500",
    glow: "rgba(56,189,248,0.15)",
  },
  ltd_pro: {
    name: "Pro",
    price: 199,
    monthlyEquiv: 149,
    features: ["Unlimited Agents", "50,000 Credits", "Instagram Bot", "Voice Agent", "Advanced CRM", "Lifetime Updates"],
    badge: "LIFETIME PRO",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-500",
    glow: "rgba(167,139,250,0.15)",
  },
  ltd_agency: {
    name: "Agency",
    price: 399,
    monthlyEquiv: 149,
    features: ["Unlimited Agents", "200,000 Credits", "White-Label", "Resell Access", "All Integrations", "Dedicated Manager"],
    badge: "LIFETIME AGENCY",
    gradient: "from-amber-300 via-orange-400 to-rose-400",
    glow: "rgba(251,191,36,0.15)",
  },
};

/* ─── Floating Particles ─── */
function FloatingOrbs({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: 120 + i * 40,
            height: 120 + i * 40,
            background: color,
            left: `${15 + i * 14}%`,
            top: `${10 + (i % 3) * 30}%`,
            animation: `float${i % 3} ${8 + i * 2}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float0 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.1); } }
        @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,30px) scale(0.9); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1.05); } 50% { transform: translate(15px,15px) scale(0.95); } }
      `}</style>
    </div>
  );
}

/* ─── Confetti Burst ─── */
function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const cols = ["#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#DDA0DD","#FF8C00","#7B68EE","#00FA9A"];
    const ps: { x:number;y:number;vx:number;vy:number;c:string;s:number;r:number;rs:number;o:number }[] = [];
    for (let i = 0; i < 100; i++) ps.push({ x: c.width/2, y: c.height/2, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12-4, c: cols[~~(Math.random()*cols.length)], s: Math.random()*6+3, r: Math.random()*360, rs: (Math.random()-0.5)*12, o: 1 });
    let f = 0;
    function draw() {
      if (!ctx||!c) return;
      ctx.clearRect(0,0,c.width,c.height);
      f++;
      for (const p of ps) {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.r+=p.rs; p.vx*=0.99;
        if (f>60) p.o=Math.max(0,p.o-0.02);
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r*Math.PI/180); ctx.globalAlpha=p.o; ctx.fillStyle=p.c;
        ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); ctx.restore();
      }
      if (f<150) requestAnimationFrame(draw);
    }
    draw();
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }} />;
}

/* ─── Shimmer Border Card ─── */
function ShimmerCard({ children, gradient }: { children: React.ReactNode; gradient: string }) {
  return (
    <div className="relative rounded-2xl p-[1.5px] overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} style={{ animation: "shimmer 3s linear infinite" }} />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmerSlide 2.5s ease-in-out infinite", transform: "skewX(-20deg)" }} />
      <div className="relative rounded-2xl bg-[#0a0e1a]/95 backdrop-blur-xl">
        {children}
      </div>
      <style>{`
        @keyframes shimmerSlide { 0% { transform: translateX(-200%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
      `}</style>
    </div>
  );
}

/* ─── Main ─── */
function SuccessContent() {
  const sp = useSearchParams();
  const planId = sp.get("plan") || "ltd_starter";
  const plan = PLANS[planId] || PLANS.ltd_starter;
  const savings = plan.monthlyEquiv * 36 - plan.price;

  const [m, setM] = useState(false);
  const [ck, setCk] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => { setTimeout(() => setM(true), 100); setTimeout(() => setCk(true), 400); }, []);
  useEffect(() => {
    const dur = 1800, st = Date.now();
    const t = setInterval(() => {
      const p = Math.min((Date.now() - st) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * savings));
      if (p >= 1) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [savings]);

  return (
    <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center" style={{ background: "#050810", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <ConfettiBurst />
      <FloatingOrbs color={plan.glow} />

      {/* Radial glow behind content */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle, ${plan.glow} 0%, transparent 70%)`, top: "20%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="relative z-10 w-full max-w-lg px-5">

        {/* ✓ Check */}
        <div className="flex justify-center mb-5">
          <div className="relative" style={{ width: 56, height: 56 }}>
            <div className="absolute inset-0 rounded-full transition-all duration-1000" style={{ background: "radial-gradient(circle, rgba(74,222,128,0.35) 0%, transparent 70%)", transform: ck ? "scale(2)" : "scale(0)", opacity: ck ? 1 : 0 }} />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/80 flex items-center justify-center transition-all duration-700 backdrop-blur-sm" style={{ transform: ck ? "scale(1)" : "scale(0)", opacity: ck ? 1 : 0, boxShadow: "0 0 20px rgba(52,211,153,0.3), inset 0 0 20px rgba(52,211,153,0.1)" }}>
              <svg viewBox="0 0 24 24" width={28} height={28}>
                <path d="M5 13l4 4L19 7" fill="none" stroke="#34d399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 30, strokeDashoffset: ck ? 0 : 30, transition: "stroke-dashoffset 0.5s ease 0.4s" }} />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6 transition-all duration-700" style={{ opacity: m ? 1 : 0, transform: m ? "translateY(0)" : "translateY(16px)" }}>
          <h1 className="text-[1.7rem] md:text-[2.2rem] font-extrabold text-white tracking-tight leading-[1.15]">
            Welcome to Agent Forja
          </h1>
          <h2 className={`text-[1.7rem] md:text-[2.2rem] font-extrabold tracking-tight leading-[1.15] bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
            — Forever.
          </h2>
          <p className="text-white/40 text-sm mt-2.5 font-medium">
            Your <span className="text-white/80">{plan.name} Lifetime Deal</span> is activated
          </p>
        </div>

        {/* Badge Card */}
        <div className="mb-5 transition-all duration-700" style={{ opacity: m ? 1 : 0, transform: m ? "scale(1)" : "scale(0.95)", transitionDelay: "300ms" }}>
          <ShimmerCard gradient={plan.gradient}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-0.5">Exclusive Member</div>
                <div className={`text-sm font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent tracking-wide`}>{plan.badge}</div>
                <div className="text-[10px] text-white/25 mt-0.5">One-time · Lifetime · All Updates</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">You saved</div>
                <div className="text-xl font-black bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                  ${count.toLocaleString()}
                </div>
                <div className="text-[9px] text-white/20">vs ${plan.monthlyEquiv}/mo · 3 yrs</div>
              </div>
            </div>
          </ShimmerCard>
        </div>

        {/* Features */}
        <div className="mb-5 transition-all duration-700" style={{ opacity: m ? 1 : 0, transitionDelay: "450ms" }}>
          <div className="grid grid-cols-3 gap-1.5">
            {plan.features.map((f, i) => (
              <div
                key={i}
                className="group rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm px-3 py-2.5 text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="text-emerald-400/70 mb-1">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="mx-auto"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="text-white/70 text-[11px] font-medium leading-tight group-hover:text-white/90 transition-colors">{f}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2.5 mb-4 transition-all duration-700" style={{ opacity: m ? 1 : 0, transitionDelay: "550ms" }}>
          <a
            href="/"
            className={`flex-1 text-center rounded-xl bg-gradient-to-r ${plan.gradient} px-5 py-3 text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
            style={{ boxShadow: `0 8px 24px ${plan.glow}` }}
          >
            🚀 Create Your First Bot
          </a>
          <a
            href="/dashboard"
            className="flex-1 text-center rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-5 py-3 text-white/80 font-bold text-sm hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            📊 Dashboard
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-white/15 text-[10px] font-medium transition-all duration-700" style={{ opacity: m ? 1 : 0, transitionDelay: "650ms" }}>
          Receipt sent by Paddle · <a href="mailto:support@agentforja.com" className="text-white/25 hover:text-white/50 transition-colors underline decoration-white/10">support@agentforja.com</a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ background: "#050810" }}><div className="w-7 h-7 border-2 border-purple-500/50 border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
