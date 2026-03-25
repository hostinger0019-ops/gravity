"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RenderedMessage } from "@/components/public/RenderedMessage";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface InstagramChatUIProps {
    slug: string;
    name: string;
    avatarUrl: string | null;
    brandColor: string;
    greeting: string;
    starterQuestions: string[];
    botId: string;
    tagline?: string;
    placeholder?: string;
}

export default function InstagramChatUI({
    slug,
    name,
    avatarUrl,
    brandColor,
    greeting,
    starterQuestions,
    botId,
    tagline,
    placeholder,
}: InstagramChatUIProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
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
        { icon: "💬", label: "DM Replies", query: "How do you handle DM replies?" },
        { icon: "💭", label: "Comments", query: "Can you reply to comments?" },
        { icon: "📖", label: "Story Mentions", query: "What about story mentions?" },
        { icon: "🔗", label: "Link in Bio", query: "Tell me about your link in bio" },
    ], []);

    const suggestions = useMemo(() => {
        if (starterQuestions?.length > 0) return starterQuestions.slice(0, 4);
        return ["Product info", "Pricing", "How to order", "Shipping details"];
    }, [starterQuestions]);

    const hasMessages = messages.length > 0;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)" }}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full" />
                <div className="absolute bottom-20 right-10 w-60 h-60 border border-white rounded-full" />
                <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-white rounded-full" />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/30 backdrop-blur-xl" : "bg-transparent"
                }`}>
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
                            <span className="text-xl">📷</span>
                        </div>
                        <div>
                            <h1 className="text-[15px] font-semibold text-white tracking-tight">{name}</h1>
                            <p className="text-[12px] text-white/70 font-medium">{tagline || "Instagram Automation"}</p>
                        </div>
                    </div>
                    <a href={`/admin/chatbots/${botId}`} className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-[12px] font-medium text-white transition-all">
                        Admin
                    </a>
                </div>
            </header>

            {/* Content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-20 pb-48">
                <div className="max-w-3xl mx-auto px-6">
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            {/* Logo */}
                            <div className="relative mb-8">
                                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-4 border-white/50 shadow-2xl">
                                    <span className="text-5xl">📷</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
                                {greeting || "Hey! 👋"}
                            </h2>
                            <p className="text-white/80 text-center mb-10 max-w-md">
                                I'm your Instagram AI assistant. I can help with DMs, comments, and more!
                            </p>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mb-8">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(action.query)}
                                        className="group p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
                                        <div className="text-[13px] font-medium text-white/90">{action.label}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Features */}
                            <div className="flex items-center gap-6 text-white/70 text-sm">
                                <div className="flex items-center gap-2">
                                    <span>💬</span> Auto DM Replies
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>💭</span> Comment Automation
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📊</span> Lead Capture
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-8">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mr-3 border border-white/30">
                                            <span className="text-sm">📷</span>
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${msg.role === "user"
                                        ? "bg-white text-gray-900 rounded-2xl rounded-br-sm px-4 py-3 shadow-lg"
                                        : "bg-white/15 backdrop-blur-lg text-white rounded-2xl rounded-bl-sm px-4 py-3 border border-white/20"
                                        }`}>
                                        <div className="text-[15px] leading-relaxed">
                                            <RenderedMessage content={msg.content} light={msg.role === "user"} slug={slug} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mr-3 border border-white/30">
                                        <span className="text-sm">📷</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/20">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                                            <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
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
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className="h-8 bg-gradient-to-t from-[#E1306C] to-transparent" />
                <div className="pb-6 px-4" style={{ background: "linear-gradient(135deg, #833AB4 0%, #E1306C 100%)" }}>
                    <div className="max-w-3xl mx-auto">
                        {!hasMessages && (
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)} className="px-4 py-2 rounded-full text-[13px] font-medium border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-all">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={placeholder || "Send a message..."}
                                    disabled={isLoading}
                                    className="w-full px-5 py-4 pr-24 text-[15px] text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className={`p-2.5 rounded-xl transition-all ${input.trim() && !isLoading
                                            ? "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg hover:-translate-y-0.5"
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
                        <p className="text-center text-[11px] text-white/60 mt-3">Powered by AI • {name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
