"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RenderedMessage } from "@/components/public/RenderedMessage";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface HealthcareChatUIProps {
    slug: string;
    name: string;
    avatarUrl: string | null;
    brandColor: string;
    greeting: string;
    starterQuestions: string[];
    botId: string;
    tagline?: string;
}

export default function HealthcareChatUI({
    slug,
    name,
    avatarUrl,
    brandColor,
    greeting,
    starterQuestions,
    botId,
    tagline,
}: HealthcareChatUIProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
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
            setMessages((prev) => [...prev, { role: "assistant", content: "I apologize, but I couldn't process your request. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    const quickActions = useMemo(() => [
        { icon: "📋", label: "Symptoms", query: "I want to describe my symptoms" },
        { icon: "💊", label: "Medications", query: "Tell me about medication information" },
        { icon: "📅", label: "Appointments", query: "How do I schedule an appointment?" },
        { icon: "❓", label: "General FAQ", query: "What are your most common questions?" },
    ], []);

    const suggestions = useMemo(() => {
        if (starterQuestions?.length > 0) return starterQuestions.slice(0, 4);
        return ["Office hours", "Insurance accepted", "Telehealth options", "Emergency info"];
    }, [starterQuestions]);

    const hasMessages = messages.length > 0;

    return (
        <div className={`flex flex-col ${isEmbed ? 'h-full' : 'h-screen'} bg-gradient-to-b from-teal-50 to-white relative overflow-hidden`}>
            {/* Soft decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

            {/* Header */}
            <header className={`${isEmbed ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-teal-100 shadow-sm" : "bg-transparent"
                }`}>
                <div className={`max-w-4xl mx-auto ${isEmbed ? 'px-3 py-2' : 'px-6 py-4'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`${isEmbed ? 'w-7 h-7 rounded-lg' : 'w-11 h-11 rounded-2xl'} bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25`}>
                            <span className={`text-white ${isEmbed ? 'text-sm' : 'text-xl'}`}>🏥</span>
                        </div>
                        <div>
                            <h1 className={`${isEmbed ? 'text-sm' : 'text-[15px]'} font-semibold text-gray-900 tracking-tight`}>{name}</h1>
                            {isEmbed ? <div className="flex items-center gap-1 text-[10px] text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online</div> : <p className="text-[12px] text-teal-600/80 font-medium">{tagline || "Health Information Assistant"}</p>}
                        </div>
                    </div>
                    {!isEmbed && <a href={`/admin/chatbots/${botId}`} className="px-3.5 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200/50 text-[12px] font-medium text-teal-700 transition-all">
                        Admin
                    </a>}
                </div>
            </header>

            {/* Content */}
            <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto ${isEmbed ? 'pt-2 pb-4' : 'pt-20 pb-48'}`}>
                <div className="max-w-3xl mx-auto px-6">
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            {/* Logo with pulse ring */}
                            <div className="relative mb-10">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/30">
                                    <span className="text-4xl">💚</span>
                                </div>
                                <div className="absolute inset-0 rounded-2xl bg-teal-400/30 animate-ping" style={{ animationDuration: "2s" }} />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center">
                                How can I help you today?
                            </h2>
                            <p className="text-gray-500 text-center mb-4 max-w-lg">
                                {greeting || "I'm here to answer your health-related questions and provide helpful information."}
                            </p>

                            {/* Disclaimer */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200/50 mb-10">
                                <span className="text-amber-500">⚠️</span>
                                <span className="text-[12px] text-amber-700">For informational purposes only. Not medical advice.</span>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(action.query)}
                                        className="group p-5 rounded-2xl bg-white border border-teal-100 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</div>
                                        <div className="text-[13px] font-medium text-gray-700 group-hover:text-teal-700">{action.label}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex items-center gap-6 mt-12">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-teal-500">🔒</span>
                                    <span className="text-[12px]">Private & Secure</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-teal-500">⏰</span>
                                    <span className="text-[12px]">24/7 Available</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="text-teal-500">✓</span>
                                    <span className="text-[12px]">Verified Info</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-8">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mr-3 shadow-md shadow-teal-500/20">
                                            <span className="text-white text-sm">💚</span>
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${msg.role === "user"
                                            ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl rounded-br-sm px-5 py-3.5 shadow-lg shadow-teal-500/20"
                                            : "bg-white text-gray-800 rounded-2xl rounded-bl-sm px-5 py-4 border border-teal-100 shadow-sm"
                                        }`}>
                                        <div className="text-[15px] leading-relaxed">
                                            <RenderedMessage content={msg.content} light={true} slug={slug} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mr-3 shadow-md">
                                        <span className="text-white text-sm">💚</span>
                                    </div>
                                    <div className="bg-white rounded-2xl px-5 py-4 border border-teal-100 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                {!isEmbed && <div className="h-8 bg-gradient-to-t from-white to-transparent" />}
                <div className={`bg-white ${isEmbed ? 'pb-2 px-2' : 'pb-6 px-4'}`}>
                    <div className="max-w-3xl mx-auto">
                        {!hasMessages && (
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)} className="px-4 py-2 rounded-full text-[13px] font-medium border border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100 hover:border-teal-300 transition-all">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-teal-100 overflow-hidden focus-within:border-teal-400 focus-within:shadow-teal-500/10 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a health-related question..."
                                    disabled={isLoading}
                                    className="w-full px-5 py-4 pr-28 text-[15px] text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button type="button" className="p-2.5 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className={`p-2.5 rounded-xl transition-all ${input.trim() && !isLoading
                                                ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/30 hover:-translate-y-0.5"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>
                        {!isEmbed && <p className="text-center text-[11px] text-gray-400 mt-3">For informational purposes only • {name}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
