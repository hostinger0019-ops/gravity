"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Msg = { id: string; role: string; content: string; created_at: string };

export default function InboxConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/handoff/messages/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStatus = useCallback(async () => {
    try {
      const ownerId = localStorage.getItem("user_id") || "";
      const res = await fetch(`/api/handoff/inbox?ownerId=${ownerId}`);
      const data = await res.json();
      const conv = (data.conversations || []).find((c: any) => c.id === id);
      if (conv) setStatus(conv.handoff_status);
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchMessages();
    fetchStatus();
    const interval = setInterval(() => { fetchMessages(); fetchStatus(); }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchStatus]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTake = async () => {
    const agentName = localStorage.getItem("user_name") || localStorage.getItem("user_email") || "Agent";
    const agentId = localStorage.getItem("user_id") || "";
    await fetch(`/api/handoff/take/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_name: agentName, agent_id: agentId }),
    });
    setStatus("agent_active");
    fetchMessages();
  };

  const handleReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const agentName = localStorage.getItem("user_name") || localStorage.getItem("user_email") || "Agent";
    try {
      await fetch(`/api/handoff/reply/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply, agent_name: agentName }),
      });
      setReply("");
      fetchMessages();
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    await fetch(`/api/handoff/resolve/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setStatus("resolved");
    fetchMessages();
  };

  const handleReturnToBot = async () => {
    await fetch(`/api/handoff/return-to-bot/${id}`, { method: "POST" });
    setStatus("bot");
    fetchMessages();
  };

  const roleStyle = (role: string) => {
    switch (role) {
      case "user": return { bg: "bg-white/[0.06]", align: "mr-auto", label: "Visitor", color: "text-blue-400" };
      case "assistant": return { bg: "bg-indigo-500/10 border-indigo-500/20", align: "mr-auto", label: "AI Bot", color: "text-indigo-400" };
      case "agent": return { bg: "bg-emerald-500/10 border-emerald-500/20", align: "ml-auto", label: "You", color: "text-emerald-400" };
      case "system": return { bg: "bg-amber-500/5 border-amber-500/10", align: "mx-auto", label: "System", color: "text-amber-400" };
      default: return { bg: "bg-white/[0.04]", align: "mr-auto", label: role, color: "text-gray-400" };
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-white/[0.02] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/inbox" className="w-9 h-9 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">Conversation</h1>
            <p className="text-xs text-gray-500">{messages.length} messages • {status === "pending" ? "⏳ Waiting for agent" : status === "agent_active" ? "✅ Agent active" : status === "resolved" ? "📋 Resolved" : "🤖 Bot mode"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "pending" && (
            <button onClick={handleTake} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
              ✋ Take Over
            </button>
          )}
          {status === "agent_active" && (
            <>
              <button onClick={handleResolve} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition-colors">
                ✓ Resolve
              </button>
              <button onClick={handleReturnToBot} className="px-4 py-2 rounded-lg border border-amber-500/30 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors">
                🤖 Return to Bot
              </button>
            </>
          )}
          {status === "resolved" && (
            <button onClick={handleReturnToBot} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition-colors">
              🤖 Return to Bot
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 max-w-3xl w-full mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {messages.map((msg, i) => {
          const s = roleStyle(msg.role);
          return (
            <div key={msg.id} className={`max-w-[80%] ${s.align}`} style={{ animation: "fadeInMsg 0.2s ease-out both", animationDelay: `${i * 0.02}s` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-medium ${s.color}`}>{s.label}</span>
                <span className="text-[9px] text-gray-600">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
              <div className={`px-4 py-3 rounded-xl border ${s.bg} border-white/[0.06]`}>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply Input */}
      {(status === "agent_active") && (
        <div className="border-t border-white/[0.08] bg-white/[0.02] p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
              placeholder="Type your reply..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              autoFocus
            />
            <button
              onClick={handleReply}
              disabled={!reply.trim() || sending}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="border-t border-white/[0.08] bg-amber-500/5 p-4 text-center">
          <p className="text-sm text-amber-400">⏳ Click "Take Over" to start replying to this visitor</p>
        </div>
      )}
    </div>
  );
}
