"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type InboxConversation = {
  id: string;
  bot_id: string;
  bot_name: string;
  title: string;
  visitor_id: string;
  handoff_status: string;
  handoff_requested_at: string | null;
  last_message: string;
  message_count: number;
  updated_at: string;
};

type Counts = { pending: number; agent_active: number; resolved: number };

export default function InboxPage() {
  const [convs, setConvs] = useState<InboxConversation[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, agent_active: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchInbox = useCallback(async () => {
    try {
      const ownerId = localStorage.getItem("user_id") || "";
      const res = await fetch(`/api/handoff/inbox?ownerId=${ownerId}`);
      const data = await res.json();
      setConvs(data.conversations || []);
      setCounts(data.counts || { pending: 0, agent_active: 0, resolved: 0 });
    } catch (e) {
      console.error("Inbox fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const filtered = filter === "all" ? convs : convs.filter((c) => c.handoff_status === filter);
  const total = counts.pending + counts.agent_active + counts.resolved;

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      pending: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400", label: "Waiting" },
      agent_active: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", label: "Active" },
      resolved: { bg: "bg-gray-500/10 border-gray-500/20", text: "text-gray-400", dot: "bg-gray-500", label: "Resolved" },
    };
    const s = map[status] || map.resolved;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${s.bg} ${s.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === "pending" ? "animate-pulse" : ""}`} />
        {s.label}
      </span>
    );
  };

  const timeAgo = (iso: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              📨 Live Inbox
              {counts.pending > 0 && (
                <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                  {counts.pending} waiting
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Conversations that need human attention</p>
          </div>
          <button
            onClick={fetchInbox}
            className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button onClick={() => setFilter("all")} className={`rounded-xl p-4 border transition-all text-left ${filter === "all" ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}>
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </button>
          <button onClick={() => setFilter("pending")} className={`rounded-xl p-4 border transition-all text-left ${filter === "pending" ? "border-amber-500/50 bg-amber-500/5" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}>
            <div className="text-2xl font-bold text-amber-400">{counts.pending}</div>
            <div className="text-xs text-gray-500">Waiting</div>
          </button>
          <button onClick={() => setFilter("agent_active")} className={`rounded-xl p-4 border transition-all text-left ${filter === "agent_active" ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}>
            <div className="text-2xl font-bold text-emerald-400">{counts.agent_active}</div>
            <div className="text-xs text-gray-500">Active</div>
          </button>
          <button onClick={() => setFilter("resolved")} className={`rounded-xl p-4 border transition-all text-left ${filter === "resolved" ? "border-gray-500/50 bg-gray-500/5" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}>
            <div className="text-2xl font-bold text-gray-400">{counts.resolved}</div>
            <div className="text-xs text-gray-500">Resolved</div>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-5 border border-white/[0.08] bg-white/[0.02] animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-white/10 rounded" />
                  <div className="h-3 w-72 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-3xl">
              {filter === "pending" ? "⏳" : filter === "agent_active" ? "💬" : "✅"}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {filter === "all" ? "No handoff requests yet" : `No ${filter.replace("_", " ")} conversations`}
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              When visitors request to talk to a human, their conversations will appear here.
            </p>
          </div>
        )}

        {/* Conversation List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((conv, idx) => (
              <Link
                key={conv.id}
                href={`/admin/inbox/${conv.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                style={{ animation: "fadeInMsg 0.3s ease-out both", animationDelay: `${idx * 0.04}s` }}
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
                  conv.handoff_status === "pending" ? "bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/30" :
                  conv.handoff_status === "agent_active" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {(conv.visitor_id || conv.title || "?").charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{conv.title || conv.visitor_id || "Visitor"}</span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500">{conv.bot_name}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message || "No messages"}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {statusBadge(conv.handoff_status)}
                  <div className="text-right">
                    <div className="text-[10px] text-gray-600">{timeAgo(conv.updated_at)}</div>
                    <div className="text-[10px] text-gray-600">{conv.message_count} msgs</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
