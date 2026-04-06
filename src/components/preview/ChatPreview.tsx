"use client";

import { useEffect, useRef, useState } from "react";
import katex from "katex";
import { shouldShowActionButtons } from "@/components/utils";
import { PropertyCardsCarousel, Property } from "@/components/chat/PropertyCardsCarousel";
import { AreaLocationCards, AreaLocation } from "@/components/chat/AreaLocationCards";
import { PropertyDetailCard } from "@/components/chat/PropertyDetailCard";

export type PreviewProps = {
  name: string;
  avatarUrl?: string | null;
  brandColor: string;
  bubbleStyle: "rounded" | "square";
  greeting: string;
  typingIndicator: boolean;
  starterQuestions: string[];
  // Optional input placeholder shown in preview composer
  tagline?: string | null;
  directive?: string | null;
  knowledgeBase?: string | null;
  model?: string;
  temperature?: number;
  rules?: { settings?: { knowledge_fallback_mode?: "ai" | "message"; knowledge_fallback_message?: string } };
  chatbotId?: string | null;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    type?: "property_list" | "area_overview" | "property_detail";
    data?: {
      properties?: Property[];
      areas?: AreaLocation[];
      property?: Property;
    };
  };
};

export function ChatPreview({
  name,
  avatarUrl,
  brandColor,
  bubbleStyle,
  greeting,
  typingIndicator,
  starterQuestions,
  tagline,
  directive,
  knowledgeBase,
  model,
  temperature,
  rules,
  chatbotId,
}: PreviewProps) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: greeting || "How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Update greeting message in real-time when user types
  useEffect(() => {
    setMessages((prev) => {
      // Only update if the first message is from assistant and no user messages yet
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: greeting || "How can I help you today?" }];
      }
      return prev;
    });
  }, [greeting]);

  const restart = () => {
    setMessages([{ role: "assistant", content: greeting || "How can I help you today?" }]);
    setInput("");
  };

  const send = async () => {
    if (loading) return; // block multiple sends until reply
    const text = input.trim();
    // Allow sending image with or without text
    if (!text && !imagePreview) return;
    setInput("");
    // If there's an attached image, embed as markdown inline with the text (preview-only)
    const content = imagePreview ? `${text ? text + "\n\n" : ""}![uploaded image](${imagePreview})` : text;
    // Send raw content; server will extract images for vision models
    setMessages((m) => [...m, { role: "user", content }]);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setLoading(true);
    try {
      // Debug: log what we're sending
      console.log('[ChatPreview] Sending to /api/preview/chat:', { rules, chatbotId, name });
      const res = await fetch(`/api/preview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot: {
            name,
            directive: directive || undefined,
            knowledge_base: knowledgeBase || undefined,
            model,
            temperature,
            rules,
            chatbotId: chatbotId || undefined,
          },
          messages: [...messages, { role: "user", content }],
        }),
      });
      const data = await res.json();
      const reply = res.ok ? (data.reply || "") : (data.error || "Sorry, I couldn’t respond.");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: e?.message || "Network error" }]);
    } finally {
      setLoading(false);
    }
  };

  const radius = bubbleStyle === "square" ? "rounded-md" : "rounded-2xl";

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white">
      {/* Live Preview Badge */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="text-sm font-medium text-white">Live Preview — Test your bot here</span>
      </div>

      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i}>
            {/* Text Message */}
            <div
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 ${radius}`}
                style={{
                  background:
                    m.role === "user" ? brandColor : "#1a1a1a",
                  color: m.role === "user" ? "white" : "#e5e7eb",
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: renderMathPreview(m.content) }} />
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

            {/* Property UI Components */}
            {m.role === "assistant" && m.metadata?.type && (
              <div className="flex justify-start mt-2">
                <div className="max-w-[95%]">
                  {m.metadata.type === "property_list" && m.metadata.data?.properties && (
                    <PropertyCardsCarousel
                      properties={m.metadata.data.properties}
                      onViewDetails={(id) => setInput(`Tell me more about property ${id}`)}
                      onScheduleVisit={(id) => setInput(`I want to schedule a visit for property ${id}`)}
                      onContactAgent={(id) => setInput(`I want to contact the agent about property ${id}`)}
                    />
                  )}
                  {m.metadata.type === "area_overview" && m.metadata.data?.areas && (
                    <AreaLocationCards
                      areas={m.metadata.data.areas}
                      onSelectArea={(area) => setInput(`Show me properties in ${area}`)}
                      onViewMap={(area) => setInput(`Show me ${area} on the map`)}
                    />
                  )}
                  {m.metadata.type === "property_detail" && m.metadata.data?.property && (
                    <PropertyDetailCard
                      property={m.metadata.data.property}
                      onScheduleVisit={(id) => setInput(`I want to schedule a visit for this property`)}
                      onContactAgent={(id) => setInput(`I want to contact the agent about this property`)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {typingIndicator && loading && (
          <div className="flex">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]">
              <span className="bg-gradient-to-r from-sky-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent text-xs font-semibold tracking-wide">
                {name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Starter question chips - show only at start of conversation */}
        {messages.length === 1 && starterQuestions && starterQuestions.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {starterQuestions.slice(0, 6).map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(q);
                    // Auto-send the question
                    setMessages((prev) => [...prev, { role: "user", content: q }]);
                    setLoading(true);
                    fetch("/api/preview/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        messages: [...messages, { role: "user", content: q }],
                        bot: { name, greeting, directive, knowledge_base: knowledgeBase, model, temperature, rules },
                        chatbotId,
                      }),
                    })
                      .then((r) => r.json())
                      .then((d) => {
                        setMessages((prev) => [...prev, { role: "assistant", content: d.reply || d.message || "..." }]);
                      })
                      .catch(() => {
                        setMessages((prev) => [...prev, { role: "assistant", content: "Error generating response." }]);
                      })
                      .finally(() => setLoading(false));
                    setInput("");
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border border-gray-700 bg-[#141414] text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder={tagline || "Ask me Anything…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(f);
          }} />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-2 py-2 border rounded-md border-gray-700 hover:bg-[#141414]"
          >
            📷
          </button>
          <button
            onClick={() => !loading && send()}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            {loading ? 'Waiting…' : 'Send'}
          </button>
        </div>
        {imagePreview && (
          <div className="mt-2 flex items-center gap-3 text-sm">
            <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded" />
            <div className="flex gap-2">
              <button type="button" className="px-2 py-1 border rounded-md border-gray-700" onClick={send}>Send with Photo</button>
              <button type="button" className="px-2 py-1 border rounded-md border-gray-700" onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderMathPreview(raw: string): string {
  let txt = raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  txt = txt.replace(/\$\$([\s\S]+?)\$\$/g, (_m, expr) => {
    try { return `<div class=\"katex-block\">${katex.renderToString(expr, { throwOnError: false })}</div>`; } catch { return `<pre>$$${expr}$$</pre>`; }
  });
  txt = txt.replace(/\\\((.+?)\\\)/g, (_m, ex) => { try { return katex.renderToString(ex, { throwOnError: false }); } catch { return _m; } });
  txt = txt.replace(/\$(.+?)\$/g, (_m, ex) => { try { return katex.renderToString(ex, { throwOnError: false }); } catch { return _m; } });
  txt = txt.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${url}" alt="${alt}" class=\"max-w-full rounded border border-white/10\" />`);
  txt = txt.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>');
  txt = txt.replace(/\*(.+?)\*/g, '<em>$1<\/em>');
  return txt;
}
