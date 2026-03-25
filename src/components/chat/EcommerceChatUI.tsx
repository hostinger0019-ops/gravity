"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RenderedMessage } from "@/components/public/RenderedMessage";
import ChatbotVoiceMode from "@/components/ChatbotVoiceMode";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface EcommerceChatUIProps {
    slug: string;
    name: string;
    avatarUrl: string | null;
    brandColor: string;
    greeting: string;
    starterQuestions: string[];
    botId: string;
    tagline?: string;
}

// Curated product cards data
const CURATED_PRODUCTS = [
    { id: 1, title: "Leather Journal Collection", badge: "Nova Pick", gradient: "from-amber-900/80 to-stone-800/80", image: "/demo-product-1.png" },
    { id: 2, title: "Artisan Tea Set", badge: "Nova Pick", gradient: "from-emerald-900/80 to-stone-800/80", image: "/demo-product-2.png" },
    { id: 3, title: "Premium Desk Lamp", badge: "Nova Pick", gradient: "from-orange-900/80 to-amber-900/80", image: null as string | null },
    { id: 4, title: "Classic Notebook Bundle", badge: "Nova Pick", gradient: "from-indigo-900/80 to-slate-800/80", image: null as string | null },
    { id: 5, title: "Handcrafted Pen Set", badge: "Nova Pick", gradient: "from-rose-900/80 to-stone-800/80", image: null as string | null },
];

const STYLE_TAGS = [
    { emoji: "📚", label: "Classic Lit" },
    { emoji: "🚀", label: "Sci-Fi/Modernist" },
    { emoji: "✨", label: "Minimalist Style" },
    { emoji: "🎁", label: "Gift Curator" },
];

