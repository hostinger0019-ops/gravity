"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

/* ─── Plan Definitions ─── */
const PLANS: Record<string, {
  name: string; category: string; priceCents: number;
  messageLimit: number; chatbotLimit: number; voiceIncluded: boolean;
  features: string[]; icon: string; gradient: string; glow: string;
}> = {
  free: { name: "Free", category: "free", priceCents: 0, messageLimit: 50, chatbotLimit: 1, voiceIncluded: false, features: ["1 chatbot", "50 messages/month", "Embed widget"], icon: "🆓", gradient: "from-slate-400 to-slate-500", glow: "rgba(148,163,184,0.12)" },
  starter: { name: "Starter", category: "monthly", priceCents: 4900, messageLimit: 5000, chatbotLimit: 5, voiceIncluded: false, features: ["5 chatbots", "5,000 messages/month", "Embed widget", "Lead capture", "Email support"], icon: "⚡", gradient: "from-sky-400 to-blue-500", glow: "rgba(56,189,248,0.12)" },
  pro: { name: "Pro", category: "monthly", priceCents: 14900, messageLimit: 20000, chatbotLimit: 0, voiceIncluded: true, features: ["Unlimited chatbots", "20,000 messages/month", "Voice bot included", "Instagram DM", "Advanced lead capture", "Priority support"], icon: "💎", gradient: "from-violet-400 to-purple-500", glow: "rgba(167,139,250,0.12)" },
  enterprise: { name: "Enterprise", category: "monthly", priceCents: 0, messageLimit: 0, chatbotLimit: 0, voiceIncluded: true, features: ["Unlimited everything", "Custom voice", "SLA guarantee", "Dedicated support"], icon: "🏢", gradient: "from-emerald-400 to-teal-500", glow: "rgba(52,211,153,0.12)" },
  ltd_starter: { name: "LTD Starter", category: "lifetime", priceCents: 9900, messageLimit: 2000, chatbotLimit: 3, voiceIncluded: false, features: ["3 chatbots", "2,000 messages/month", "White-label", "7 themes", "Lead capture"], icon: "🔥", gradient: "from-amber-400 to-orange-500", glow: "rgba(251,191,36,0.12)" },
  ltd_reseller_pro: { name: "LTD Reseller Pro", category: "lifetime", priceCents: 19900, messageLimit: 5000, chatbotLimit: 15, voiceIncluded: false, features: ["15 chatbots", "5,000 messages/month", "Instagram", "Smarter AI", "Priority support"], icon: "🚀", gradient: "from-rose-400 to-pink-500", glow: "rgba(251,113,133,0.12)" },
  ltd_agency_elite: { name: "LTD Agency Elite", category: "lifetime", priceCents: 39900, messageLimit: 15000, chatbotLimit: 30, voiceIncluded: true, features: ["30 chatbots", "15,000 messages/month", "Voice bot included", "Bring own API key", "Dedicated support"], icon: "👑", gradient: "from-amber-300 to-yellow-500", glow: "rgba(252,211,77,0.12)" },
};

function formatPrice(cents: number) {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

/* ─── Circular Progress Ring ─── */
function ProgressRing({ value, max, color, label, displayValue, sub }: {
  value: number; max: number; color: string; label: string; displayValue: string; sub: string;
}) {
  const [animated, setAnimated] = useState(0);
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percent), 300);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-300 group">
      <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
        <svg width={88} height={88} className="transform -rotate-90">
          <circle cx={44} cy={44} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
          <circle
            cx={44} cy={44} r={radius} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{animated}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-white">{displayValue}</div>
        <div className="text-xs text-white/25 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

