"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RenderedMessage } from "@/components/public/RenderedMessage";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface RealEstateChatUIProps {
    slug: string;
    name: string;
    avatarUrl: string | null;
    brandColor: string;
    greeting: string;
    starterQuestions: string[];
    botId: string;
    tagline?: string;
}

export default function RealEstateChatUI({
    slug,
    name,
    avatarUrl,
    brandColor,
    greeting,
    starterQuestions,
    botId,
    tagline,
}: RealEstateChatUIProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isEmbed, setIsEmbed] = useState(false);
    useEffect(() => { if (typeof window !== 'undefined') { const p = new URLSearchParams(window.location.search); setIsEmbed(p.get('embed') === '1'); } }, []);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
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
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "I apologize, but I couldn't process your request. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    const quickActions = useMemo(() => [
        { icon: "🏠", label: "Browse Listings", query: "Show me available properties" },
        { icon: "📅", label: "Schedule Viewing", query: "I'd like to schedule a property viewing" },
        { icon: "💰", label: "Price Estimate", query: "What's the price range for properties?" },
        { icon: "📍", label: "Neighborhoods", query: "Tell me about the neighborhoods" },
    ], []);

    const suggestions = useMemo(() => {
        if (starterQuestions?.length > 0) return starterQuestions.slice(0, 4);
        return ["2 bedroom apartments", "Properties with parking", "Near downtown", "New listings"];
    }, [starterQuestions]);

    const hasMessages = messages.length > 0;

    return (
        <div className={`flex flex-col ${isEmbed ? 'h-full' : 'h-screen'} bg-[#F8F6F3] relative overflow-hidden`}>
            {/* Elegant texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Premium Header */}
            <header
                className={`${isEmbed ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                        ? "bg-white/80 backdrop-blur-xl border-b border-amber-100/50 shadow-sm"
                        : "bg-transparent"
                    }`}
            >
                <div className={`max-w-4xl mx-auto ${isEmbed ? 'px-3 py-2' : 'px-6 py-4'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`${isEmbed ? 'w-7 h-7 rounded-lg' : 'w-11 h-11 rounded-xl'} bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25`}>
                            <span className={`text-white ${isEmbed ? 'text-sm' : 'text-xl'}`}>🏠</span>
                        </div>
                        <div>
                            <h1 className={`${isEmbed ? 'text-sm' : 'text-[15px]'} font-semibold text-gray-900 tracking-tight`}>{name}</h1>
                            {isEmbed ? <div className="flex items-center gap-1 text-[10px] text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online</div> : <p className="text-[12px] text-amber-700/70 font-medium">{tagline || "Your Property Expert"}</p>}
                        </div>
                    </div>
                    {!isEmbed && <a
                        href={`/admin/chatbots/${botId}`}
                        className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/50 transition-all text-[12px] font-medium text-amber-800"
                    >
                        Admin
                    </a>}
                </div>
            </header>

            {/* Content */}
            <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto ${isEmbed ? 'pt-2 pb-4' : 'pt-20 pb-48'}`}>
                <div className="max-w-3xl mx-auto px-6">
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
                            {/* Elegant Logo */}
                            <div className="relative mb-10">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                                    <span className="text-4xl">🏡</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                                    <span className="text-white text-[10px]">✓</span>
                                </div>
                            </div>

                            {/* Welcome Text */}
                            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center tracking-tight">
                                Find Your Dream Home
                            </h2>
                            <p className="text-gray-500 text-center mb-12 max-w-lg leading-relaxed">
                                {greeting || "I'm here to help you discover the perfect property. Ask about listings, schedule viewings, or explore neighborhoods."}
                            </p>

                            {/* Luxury Quick Action Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(action.query)}
                                        className="group relative p-5 rounded-2xl bg-white border border-amber-100/80 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                                            {action.icon}
                                        </div>
                                        <div className="text-[13px] font-medium text-gray-700 group-hover:text-amber-800 transition-colors">
                                            {action.label}
                                        </div>
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>

                            {/* Stats Bar */}
                            <div className="flex items-center gap-8 mt-12 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-amber-600">500+</div>
                                    <div className="text-[11px] text-gray-500 uppercase tracking-wider">Listings</div>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div>
                                    <div className="text-2xl font-bold text-amber-600">24/7</div>
                                    <div className="text-[11px] text-gray-500 uppercase tracking-wider">Available</div>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div>
                                    <div className="text-2xl font-bold text-amber-600">★ 4.9</div>
                                    <div className="text-[11px] text-gray-500 uppercase tracking-wider">Rated</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-8">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slideUp`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mr-3 shadow-md shadow-amber-500/20">
                                            <span className="text-white text-sm">🏠</span>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] ${msg.role === "user"
                                                ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-2xl rounded-br-sm px-5 py-3.5 shadow-lg shadow-amber-500/20"
                                                : "bg-white text-gray-800 rounded-2xl rounded-bl-sm px-5 py-4 border border-amber-100/50 shadow-sm"
                                            }`}
                                    >
                                        <div className="text-[15px] leading-relaxed">
                                            <RenderedMessage content={msg.content} light={true} slug={slug} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mr-3 shadow-md">
                                        <span className="text-white text-sm">🏠</span>
                                    </div>
                                    <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-4 border border-amber-100/50 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Input */}
            <div className={`${isEmbed ? 'sticky' : 'fixed'} bottom-0 left-0 right-0 z-40`}>
                {!isEmbed && <div className="h-8 bg-gradient-to-t from-[#F8F6F3] to-transparent" />}
                <div className={`bg-[#F8F6F3] ${isEmbed ? 'pb-2 px-2' : 'pb-6 px-4'}`}>
                    <div className="max-w-3xl mx-auto">
                        {/* Suggestion Pills */}
                        {!hasMessages && (
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s)}
                                        className="px-4 py-2 rounded-full text-[13px] font-medium border border-amber-200 text-amber-800 bg-white hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 hover:shadow-md"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Bar */}
                        <form onSubmit={handleSubmit}>
                            <div className="relative bg-white rounded-2xl shadow-xl shadow-amber-900/5 border border-amber-100 overflow-hidden focus-within:border-amber-400 focus-within:shadow-amber-500/10 transition-all duration-300">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about properties, viewings, or neighborhoods..."
                                    disabled={isLoading}
                                    className="w-full px-5 py-4 pr-28 text-[15px] text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        className="p-2.5 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className={`p-2.5 rounded-xl transition-all duration-300 ${input.trim() && !isLoading
                                                ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5"
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
                        {!isEmbed && <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">
                            Powered by AI • {name}
                        </p>}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
                .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}
