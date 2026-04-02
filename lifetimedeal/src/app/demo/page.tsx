"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    Send,
    Bot,
    ArrowRight,
    Sparkles,
    ChevronRight,
    MessageSquare,
    Play,
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

// ── The main app where the chatbot API lives ──
// Change this to your production domain when deploying
const MAIN_APP_URL = "http://localhost:4010";
// Change this to your demo chatbot's slug
const DEMO_SLUG = "Agent Forja-demo";

export default function DemoPage() {
    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Auto-send the first message when user taps "Start Demo"
    async function startDemo() {
        setStarted(true);
        // Show greeting first
        setMessages([
            { role: "assistant", content: "Hey! 👋 I'm a Agent Forja AI assistant. I'm about to show you exactly what your clients' customers will experience. Let me tell you how Agent Forja can help your agency earn recurring revenue..." },
        ]);

        // Auto-send a message after a short delay
        setTimeout(() => {
            sendMessage("Tell me how Agent Forja works and how I can make money with it as an agency owner", true);
        }, 1500);
    }

    async function sendMessage(text?: string, isAuto = false) {
        if (loading) return;
        const msg = text || input.trim();
        if (!msg) return;
        if (!isAuto) setInput("");

        const userMsg: Msg = { role: "user", content: msg };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const history = messages.slice(-10);
            const payload = [...history, userMsg];

            const res = await fetch(`${MAIN_APP_URL}/api/bots/${encodeURIComponent(DEMO_SLUG)}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: payload }),
            });

            let acc = "";
            const willStream = res.ok && !!res.body;

            // Add empty assistant message
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            setStreaming(true);

            if (willStream) {
                const reader = res.body!.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    if (!chunk) continue;
                    acc += chunk;
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last && last.role === "assistant") last.content = acc;
                        return [...updated];
                    });
                }
            } else {
                acc = await res.text().catch(() => "Sorry, I couldn't respond right now. Please try again.");
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") last.content = acc;
                    return [...updated];
                });
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "⚠️ Couldn't connect to the AI. Make sure the main Agent Forja app is running on port 4010 with a chatbot slug set to `Agent Forja-demo`." },
            ]);
        } finally {
            setLoading(false);
            setStreaming(false);
        }
    }

    return (
        <div className="bg-black text-zinc-200 min-h-screen flex flex-col">
            {/* Minimal header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
                    <a href="/" className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-violet-400" />
                        <span className="font-bold text-white">Agent Forja</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full ml-1">LIVE DEMO</span>
                    </a>
                    <a
                        href="/#pricing"
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:shadow-lg hover:shadow-violet-500/30 transition-all hover:scale-105"
                    >
                        Get Lifetime Access — $99
                    </a>
                </div>
            </header>

            {/* Content */}
            <AnimatePresence mode="wait">
                {!started ? (
                    /* ── INTRO SCREEN ── */
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="flex-1 flex items-center justify-center px-6 pt-20"
                    >
                        <div className="max-w-2xl w-full text-center">
                            {/* Background glow */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative"
                            >
                                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-8">
                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                    <span className="text-violet-400 text-sm font-medium">Interactive AI Demo</span>
                                </div>

                                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                                    <span className="text-white">Experience</span>{" "}
                                    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                                        AI in Action
                                    </span>
                                </h1>

                                <p className="text-lg text-zinc-400 max-w-lg mx-auto mb-4 leading-relaxed">
                                    This is exactly what your clients&apos; customers will see. A smart AI chatbot that answers questions, captures leads, and closes deals — 24/7.
                                </p>

                                <p className="text-sm text-zinc-500 mb-10">
                                    Tap below and watch the AI introduce itself and explain how Agent Forja works.
                                </p>

                                {/* Big CTA */}
                                <button
                                    onClick={startDemo}
                                    className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-10 py-5 text-xl font-bold rounded-2xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105"
                                >
                                    <Play className="w-6 h-6 fill-white" />
                                    Start Live Demo
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-zinc-600 text-xs mt-6">No sign-up needed · Real AI · Takes 30 seconds</p>
                            </motion.div>

                            {/* Feature pills */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="relative flex flex-wrap justify-center gap-3 mt-16"
                            >
                                {["Lead Capture", "Knowledge Base", "White-Label", "7 Themes", "Instagram DM"].map((f) => (
                                    <span key={f} className="text-xs px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                                        {f}
                                    </span>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    /* ── CHAT INTERFACE ── */
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col pt-16"
                    >
                        {/* Chat header */}
                        <div className="border-b border-white/5 bg-zinc-950/80 backdrop-blur">
                            <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">Agent Forja AI</p>
                                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Live Demo
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-zinc-500 hidden sm:block">This is what your clients&apos; customers see</span>
                                    <a
                                        href="/#pricing"
                                        className="text-xs bg-violet-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-violet-500 transition-colors"
                                    >
                                        Get This — $99
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className="flex gap-3 max-w-[85%] md:max-w-[70%]">
                                            {m.role === "assistant" && (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                                    m.role === "user"
                                                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-sm"
                                                        : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-sm"
                                                }`}
                                            >
                                                {m.content || (
                                                    <span className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0.15s" }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                                                    </span>
                                                )}
                                            </div>
                                            {m.role === "user" && (
                                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-white">
                                                    You
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {loading && !streaming && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 rounded-bl-sm">
                                            <span className="flex gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0.15s" }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Suggestion pills (show after first response) */}
                                {messages.length >= 2 && !loading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-wrap gap-2 pt-2"
                                    >
                                        {[
                                            "What themes are available?",
                                            "How does white-label work?",
                                            "Show me the ROI math",
                                            "What about Instagram DMs?",
                                        ].map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => sendMessage(q)}
                                                className="text-xs px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                <div ref={endRef} />
                            </div>
                        </div>

                        {/* Input bar */}
                        <div className="border-t border-white/5 bg-zinc-950/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
                            <div className="max-w-3xl mx-auto px-6 py-4">
                                <div className="flex items-end gap-3">
                                    <input
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                        placeholder="Ask anything about Agent Forja..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={loading || !input.trim()}
                                        className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/20 transition-all flex-shrink-0"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-center text-zinc-600 text-[10px] mt-3">
                                    Powered by Agent Forja AI · Self-hosted on dedicated GPUs ·{" "}
                                    <a href="/#pricing" className="text-violet-500 hover:text-violet-400">
                                        Get lifetime access for $99 →
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Floating CTA bar at bottom */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 5 }}
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 hidden sm:block"
                        >
                            <a
                                href="/#pricing"
                                className="group flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-violet-500/30 rounded-full px-6 py-3 text-sm shadow-2xl shadow-violet-500/10 hover:border-violet-500/50 transition-all"
                            >
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <span className="text-zinc-300">Want this for your agency?</span>
                                <span className="text-violet-400 font-semibold group-hover:text-violet-300">
                                    Get it for $99
                                    <ChevronRight className="w-4 h-4 inline ml-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