/* ─── Credit Counter ─── */
function CreditDisplay({ balance, loading }: { balance: number; loading: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (loading) return;
    const dur = 1200, st = Date.now();
    const t = setInterval(() => {
      const p = Math.min((Date.now() - st) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * balance));
      if (p >= 1) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [balance, loading]);

  return (
    <div className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-300">
      <div className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Credit Balance</div>
      <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
        {loading ? "—" : count.toLocaleString()}
      </div>
      <div className="text-xs text-white/25 mt-1">1 credit per AI interaction</div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BillingPage() {
  const { data: session } = useSession();
  const [chatbotCount, setChatbotCount] = useState(0);
  const [usage, setUsage] = useState({ message_count: 0, voice_minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const userPlan = (session?.user as any)?.plan || "free";
  const creditBalance = (session?.user as any)?.credit_balance ?? 0;
  const plan = PLANS[userPlan] || PLANS.free;

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const botsRes = await fetch("/api/admin/chatbots");
        if (botsRes.ok) {
          const bots = await botsRes.json();
          setChatbotCount(Array.isArray(bots) ? bots.length : 0);
        }
        const gpuId = (session?.user as any)?.gpu_id;
        if (gpuId) {
          const usageRes = await fetch(`/api/usage?userId=${gpuId}`);
          if (usageRes.ok) setUsage(await usageRes.json());
        }
      } catch (e) {
        console.error("Failed to load billing data:", e);
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) loadData();
    else setLoading(false);
  }, [session]);

  const msgPercent = plan.messageLimit > 0 ? Math.min(100, Math.round((usage.message_count / plan.messageLimit) * 100)) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#050810", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Subtle top gradient */}
      <div className="fixed top-0 left-0 right-0 h-[400px] pointer-events-none opacity-40" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${plan.glow.replace('0.12', '0.25')}, transparent)` }} />

      <div className="relative z-10 max-w-[880px] mx-auto px-5 py-8 md:py-12">

        {/* Top Bar */}
        <div
          className="flex items-center justify-between mb-8 transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-10px)" }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Billing & Usage</h1>
            <p className="text-white/30 text-sm mt-1">Manage your subscription</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Account pill */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]">
              {session?.user?.image ? (
                <img src={session.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-[10px] font-bold text-white`}>
                  {(session?.user?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white/50 font-medium">{session?.user?.email?.split("@")[0]}</span>
            </div>
            <Link
              href="/admin/chatbots"
              className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 font-medium no-underline"
            >
              ← My Agents
            </Link>
          </div>
        </div>

        {/* ─── Plan Card ─── */}
        <div
          className="mb-6 transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transitionDelay: "100ms" }}
        >
          <div className={`relative rounded-2xl p-[1px] bg-gradient-to-r ${plan.gradient} overflow-hidden`}>
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "shimmer 3s ease-in-out infinite", transform: "skewX(-20deg)" }} />
            <div className="relative rounded-2xl bg-[#0a0e1a]/[0.97] backdrop-blur-xl px-6 py-5 md:px-8 md:py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-xl shadow-lg`} style={{ boxShadow: `0 8px 24px ${plan.glow}` }}>
                    {plan.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>{plan.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        plan.category === "lifetime"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : plan.category === "monthly"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>{plan.category === "lifetime" ? "Lifetime" : plan.category === "monthly" ? "Monthly" : "Free"}</span>
                    </div>
                    {plan.priceCents > 0 && (
                      <div className="text-sm text-white/30 mt-0.5 font-medium">
                        {formatPrice(plan.priceCents)}{plan.category === "monthly" ? "/month" : " one-time"}
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${plan.gradient} text-white font-semibold text-sm no-underline transition-all duration-300 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]`}
                  style={{ boxShadow: `0 4px 16px ${plan.glow}` }}
                >
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </div>
          <style>{`@keyframes shimmer { 0% { transform: translateX(-200%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }`}</style>
        </div>

        {/* ─── Usage Grid ─── */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transitionDelay: "200ms" }}
        >
          <ProgressRing
            value={usage.message_count}
            max={plan.messageLimit}
            color={msgPercent > 80 ? "#ef4444" : "#4ade80"}
            label="Messages"
            displayValue={loading ? "—" : `${usage.message_count.toLocaleString()}`}
            sub={`of ${plan.messageLimit === 0 ? "∞" : plan.messageLimit.toLocaleString()} / month`}
          />
          <ProgressRing
            value={chatbotCount}
            max={plan.chatbotLimit}
            color="#818cf8"
            label="Active Bots"
            displayValue={loading ? "—" : `${chatbotCount}`}
            sub={`of ${plan.chatbotLimit === 0 ? "Unlimited" : plan.chatbotLimit}`}
          />
          <CreditDisplay balance={creditBalance} loading={loading} />
        </div>

        {/* ─── Features ─── */}
        <div
          className="mb-6 transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transitionDelay: "300ms" }}
        >
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 md:p-6">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Your Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-white/60 text-xs font-medium">{f}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <path d="M5 13l4 4L19 7" stroke={plan.voiceIncluded ? "#4ade80" : "#ef4444"} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={`text-xs font-medium ${plan.voiceIncluded ? "text-white/60" : "text-white/25"}`}>
                  Voice Bot {plan.voiceIncluded ? "" : "(add-on)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Plans Overview ─── */}
        <div
          className="transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transitionDelay: "400ms" }}
        >
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 md:p-6">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">All Plans</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="text-left py-2.5 px-3 text-white/25 font-medium">Plan</th>
                    <th className="text-center py-2.5 px-3 text-white/25 font-medium">Price</th>
                    <th className="text-center py-2.5 px-3 text-white/25 font-medium">Bots</th>
                    <th className="text-center py-2.5 px-3 text-white/25 font-medium">Messages</th>
                    <th className="text-center py-2.5 px-3 text-white/25 font-medium">Voice</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PLANS).map(([id, p]) => (
                    <tr
                      key={id}
                      className={`border-b border-white/[0.03] transition-colors ${
                        id === userPlan ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <span className={`font-medium ${id === userPlan ? "text-white" : "text-white/50"}`}>{p.name}</span>
                          {id === userPlan && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${p.gradient} text-white font-bold`}>CURRENT</span>
                          )}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 text-white/40 font-medium">
                        {p.priceCents === 0 ? (id === "enterprise" ? "Custom" : "Free") : formatPrice(p.priceCents)}
                      </td>
                      <td className="text-center py-3 px-3 text-white/40">{p.chatbotLimit === 0 ? "∞" : p.chatbotLimit}</td>
                      <td className="text-center py-3 px-3 text-white/40">{p.messageLimit === 0 ? "∞" : p.messageLimit.toLocaleString()}</td>
                      <td className="text-center py-3 px-3">{p.voiceIncluded ? <span className="text-emerald-400">✓</span> : <span className="text-white/15">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
