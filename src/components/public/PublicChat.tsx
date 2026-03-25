"use client";

import { useState } from "react";
import { RenderedMessage } from "./RenderedMessage";
import { shouldShowActionButtons } from "@/components/utils";
import AutoVoiceMode from "@/components/AutoVoiceMode";

type Msg = { role: "user" | "assistant"; content: string };

export type PublicChatProps = {
  slug: string;
  name: string;
  avatarUrl?: string | null;
  brandColor: string;
  bubbleStyle: "rounded" | "square";
  greeting: string;
  typingIndicator: boolean;
  starterQuestions: string[];
  tagline?: string | null;
  directive?: string | null;
  knowledgeBase?: string | null;
  model?: string;
  temperature?: number;
  rules?: { settings?: { wait_for_reply?: boolean } } | null;
  voice_mode?: "text" | "text+audio" | "audio";
};

export default function PublicChat({
  slug,
  name,
  avatarUrl,
  brandColor,
  bubbleStyle,
  greeting,
  typingIndicator,
  starterQuestions,
  model,
  rules,
}: PublicChatProps) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: greeting || "How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const restart = () => {
    setMessages([{ role: "assistant", content: greeting }]);
    setInput("");
    setConversationId(null);
  };

  // Enforce: user cannot send another message until the current reply arrives
  // Default to true (always wait), regardless of rules presence
  const waitForReply = true;

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    const containsImage = /!\[[^\]]*\]\([^\)]+\)/.test(text);
    setInput("");
    // Optimistically add the user's message
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      // Ensure the API receives the latest user message
      const pending = [...messages, { role: "user", content: text }];
      const res = await fetch(`/api/bots/${encodeURIComponent(slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: pending, conversationId }),
      });
      const data = await res.json();
      let reply = res.ok ? (data.reply || "") : (data.error || "Sorry, I couldn’t respond.");
      if (containsImage && !/\bvision\b/i.test(model || '')) {
        reply = reply || "I see you've uploaded an image, but I'm unable to analyze images directly. Could you describe it?";
      }
      if (data?.conversationId && !conversationId) setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: e?.message || "Network error" }]);
    } finally {
      setLoading(false);
    }
  };

  const radius = bubbleStyle === "square" ? "rounded-md" : "rounded-2xl";

  return (
    <div className="h-full flex flex-col">
      {/* Auto Voice Mode Overlay - Hands-free voice chat */}
      <AutoVoiceMode
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onMessage={(userText: string, aiText: string) => {
          setMessages(m => [...m, { role: "user", content: userText }, { role: "assistant", content: aiText }]);
        }}
        botSlug={slug}
        language="hi"
      />

      {/* Header */}
      <div className="p-3 border-b border-gray-800 text-white bg-[#0a0a0a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={avatarUrl || "/favicon.ico"}
            alt="avatar"
            className="w-7 h-7 rounded-full border border-gray-700 bg-black"
            onError={(e) => ((e.currentTarget.src = "/favicon.ico"))}
          />
          <div className="font-semibold">{name || "Untitled Bot"}</div>
        </div>
        <button
          onClick={restart}
          className="text-sm px-2 py-1 border rounded-md border-gray-700 hover:bg-[#141414]"
        >
          Restart Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a] text-white">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 ${radius}`}
              style={{
                background: m.role === "user" ? brandColor : "#1a1a1a",
                color: m.role === "user" ? "white" : "#e5e7eb",
              }}
            >
              <RenderedMessage content={m.content} light={false} />
              {m.role === "assistant" && shouldShowActionButtons(m.content) && (
                <div className="mt-2 flex gap-2 text-xs">
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-gray-700 hover:bg-[#141414]"
                    onClick={() => setInput(`Explain: ${m.content}`)}
                  >
                    Explain
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-gray-700 hover:bg-[#141414]"
                    onClick={() => setInput(`Show steps for: ${m.content}`)}
                  >
                    Show Steps
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-gray-700 hover:bg-[#141414]"
                    onClick={() => setInput(`Give me a similar problem to practice based on: ${m.content}`)}
                  >
                    Try Similar Problem
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {typingIndicator && loading && (
          <div className="text-xs text-gray-400">Assistant is typing…</div>
        )}

        {starterQuestions?.length > 0 && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="text-xs px-2 py-1 rounded-full border border-gray-700 bg-[#141414] hover:bg-[#1a1a1a] text-gray-200"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-[#0a0a0a] border-t border-gray-800 text-white">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border border-gray-700 bg-[#141414] text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Ask me anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          />
          <button
            onClick={() => !loading && send()}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            {loading ? 'Waiting…' : 'Send'}
          </button>
          {/* Ultra Voice Button */}
          <button
            onClick={() => setVoiceOpen(true)}
            className="px-3 py-2 border rounded-md border-green-500 text-green-500 hover:bg-green-500/10 flex items-center gap-1"
            title="Ultra Voice Mode (Sub-1s latency)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            ⚡
          </button>
        </div>
      </div>
    </div>
  );
}
