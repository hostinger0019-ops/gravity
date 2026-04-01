"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RenderedMessage } from "@/components/public/RenderedMessage";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface SaaSChatUIProps {
    slug: string;
    name: string;
    avatarUrl: string | null;
    brandColor: string;
    greeting: string;
    starterQuestions: string[];
    botId: string;
    tagline?: string;
}

export default function SaaSChatUI({
    slug,
    name,
    avatarUrl,
    brandColor,
    greeting,
    starterQuestions,
    botId,
    tagline,
}: SaaSChatUIProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    // Detect embed mode
    const [isEmbed, setIsEmbed] = useState(false);
    useEffect(() => { if (typeof window !== 'undefined') { const p = new URLSearchParams(window.location.search); setIsEmbed(p.get('embed') === '1'); } }, []);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleScroll = () => setIsScrolled(container.scrollTop > 20);
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const sendMessage = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = { role: "user", content: messageText };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(`/api/bots/${slug}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ botId, messages: [...messages, userMessage] }),
            });
            if (!response.ok) throw new Error("Chat failed");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    fullText += decoder.decode(value, { stream: true });
                    setMessages((prev) => {
                        const copy = [...prev];
                        copy[copy.length - 1] = { role: "assistant", content: fullText };
                        return copy;
                    });
                }
            }
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    const quickActions = useMemo(() => [
        { icon: "🚀", label: "Get Started", query: "How do I get started?" },
        { icon: "⚙️", label: "Setup Guide", query: "Walk me through the setup process" },
        { icon: "👥", label: "Invite Team", query: "How do I invite my team members?" },
        { icon: "📚", label: "Features", query: "What are the main features?" },
    ], []);

    const suggestions = useMemo(() => {
        if (starterQuestions?.length > 0) return starterQuestions.slice(0, 4);
        return ["Quick start guide", "Keyboard shortcuts", "API documentation", "Billing info"];
    }, [starterQuestions]);

    const hasMessages = messages.length > 0;

    return (
        <div className={`flex flex-col ${isEmbed ? 'h-full' : 'h-screen'} bg-[#0F0F10] relative overflow-hidden`}>
            {/* Gradient orbs — hidden in embed mode */}
            {!isEmbed && <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            </>}

            {/* Header */}
            <header className={`${isEmbed ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0F0F10]/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
                }`}>
                <div className={`max-w-4xl mx-auto ${isEmbed ? 'px-3 py-2' : 'px-6 py-4'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`${isEmbed ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25`}>
                            <span className={`text-white ${isEmbed ? 'text-sm' : 'text-lg'} font-bold`}>⚡</span>
                        </div>
                        <div>
                            <h1 className={`${isEmbed ? 'text-sm' : 'text-[15px]'} font-semibold text-white tracking-tight`}>{name}</h1>
                            {isEmbed ? <div className="flex items-center gap-1 text-[10px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online</div> : <p className="text-[12px] text-gray-400">{tagline || "Onboarding Assistant"}</p>}
                        </div>
                    </div>
                    {!isEmbed && <a href={`/admin/chatbots/${botId}`} className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] font-medium text-gray-300 transition-all">
                        Admin
                    </a>}
                </div>
            </header>

            {/* Content */}
            <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto ${isEmbed ? 'pt-2 pb-4' : 'pt-20 pb-48'}`}>
                <div className="max-w-3xl mx-auto px-6">
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            {/* Logo */}
                            <div className="relative mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                                    <span className="text-4xl">🚀</span>
                                </div>
                                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl -z-10" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 text-center">
                                {greeting || `Welcome to ${name}!`}
                            </h2>
                            <p className="text-gray-400 text-center mb-10 max-w-md">
                                I'll help you get set up and make the most of your new software. What would you like to learn?
                            </p>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mb-10">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(action.query)}
                                        className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
                                        <div className="text-[13px] font-medium text-gray-300 group-hover:text-white">{action.label}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Progress Indicator */}
                            <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                                <div className="flex -space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                                </div>
                                <span className="text-[12px] text-gray-400">Let's complete your setup together</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-8">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3">
                                            <span className="text-white text-sm">⚡</span>
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${msg.role === "user"
                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-sm px-5 py-3"
                                            : "bg-white/5 backdrop-blur text-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 border border-white/10"
                                        }`}>
                                        <div className="text-[15px] leading-relaxed">
                                            <RenderedMessage content={msg.content} light={msg.role === "user"} slug={slug} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3">
                                        <span className="text-white text-sm">⚡</span>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl px-5 py-4 border border-white/10">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className={`${isEmbed ? 'sticky' : 'fixed'} bottom-0 left-0 right-0 z-40`}>
                {!isEmbed && <div className="h-8 bg-gradient-to-t from-[#0F0F10] to-transparent" />}
                <div className={`bg-[#0F0F10] ${isEmbed ? 'pb-2 px-2' : 'pb-6 px-4'}`}>
                    <div className="max-w-3xl mx-auto">
                        {!hasMessages && (
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)} className="px-4 py-2 rounded-full text-[13px] font-medium border border-white/10 text-gray-400 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white transition-all">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden focus-within:border-indigo-500/50 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about features, setup, or anything else..."
                                    disabled={isLoading}
                                    className={`w-full ${isEmbed ? 'px-3 py-2.5 pr-16 text-sm' : 'px-5 py-4 pr-24 text-[15px]'} text-white placeholder-gray-500 bg-transparent focus:outline-none`}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className={`p-2.5 rounded-xl transition-all ${input.trim() && !isLoading
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:-translate-y-0.5"
                                                : "bg-white/10 text-gray-500 cursor-not-allowed"
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>
                        {!isEmbed && <p className="text-center text-[11px] text-gray-500 mt-3">Powered by AI • {name}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
