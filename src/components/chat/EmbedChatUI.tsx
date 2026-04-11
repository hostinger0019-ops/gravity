"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface EmbedChatUIProps {
  slug: string;
  name: string;
  greeting: string;
  brandColor: string;
  avatarUrl: string | null;
  starterQuestions: string[];
  tagline?: string;
  botId: string;
  placeholder?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function EmbedChatUI({
  slug,
  name,
  greeting,
  brandColor,
  avatarUrl,
  starterQuestions,
  tagline,
  botId,
  placeholder,
}: EmbedChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowStarters(false);
    setIsLoading(true);

    try {
      // Use the same API as PersistentChat
      const history = newMessages.slice(-13).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/bots/${encodeURIComponent(slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      // Create placeholder assistant message
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "Sorry, something went wrong.");
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: errorText } : m))
        );
      } else {
        // Stream the response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          acc += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
          );
        }
      }
    } catch (err) {
      console.error("[EmbedChat] Error:", err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 2).toString(), role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [slug, messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const brand = brandColor || "#6366F1";

  return (
    <div className="embed-widget-root">
      {/* ── Header ── */}
      <div className="ew-header" style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }}>
        <div className="ew-header-left">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="ew-avatar" />
          ) : (
            <div className="ew-avatar-fallback">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
          )}
          <div>
            <div className="ew-name">{name}</div>
            <div className="ew-status"><span className="ew-status-dot" /> Online</div>
          </div>
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="ew-messages">
        {/* Greeting */}
        <div className="ew-row ew-row-bot">
          <div className="ew-bubble-avatar" style={{ background: brand }}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="ew-bubble-avatar-img" /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            )}
          </div>
          <div className="ew-bubble ew-bubble-bot">{greeting}</div>
        </div>

        {/* Starter Questions */}
        {showStarters && starterQuestions.length > 0 && messages.length === 0 && (
          <div className="ew-starters">
            {starterQuestions.slice(0, 4).map((q, i) => (
              <button key={i} className="ew-chip" onClick={() => sendMessage(q)} style={{ borderColor: brand + "40" }}>
                <span className="ew-chip-icon" style={{ color: brand }}>→</span>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={`ew-row ${msg.role === "user" ? "ew-row-user" : "ew-row-bot"}`}>
            {msg.role === "assistant" && (
              <div className="ew-bubble-avatar" style={{ background: brand }}>
                {avatarUrl ? <img src={avatarUrl} alt="" className="ew-bubble-avatar-img" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                )}
              </div>
            )}
            <div
              className={`ew-bubble ${msg.role === "user" ? "ew-bubble-user" : "ew-bubble-bot"}`}
              style={msg.role === "user" ? { background: brand } : undefined}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="ew-row ew-row-bot">
            <div className="ew-bubble-avatar" style={{ background: brand }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="ew-bubble ew-bubble-bot ew-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <form onSubmit={handleSubmit} className="ew-input-bar">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || tagline || "Type a message..."}
          className="ew-input"
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading} className="ew-send" style={{ background: brand }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      {/* ── Footer ── */}
      <a href="https://agentforja.com" target="_blank" rel="noopener noreferrer" className="ew-footer">
        ⚡ Powered by <strong>Agent Forja</strong>
      </a>

      <style>{`
        .embed-widget-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Header ── */
        .ew-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          color: #fff;
          flex-shrink: 0;
        }
        .ew-header-left { display: flex; align-items: center; gap: 12px; }
        .ew-avatar {
          width: 42px; height: 42px; border-radius: 14px;
          object-fit: cover; border: 2.5px solid rgba(255,255,255,0.35);
        }
        .ew-avatar-fallback {
          width: 42px; height: 42px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.2); color: #fff;
          border: 2.5px solid rgba(255,255,255,0.35);
        }
        .ew-name { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .ew-status { display: flex; align-items: center; gap: 5px; font-size: 12px; opacity: 0.9; font-weight: 500; }
        .ew-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,0.7);
          animation: ewPulse 2s ease-in-out infinite;
        }

        /* ── Messages ── */
        .ew-messages {
          flex: 1; overflow-y: auto; padding: 16px 16px 8px;
          display: flex; flex-direction: column; gap: 10px;
          background: linear-gradient(180deg, #f7f8fa 0%, #ffffff 100%);
        }
        .ew-messages::-webkit-scrollbar { width: 3px; }
        .ew-messages::-webkit-scrollbar-thumb { background: #e0e0e5; border-radius: 2px; }

        .ew-row { display: flex; gap: 8px; animation: ewSlide 0.25s ease-out; }
        .ew-row-user { justify-content: flex-end; }
        .ew-row-bot { justify-content: flex-start; align-items: flex-end; }

        .ew-bubble-avatar {
          width: 28px; height: 28px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; flex-shrink: 0; font-size: 12px; font-weight: 700;
        }
        .ew-bubble-avatar-img { width: 100%; height: 100%; border-radius: 9px; object-fit: cover; }

        .ew-bubble {
          max-width: 78%; padding: 10px 14px; font-size: 13.5px; line-height: 1.55;
          word-break: break-word; white-space: pre-wrap;
        }
        .ew-bubble-bot {
          background: #fff; color: #1e1e1e;
          border-radius: 2px 16px 16px 16px;
          border: 1px solid #ecedf0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .ew-bubble-user {
          border-radius: 16px 2px 16px 16px;
          color: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        /* ── Starters ── */
        .ew-starters {
          display: flex; flex-direction: column; gap: 6px;
          padding: 4px 0 6px 36px;
        }
        .ew-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; border-radius: 12px;
          border: 1.5px solid; background: #fff;
          font-size: 13px; color: #374151; cursor: pointer;
          font-family: inherit; text-align: left;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .ew-chip:hover {
          transform: translateX(3px);
          box-shadow: 0 3px 12px rgba(0,0,0,0.06);
        }
        .ew-chip-icon { font-size: 14px; font-weight: 700; }

        /* ── Typing ── */
        .ew-typing {
          display: flex !important; align-items: center; gap: 5px;
          padding: 14px 18px !important;
        }
        .ew-typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: #c0c0c8;
          animation: ewBounce 1.2s ease-in-out infinite;
        }
        .ew-typing span:nth-child(2) { animation-delay: 0.15s; }
        .ew-typing span:nth-child(3) { animation-delay: 0.3s; }

        /* ── Input ── */
        .ew-input-bar {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; border-top: 1px solid #ecedf0;
          background: #fff; flex-shrink: 0;
        }
        .ew-input {
          flex: 1; border: 1.5px solid #e2e3e8; border-radius: 24px;
          padding: 11px 16px; font-size: 13.5px; outline: none;
          background: #f8f9fb; color: #1e1e1e; font-family: inherit;
          transition: all 0.2s;
        }
        .ew-input:focus { border-color: ${brand}; background: #fff; box-shadow: 0 0 0 3px ${brand}15; }
        .ew-input::placeholder { color: #a0a3ab; }
        .ew-input:disabled { opacity: 0.5; }

        .ew-send {
          width: 40px; height: 40px; border-radius: 50%;
          border: none; color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .ew-send:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .ew-send:disabled { opacity: 0.35; cursor: default; }

        /* ── Footer ── */
        .ew-footer {
          display: block; text-align: center; padding: 8px 12px;
          font-size: 11px; color: #9ca3af; text-decoration: none;
          background: #fafafa; border-top: 1px solid #f0f0f3;
          flex-shrink: 0; transition: color 0.2s;
        }
        .ew-footer:hover { color: #6b7280; }
        .ew-footer strong { font-weight: 600; }

        /* ── Animations ── */
        @keyframes ewSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ewBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        @keyframes ewPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
