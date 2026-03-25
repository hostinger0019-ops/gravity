"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Icons (SVG)
// ---------------------------------------------------------------------------
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);
const MsgIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" strokeWidth={2} />
    <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.3-4.3" />
  </svg>
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AnalyticsData {
  total_conversations: number;
  total_messages: number;
  voice_messages: number;
  text_messages: number;
  avg_messages_per_conversation: number;
  last_active: string | null;
  daily_messages: Array<{ date: string; text: number; voice: number }>;
  conversations: Array<{
    id: string;
    title: string;
    message_count: number;
    voice_count: number;
    text_count: number;
    type: "text" | "voice" | "mixed";
    created_at: string;
    updated_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// Animated Counter Hook
// ---------------------------------------------------------------------------
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

// ---------------------------------------------------------------------------
// Gradient Stat Card (Dark + Glassmorphism)
// ---------------------------------------------------------------------------
function StatCard({
  icon, label, value, gradient, delay,
}: {
  icon: React.ReactNode; label: string; value: string | number; gradient: string; delay: number;
}) {
  const isNumber = typeof value === "number";
  const animatedVal = useAnimatedCounter(isNumber ? value : 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 ${gradient} opacity-90`} />
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      {/* Content */}
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white/90 mb-3">
          {icon}
        </div>
        <div className="text-3xl font-bold text-white tracking-tight">
          {isNumber ? animatedVal.toLocaleString() : value}
        </div>
        <div className="text-sm text-white/60 mt-1 font-medium">{label}</div>
      </div>
      {/* Decorative circle */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart (SVG)
// ---------------------------------------------------------------------------
function DonutChart({ text, voice }: { text: number; voice: number }) {
  const total = text + voice;
  const textPct = total > 0 ? (text / total) * 100 : 50;
  const voicePct = total > 0 ? (voice / total) * 100 : 50;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  // SVG donut
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const textArc = (textPct / 100) * circumference;
  const voiceArc = (voicePct / 100) * circumference;

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Message Split</h3>
      <div className="flex items-center gap-8">
        {/* Donut SVG */}
        <div className="relative w-40 h-40 shrink-0">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
            {/* Text segment */}
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke="url(#textGrad)" strokeWidth="16"
              strokeDasharray={`${animated ? textArc : 0} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
            {/* Voice segment */}
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke="url(#voiceGrad)" strokeWidth="16"
              strokeDasharray={`${animated ? voiceArc : 0} ${circumference}`}
              strokeDashoffset={`-${textArc}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s" }}
            />
            {/* Gradients */}
            <defs>
              <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="voiceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Total</span>
          </div>
        </div>
        {/* Legend */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500" />
              <span className="text-sm text-white/60">Text Messages</span>
            </div>
            <div className="text-2xl font-bold text-white">{text} <span className="text-sm font-normal text-white/40">({Math.round(textPct)}%)</span></div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-teal-500" />
              <span className="text-sm text-white/60">Voice Messages</span>
            </div>
            <div className="text-2xl font-bold text-white">{voice} <span className="text-sm font-normal text-white/40">({Math.round(voicePct)}%)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily Bar Chart (Dark theme)
// ---------------------------------------------------------------------------
function DailyChart({ data }: { data: Array<{ date: string; text: number; voice: number }> }) {
  const maxVal = Math.max(1, ...data.map(d => d.text + d.voice));
  const chartHeight = 140;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <ChartIcon /> Activity
        </h3>
        <span className="text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-full">Last 30 days</span>
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-white/40">Text</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <span className="text-xs text-white/40">Voice</span>
        </div>
      </div>
      {/* Chart area */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-white/[0.04] w-full" />
          ))}
        </div>
        {/* Bars */}
        <div className="relative flex items-end gap-[2px] h-full">
          {data.map((d) => {
            const total = d.text + d.voice;
            const barH = animated ? Math.round((total / maxVal) * chartHeight) : 0;
            const textH = total > 0 ? Math.round((d.text / total) * barH) : 0;
            const voiceH = total > 0 ? barH - textH : 0;
            const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-800 border border-white/10 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 shadow-2xl">
                  <div className="font-semibold text-white/90">{dayLabel}</div>
                  <div className="text-white/50">{d.text} text · {d.voice} voice</div>
                </div>
                {/* Bar stack */}
                <div className="w-full flex flex-col rounded-t overflow-hidden" style={{ transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                  {textH > 0 && (
                    <div className="bg-indigo-500 hover:bg-indigo-400 transition-colors w-full rounded-t" style={{ height: textH, transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  )}
                  {voiceH > 0 && (
                    <div className="bg-teal-400 hover:bg-teal-300 transition-colors w-full" style={{ height: voiceH, transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  )}
                </div>
                {total === 0 && (
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex gap-[2px] mt-3">
        {data.map((d, i) => {
          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isWeekStart = new Date(d.date + "T12:00:00").getDay() === 1;
          const showLabel = i === 0 || i === data.length - 1 || isWeekStart;
          return (
            <div key={d.date} className="flex-1 text-center">
              {showLabel && <span className="text-[9px] text-white/25">{dayLabel}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type Badge (Dark theme)
// ---------------------------------------------------------------------------
function TypeBadge({ type }: { type: "text" | "voice" | "mixed" }) {
  const styles = {
    text: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    voice: "bg-teal-500/15 text-teal-400 border-teal-500/20",
    mixed: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  const labels = { text: "💬 Text", voice: "🎤 Voice", mixed: "🔀 Mixed" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Analytics Page
// ---------------------------------------------------------------------------
export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const botId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "messages">("date");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics", botId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/chatbots/${botId}/analytics`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    enabled: !!botId,
    staleTime: 60_000,
  });

  // Filter & sort conversations
  const conversations = data?.conversations || [];
  const filtered = conversations.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "messages") return b.message_count - a.message_count;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const lastActiveStr = data?.last_active
    ? new Date(data.last_active).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle ambient gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/chatbots")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Analytics</h1>
              <p className="text-white/30 text-sm">Performance & conversations</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/admin/chatbots/${botId}/conversations`)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <ChatIcon />
            All Chats
          </button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="rounded-2xl bg-white/[0.03] h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white/[0.03] h-64" />
              <div className="rounded-2xl bg-white/[0.03] h-64" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center">
            <p className="text-red-400 font-medium">Failed to load analytics</p>
            <p className="text-red-400/60 text-sm mt-1">{(error as Error).message}</p>
          </div>
        )}

        {/* Data */}
        {data && !isLoading && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatCard icon={<ChatIcon />} label="Conversations" value={data.total_conversations} gradient="bg-gradient-to-br from-indigo-600 to-violet-700" delay={0} />
              <StatCard icon={<MsgIcon />} label="Total Messages" value={data.total_messages} gradient="bg-gradient-to-br from-blue-600 to-cyan-700" delay={80} />
              <StatCard icon={<MicIcon />} label="Voice Messages" value={data.voice_messages} gradient="bg-gradient-to-br from-teal-600 to-emerald-700" delay={160} />
              <StatCard icon={<ChartIcon />} label="Avg / Chat" value={data.avg_messages_per_conversation} gradient="bg-gradient-to-br from-purple-600 to-fuchsia-700" delay={240} />
              <StatCard icon={<ClockIcon />} label="Last Active" value={lastActiveStr} gradient="bg-gradient-to-br from-amber-600 to-orange-700" delay={320} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <DailyChart data={data.daily_messages} />
              </div>
              <div className="lg:col-span-2">
                <DonutChart text={data.text_messages} voice={data.voice_messages} />
              </div>
            </div>

            {/* Conversations Table */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl backdrop-blur-sm overflow-hidden">
              {/* Table header */}
              <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                  <ChatIcon />
                  Conversations
                  <span className="text-xs font-normal text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{sorted.length}</span>
                </h2>
                <div className="flex-1" />
                {/* Search */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><SearchIcon /></div>
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search..."
                    className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as "date" | "messages")}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm outline-none cursor-pointer hover:bg-white/10 transition"
                >
                  <option value="date">Latest</option>
                  <option value="messages">Most Messages</option>
                </select>
              </div>

              {/* Empty */}
              {paginated.length === 0 && (
                <div className="p-12 text-center text-white/20">
                  {search ? "No conversations match your search." : "No conversations yet."}
                </div>
              )}

              {/* Rows */}
              <div className="divide-y divide-white/[0.04]">
                {paginated.map((c, i) => (
                  <div
                    key={c.id}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.03] transition cursor-pointer group"
                    onClick={() => router.push(`/admin/chatbots/${botId}/conversations/${c.id}`)}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Index */}
                    <span className="text-xs text-white/15 w-6 text-right shrink-0 font-mono">
                      {(page - 1) * pageSize + i + 1}
                    </span>
                    {/* Title + date */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white/80 truncate group-hover:text-indigo-400 transition text-sm">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-white/20 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {/* Message count */}
                    <div className="text-xs font-medium text-white/40 flex items-center gap-1.5 shrink-0 bg-white/5 px-2.5 py-1 rounded-full">
                      {c.message_count} msgs
                    </div>
                    {/* Type badge */}
                    <TypeBadge type={c.type} />
                    {/* View icon */}
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/0 group-hover:bg-indigo-500/15 flex items-center justify-center text-indigo-400 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <EyeIcon />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-white/20">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