export default function EcommerceChatUI({
    slug,
    name,
    avatarUrl,
    brandColor,
    greeting,
    starterQuestions,
    botId,
    tagline,
}: EcommerceChatUIProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [voiceOpen, setVoiceOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

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
        const handleScroll = () => {
            setIsScrolled(container.scrollTop > 20);
        };
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
                body: JSON.stringify({
                    botId,
                    messages: [...messages, userMessage],
                }),
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
                    const chunk = decoder.decode(value, { stream: true });
                    fullText += chunk;
                    setMessages((prev) => {
                        const copy = [...prev];
                        copy[copy.length - 1] = { role: "assistant", content: fullText };
                        return copy;
                    });
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
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

    const quickActions = useMemo(() => {
        return [
            { icon: "📦", label: "Live Order\nTracking", query: "Where is my order?", gradient: "from-slate-700/90 to-slate-800/90", borderColor: "border-amber-700/30" },
            { icon: "📖", label: "Your Curated Reads\n& Style Guide", query: "Show me curated recommendations", gradient: "from-amber-900/60 to-stone-800/80", borderColor: "border-amber-600/30" },
            { icon: "✨", label: "New Arrivals\n& Exclusives", query: "Show me new arrivals", gradient: "from-indigo-900/60 to-slate-800/80", borderColor: "border-indigo-500/30" },
            { icon: "🌍", label: "Global Premier\nSupport", query: "I need help with something", gradient: "from-emerald-900/60 to-slate-800/80", borderColor: "border-emerald-600/30" },
        ];
    }, []);

    const suggestions = useMemo(() => {
        if (starterQuestions && starterQuestions.length > 0) {
            return starterQuestions.slice(0, 5);
        }
        return [];
    }, [starterQuestions]);

    const hasMessages = messages.length > 0;

    const scrollCarousel = (direction: "left" | "right") => {
        if (!carouselRef.current) return;
        const scrollAmount = 220;
        carouselRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <div className="flex flex-col h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #080E1A 0%, #0B1120 30%, #0F172A 100%)" }}>
            {/* Voice Mode Overlay */}
            <ChatbotVoiceMode
                isOpen={voiceOpen}
                onClose={() => setVoiceOpen(false)}
                chatbotId={botId}
                onMessage={(userText, aiText) => {
                    setMessages(prev => [...prev, { role: "user", content: userText }, { role: "assistant", content: aiText }]);
                }}
            />
            {/* Subtle ambient glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none" style={{ background: "radial-gradient(circle, #D4A574 0%, transparent 70%)" }} />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.05] pointer-events-none" style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }} />

            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "backdrop-blur-xl border-b shadow-lg"
                    : ""
                    }`}
                style={{
                    backgroundColor: isScrolled ? "rgba(11, 17, 32, 0.85)" : "transparent",
                    borderColor: isScrolled ? "rgba(212, 165, 116, 0.15)" : "transparent",
                }}
            >
                <div className="max-w-5xl mx-auto px-6 py-3">
                    {/* Top line: BotForge label */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium tracking-widest uppercase" style={{ color: "#8B9CC0" }}>
                                BotForge · AI Assistant Platform
                            </span>
                        </div>
                        <a
                            href={`/admin/chatbots/${botId}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-full transition-colors text-[11px] font-medium"
                            style={{ backgroundColor: "rgba(212, 165, 116, 0.1)", color: "#D4A574", border: "1px solid rgba(212, 165, 116, 0.2)" }}
                        >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: "linear-gradient(135deg, #D4A574, #C4956A)" }}>A</span>
                        </a>
                    </div>
                    {/* Brand name */}
                    <h1
                        className="text-2xl md:text-3xl font-bold tracking-wide mt-1"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#D4A574" }}
                    >
                        {name}
                    </h1>
                </div>
            </header>

            {/* Main Content Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pt-24 pb-56"
            >
                <div className="max-w-5xl mx-auto px-6">
                    {!hasMessages ? (
                        /* Welcome State */
                        <div className="flex flex-col animate-ec-fadeIn">
                            {/* Welcome Greeting */}
                            <div className="mb-8 mt-4">
                                <h2
                                    className="text-2xl md:text-3xl font-bold mb-2 tracking-tight"
                                    style={{ color: "#E8E0D8" }}
                                >
                                    {greeting || `Welcome. I'm your curating concierge!`} ✨
                                </h2>
                                <p className="text-[15px] max-w-2xl" style={{ color: "#7A8BA8" }}>
                                    {tagline || "Your personal guide to discoveries. Explore products, track a journey, or define your aesthetic."}
                                </p>
                            </div>

                            {/* Feature Cards Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(action.query)}
                                        className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
                                        style={{
                                            border: "1px solid rgba(212, 165, 116, 0.12)",
                                            minHeight: "160px",
                                        }}
                                    >
                                        {/* Card gradient background */}
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${action.gradient}`}
                                        />
                                        {/* Shimmer on hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(212,165,116,0.08) 0%, transparent 60%)" }} />

                                        <div className="relative p-4 flex flex-col justify-between h-full">
                                            {/* Icon */}
                                            <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                                {action.icon}
                                            </div>
                                            {/* Label */}
                                            <div>
                                                <div className="text-[13px] font-semibold leading-tight whitespace-pre-line" style={{ color: "#E8E0D8" }}>
                                                    {action.label}
                                                </div>
                                                {/* Small arrow indicator */}
                                                <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <span className="text-[11px]" style={{ color: "#D4A574" }}>Explore</span>
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Curated For You Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4 tracking-tight" style={{ color: "#E8E0D8" }}>
                                    Curated for You
                                </h3>
                                <div className="relative">
                                    {/* Scroll buttons */}
                                    <button
                                        onClick={() => scrollCarousel("left")}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110"
                                        style={{ backgroundColor: "rgba(11, 17, 32, 0.8)", border: "1px solid rgba(212, 165, 116, 0.2)" }}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => scrollCarousel("right")}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110"
                                        style={{ backgroundColor: "rgba(11, 17, 32, 0.8)", border: "1px solid rgba(212, 165, 116, 0.2)" }}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Scrollable container */}
                                    <div
                                        ref={carouselRef}
                                        className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    >
                                        {CURATED_PRODUCTS.map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() => sendMessage(`Tell me about ${product.title}`)}
                                                className="flex-shrink-0 group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.04] hover:shadow-lg"
                                                style={{
                                                    width: "170px",
                                                    height: "140px",
                                                    border: "1px solid rgba(212, 165, 116, 0.1)",
                                                }}
                                            >
                                                {/* Product card background — image or gradient */}
                                                {product.image ? (
                                                    <>
                                                        <img
                                                            src={product.image}
                                                            alt={product.title}
                                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,17,32,0.2) 0%, rgba(11,17,32,0.75) 100%)" }} />
                                                    </>
                                                ) : (
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient}`} />
                                                )}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(212,165,116,0.1) 0%, transparent 60%)" }} />

                                                <div className="relative p-3 flex flex-col justify-between h-full">
                                                    {/* Badge */}
                                                    <div
                                                        className="self-start px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                                        style={{ backgroundColor: "rgba(212, 165, 116, 0.9)", color: "#0B1120" }}
                                                    >
                                                        {product.badge}
                                                    </div>
                                                    {/* Product name */}
                                                    <p className="text-[12px] font-medium leading-tight" style={{ color: "#E8E0D8" }}>
                                                        {product.title}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Style Preference Tags */}
                            <div className="mb-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[12px] font-medium mr-1" style={{ color: "#7A8BA8" }}>
                                        Define your style preferences:
                                    </span>
                                    {STYLE_TAGS.map((tag, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(`I'm interested in ${tag.label} style`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 hover:scale-105"
                                            style={{
                                                backgroundColor: "rgba(212, 165, 116, 0.08)",
                                                border: "1px solid rgba(212, 165, 116, 0.2)",
                                                color: "#D4A574",
                                            }}
                                        >
                                            <span>{tag.emoji}</span>
                                            <span>{tag.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Messages */
                        <div className="space-y-5 py-6 animate-ec-fadeIn">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-ec-slideUp`}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    {msg.role === "assistant" && (
                                        <div
                                            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mr-3 shadow-md"
                                            style={{ background: "linear-gradient(135deg, #D4A574, #C4956A)" }}
                                        >
                                            <span className="text-white text-sm">✦</span>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] ${msg.role === "user"
                                            ? "rounded-2xl rounded-br-md px-5 py-3 shadow-lg"
                                            : "rounded-2xl rounded-bl-md px-5 py-4 shadow-sm"
                                            }`}
                                        style={
                                            msg.role === "user"
                                                ? { background: "linear-gradient(135deg, #D4A574, #B8895A)", color: "#0B1120" }
                                                : { backgroundColor: "rgba(30, 41, 65, 0.8)", border: "1px solid rgba(212, 165, 116, 0.1)", color: "#E8E0D8" }
                                        }
                                    >
                                        <div className="text-[15px] leading-relaxed">
                                            <RenderedMessage content={msg.content} light={msg.role === "user"} slug={slug} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start animate-ec-slideUp">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center mr-3 shadow-md"
                                        style={{ background: "linear-gradient(135deg, #D4A574, #C4956A)" }}
                                    >
                                        <span className="text-white text-sm">✦</span>
                                    </div>
                                    <div
                                        className="rounded-2xl rounded-bl-md px-5 py-4 shadow-sm"
                                        style={{ backgroundColor: "rgba(30, 41, 65, 0.8)", border: "1px solid rgba(212, 165, 116, 0.1)" }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#D4A574", animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#C4956A", animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#B8895A", animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Input Area */}
            <div className="fixed bottom-0 left-0 right-0 z-40">
                {/* Gradient fade */}
                <div className="h-8" style={{ background: "linear-gradient(to top, #0F172A, transparent)" }} />

                <div className="pb-5 px-4" style={{ backgroundColor: "#0F172A" }}>
                    <div className="max-w-5xl mx-auto">
                        {/* Suggestion Chips */}
                        {!hasMessages && suggestions.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(suggestion)}
                                        className="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 hover:scale-105"
                                        style={{
                                            backgroundColor: "rgba(30, 41, 65, 0.6)",
                                            border: "1px solid rgba(212, 165, 116, 0.15)",
                                            color: "#8B9CC0",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.target as HTMLButtonElement).style.borderColor = "rgba(212, 165, 116, 0.4)";
                                            (e.target as HTMLButtonElement).style.color = "#D4A574";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.target as HTMLButtonElement).style.borderColor = "rgba(212, 165, 116, 0.15)";
                                            (e.target as HTMLButtonElement).style.color = "#8B9CC0";
                                        }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Bar */}
                        <form onSubmit={handleSubmit} className="relative">
                            <div
                                className="relative rounded-2xl overflow-hidden transition-all duration-300 group"
                                style={{
                                    backgroundColor: "rgba(30, 41, 65, 0.6)",
                                    border: "1px solid rgba(212, 165, 116, 0.15)",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={`Ask ${name} about anything... product details, order status, or style inspiration...`}
                                    disabled={isLoading}
                                    className="w-full px-5 py-4 pr-28 text-[15px] bg-transparent focus:outline-none placeholder-opacity-60"
                                    style={{ color: "#E8E0D8", caretColor: "#D4A574" }}
                                    onFocus={(e) => {
                                        const parent = e.target.parentElement;
                                        if (parent) parent.style.borderColor = "rgba(212, 165, 116, 0.4)";
                                    }}
                                    onBlur={(e) => {
                                        const parent = e.target.parentElement;
                                        if (parent) parent.style.borderColor = "rgba(212, 165, 116, 0.15)";
                                    }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {/* Voice Button */}
                                    <button
                                        type="button"
                                        onClick={() => setVoiceOpen(true)}
                                        className="p-2.5 rounded-xl transition-all duration-200"
                                        style={{ color: "#7A8BA8" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#D4A574"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA8"; }}
                                        title="Voice Mode — Talk to the assistant"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </button>
                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="p-2.5 rounded-xl transition-all duration-300"
                                        style={{
                                            background: input.trim() && !isLoading
                                                ? "linear-gradient(135deg, #D4A574, #B8895A)"
                                                : "rgba(55, 65, 90, 0.5)",
                                            color: input.trim() && !isLoading ? "#0B1120" : "#4A5568",
                                            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                                            boxShadow: input.trim() && !isLoading ? "0 4px 15px rgba(212,165,116,0.25)" : "none",
                                        }}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-[11px] mt-3 font-medium tracking-wide" style={{ color: "#4A5568" }}>
                            Powered by AI • {name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes ec-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes ec-slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                .animate-ec-fadeIn {
                    animation: ec-fadeIn 0.6s ease-out forwards;
                }
                .animate-ec-slideUp {
                    animation: ec-slideUp 0.4s ease-out forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                input::placeholder {
                    color: #4A5568;
                }
            `}</style>
        </div>
    );
}
