"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TemplateSelector } from "./TemplateSelector";
import { RestaurantTemplate, RestaurantConfig } from "./RestaurantTemplate";
import { IndustryTemplate } from "@/data/industry-templates";

const devNoAuth = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatbotConfig {
    name: string;
    greeting: string;
    directive: string;
    starterQuestions: string[];
    theme: string;
    brandColor: string;
    websiteToScrape?: string | null;
    slug: string;
}

interface CreatedChatbot {
    id: string;
    name: string;
    slug: string;
}

// ── Session types ──
interface BuilderSession {
    id: string;
    title: string;
    messages: Message[];
    selectedTemplate: string | null;
    createdBot: CreatedChatbot | null;
    createdAtIndex: number | null;
    updatedAt: string;
}

const SESSIONS_KEY = "ai-builder-sessions";
const ACTIVE_KEY = "ai-builder-active";
const MAX_SESSIONS = 20;
const INITIAL_MSG: Message = {
    role: "assistant",
    content: "Hi! 🤖 I'll help you create the perfect chatbot. Tell me about your business and what you want the chatbot to do.\n\n💡 **Tip:** Include your website URL and I'll automatically import your content!",
};

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function loadSessions(): BuilderSession[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch { return []; }
}

function saveSessions(sessions: BuilderSession[]) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS))); } catch {}
}

function saveActiveId(id: string | null) {
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY);
}

export function AIChat() {
    const router = useRouter();
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showRestaurantTemplate, setShowRestaurantTemplate] = useState(false);
    const [createdBot, setCreatedBot] = useState<CreatedChatbot | null>(null);
    const [createdAtIndex, setCreatedAtIndex] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Multi-session state ──
    const [sessions, setSessions] = useState<BuilderSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Save current state back into sessions array
    const persistCurrent = (sid: string | null, msgs: Message[], tpl: string | null, bot: CreatedChatbot | null, idx: number | null) => {
        if (!sid) return;
        setSessions(prev => {
            const now = new Date().toISOString();
            const title = msgs.find(m => m.role === "user")?.content.slice(0, 45) || "New Chat";
            const updated = prev.map(s => s.id === sid ? { ...s, messages: msgs, selectedTemplate: tpl, createdBot: bot, createdAtIndex: idx, updatedAt: now, title } : s);
            saveSessions(updated);
            return updated;
        });
    };

    // Load sessions on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        const loaded = loadSessions();
        const savedActiveId = localStorage.getItem(ACTIVE_KEY);

        // Migrate from old single-session format
        if (loaded.length === 0) {
            try {
                const old = localStorage.getItem("ai-chat-session");
                if (old) {
                    const parsed = JSON.parse(old);
                    if (parsed.messages && parsed.messages.length > 1) {
                        const migrated: BuilderSession = {
                            id: genId(),
                            title: parsed.messages.find((m: Message) => m.role === "user")?.content.slice(0, 45) || "Imported Chat",
                            messages: parsed.messages,
                            selectedTemplate: parsed.selectedTemplate || null,
                            createdBot: parsed.createdBot || null,
                            createdAtIndex: parsed.createdAtIndex ?? null,
                            updatedAt: parsed.updatedAt || new Date().toISOString(),
                        };
                        loaded.push(migrated);
                        saveSessions(loaded);
                        saveActiveId(migrated.id);
                        localStorage.removeItem("ai-chat-session");
                    }
                }
            } catch {}
        }

        setSessions(loaded);
        const active = loaded.find(s => s.id === savedActiveId) || loaded[0];
        if (active) {
            setActiveSessionId(active.id);
            setMessages(active.messages);
            setSelectedTemplate(active.selectedTemplate);
            setCreatedBot(active.createdBot);
            setCreatedAtIndex(active.createdAtIndex);
            saveActiveId(active.id);
        } else {
            // No sessions — create a fresh one
            const fresh: BuilderSession = { id: genId(), title: "New Chat", messages: [INITIAL_MSG], selectedTemplate: null, createdBot: null, createdAtIndex: null, updatedAt: new Date().toISOString() };
            setSessions([fresh]);
            setActiveSessionId(fresh.id);
            saveSessions([fresh]);
            saveActiveId(fresh.id);
        }
        setHasLoadedHistory(true);
    }, []);

    // Auto-save current session whenever messages/bot change
    useEffect(() => {
        if (!hasLoadedHistory || !activeSessionId) return;
        persistCurrent(activeSessionId, messages, selectedTemplate, createdBot, createdAtIndex);
    }, [messages, selectedTemplate, createdBot, createdAtIndex, hasLoadedHistory, activeSessionId]);

    // Switch to a different session
    const switchSession = (id: string) => {
        // Save current before switching
        persistCurrent(activeSessionId, messages, selectedTemplate, createdBot, createdAtIndex);
        const s = sessions.find(s => s.id === id);
        if (!s) return;
        setActiveSessionId(id);
        setMessages(s.messages);
        setSelectedTemplate(s.selectedTemplate);
        setCreatedBot(s.createdBot);
        setCreatedAtIndex(s.createdAtIndex);
        setInput("");
        setShowRestaurantTemplate(false);
        saveActiveId(id);
        setSidebarOpen(false);
    };

    // Delete a session
    const deleteSession = (id: string) => {
        setSessions(prev => {
            const next = prev.filter(s => s.id !== id);
            saveSessions(next);
            if (id === activeSessionId) {
                const fallback = next[0];
                if (fallback) {
                    switchSession(fallback.id);
                } else {
                    newSession();
                }
            }
            return next;
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, createdBot]);

    const handleTemplateSelect = (template: IndustryTemplate) => {
        setSelectedTemplate(template.id);

        // Show dedicated template wizard for restaurant
        if (template.id === "restaurant") {
            setShowRestaurantTemplate(true);
            return;
        }

        if (template.id === "custom") {
            setInput("");
            inputRef.current?.focus();
        } else {
            const message = `I want to create a ${template.name.toLowerCase()} chatbot.`;
            setInput(message);
            setTimeout(() => sendMessage(message, template.id), 100);
        }
    };

    // Handle restaurant template completion
    const handleRestaurantComplete = async (config: RestaurantConfig) => {
        setShowRestaurantTemplate(false);

        // Build chatbot config from restaurant template
        const features = config.features.map(f => {
            const featureMap: Record<string, string> = {
                reservations: "table reservations",
                menu: "menu information",
                hours: "operating hours",
                delivery: "home delivery",
                takeout: "takeout orders",
                specials: "daily specials",
                events: "events and parties",
                dietary: "dietary options",
            };
            return featureMap[f] || f;
        });

        const chatbotConfig: ChatbotConfig = {
            name: `${config.restaurantName} Assistant`,
            greeting: `👋 Welcome to ${config.restaurantName}! I can help you with ${features.slice(0, 2).join(", ")} and more. How can I assist you today?`,
            directive: `You are a friendly and helpful assistant for ${config.restaurantName}, a ${config.cuisineType} restaurant. 
Your main responsibilities are to help customers with: ${features.join(", ")}.
${config.specialNote ? `Special note: ${config.specialNote}` : ""}
Be warm, welcoming, and knowledgeable about the restaurant. If someone wants to make a reservation, ask for their preferred date, time, and party size.`,
            starterQuestions: [
                "Can I make a reservation?",
                "What's on the menu?",
                "What are your hours?"
            ],
            theme: "restaurant",
            brandColor: "#F97316",
            websiteToScrape: config.websiteUrl || null,
            slug: config.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        };

        await createChatbot(chatbotConfig);
    };

    // Auto-create chatbot from config
    const createChatbot = async (config: ChatbotConfig) => {
        setIsCreating(true);
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "⏳ Creating your chatbot..."
        }]);

        try {
            console.log("Creating chatbot...");

            const response = await fetch("/api/ai-generator/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config }),
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = {
                        role: "assistant",
                        content: "❌ Error creating chatbot: " + data.error
                    };
                    return newMsgs;
                });
                return;
            }

            // Success! Show the live link
            if (data.chatbot) {
                setCreatedBot({
                    id: data.chatbot.id,
                    name: data.chatbot.name,
                    slug: data.chatbot.slug,
                });
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = {
                        role: "assistant",
                        content: `🎉 **Your chatbot "${data.chatbot.name}" is ready!**\n\n${config.websiteToScrape ? "📥 Website content is being imported in the background." : ""}`
                    };
                    // Track where the bot was created in the message flow
                    setCreatedAtIndex(newMsgs.length - 1);
                    return newMsgs;
                });
            }
        } catch (error) {
            console.error("Create error:", error);
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: "❌ Network error. Please try again."
                };
                return newMsgs;
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Update existing chatbot
    const updateChatbot = async (botId: string, changes: Record<string, any>) => {
        setIsCreating(true);

        try {
            const response = await fetch(`/api/admin/chatbots/${botId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(changes),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = {
                        role: "assistant",
                        content: "❌ Error updating chatbot: " + (data.error || "Unknown error")
                    };
                    return newMsgs;
                });
                return;
            }

            // Format what was changed for the confirmation message
            const changedFields = Object.keys(changes);
            const changesList = changedFields.map(field => {
                switch (field) {
                    case 'greeting': return '✅ Greeting updated';
                    case 'directive': return '✅ Bot behavior updated';
                    case 'name': return `✅ Name changed to "${changes.name}"`;
                    case 'starterQuestions': return '✅ Starter questions updated';
                    case 'brandColor': return '✅ Color updated';
                    case 'theme': return '✅ Theme updated';
                    case 'placeholder': return `✅ Input placeholder changed to "${changes.placeholder}"`;
                    default: return `✅ ${field} updated`;
                }
            }).join('\n');

            // Update createdBot name if it changed
            if (changes.name && createdBot) {
                setCreatedBot({ ...createdBot, name: changes.name });
            }

            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: `🎉 **Changes applied!**\n\n${changesList}\n\nYour chatbot has been updated. You can preview it or ask me to make more changes!`
                };
                return newMsgs;
            });
        } catch (error) {
            console.error("Update error:", error);
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: "❌ Network error while updating. Please try again."
                };
                return newMsgs;
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Fetch current bot settings so LLM knows what to modify
    const fetchBotSettings = async (): Promise<Record<string, any> | null> => {
        if (!createdBot) return null;
        try {
            const res = await fetch(`/api/admin/chatbots/${createdBot.id}`);
            if (!res.ok) return null;
            const bot = await res.json();
            return {
                name: bot.name || "",
                greeting: bot.greeting || "",
                directive: bot.directive || "",
                starterQuestions: bot.starter_questions || [],
                brandColor: bot.brand_color || "",
                theme: bot.theme_template || "",
                tagline: bot.tagline || "",
            };
        } catch {
            return null;
        }
    };

    const sendMessage = async (text?: string, templateId?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const newMessages: Message[] = [...messages, { role: "user", content: messageText }];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            // Fetch current bot settings so LLM knows what to modify
            const currentBotSettings = await fetchBotSettings();

            const response = await fetch("/api/ai-generator/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.slice(1),
                    templateId: templateId || selectedTemplate,
                    currentBotSettings,
                }),
            });

            const data = await response.json();
            console.log("API Response:", data);

            if (data.error) {
                setMessages([...newMessages, {
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${data.error}`
                }]);
                return;
            }

            // Check if AI returned a ready config - AUTO CREATE!
            if (data.parsed && data.parsed.ready === true && data.parsed.config) {
                console.log("Config found, creating chatbot:", data.parsed.config);
                setMessages([...newMessages, {
                    role: "assistant",
                    content: data.reply || `✅ Creating your "${data.parsed.config.name}" chatbot...`
                }]);
                setIsLoading(false);
                await createChatbot(data.parsed.config);
            }
            // Check if AI returned an UPDATE command
            else if (data.parsed && data.parsed.update === true && data.parsed.changes && createdBot) {
                console.log("Update command detected:", data.parsed.changes);
                setMessages([...newMessages, {
                    role: "assistant",
                    content: "⏳ Updating your chatbot..."
                }]);
                setIsLoading(false);
                await updateChatbot(createdBot.id, data.parsed.changes);
            }
            else {
                // Regular conversation — data.reply is always friendly text (backend strips JSON)
                setMessages([...newMessages, { role: "assistant", content: data.reply }]);
            }
        } catch (error) {
            console.error("AI Chat error:", error);
            setMessages([...newMessages, {
                role: "assistant",
                content: "Network error. Please check your connection and try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Create a new session (replaces old resetChat)
    const newSession = () => {
        // Save current session first
        persistCurrent(activeSessionId, messages, selectedTemplate, createdBot, createdAtIndex);
        const fresh: BuilderSession = { id: genId(), title: "New Chat", messages: [INITIAL_MSG], selectedTemplate: null, createdBot: null, createdAtIndex: null, updatedAt: new Date().toISOString() };
        setSessions(prev => {
            const next = [fresh, ...prev].slice(0, MAX_SESSIONS);
            saveSessions(next);
            return next;
        });
        setActiveSessionId(fresh.id);
        setMessages([INITIAL_MSG]);
        setSelectedTemplate(null);
        setShowRestaurantTemplate(false);
        setCreatedBot(null);
        setCreatedAtIndex(null);
        setInput("");
        saveActiveId(fresh.id);
        setSidebarOpen(false);
    };

    const resetChat = newSession;

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // Relative time helper
    const relTime = (iso: string) => {
        const d = Date.now() - new Date(iso).getTime();
        if (d < 60000) return "Just now";
        if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
        if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
        return `${Math.floor(d / 86400000)}d ago`;
    };

    return (
        <div className="h-full flex bg-gray-50">
            {/* ── Sidebar (Perplexity-style) ── */}
            {/* Desktop: always shown as narrow panel. Mobile: slide-over */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
            <div className={`fixed lg:relative z-40 top-0 left-0 h-full w-[260px] bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}>
                {/* Sidebar header */}
                <div className="p-3 border-b border-gray-100">
                    <button
                        onClick={newSession}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Chat
                    </button>
                </div>
                {/* Session list */}
                <div className="flex-1 overflow-y-auto py-1">
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => switchSession(s.id)}
                            className={`group flex items-center gap-2 px-3 py-2.5 mx-1.5 my-0.5 rounded-lg cursor-pointer transition-colors text-sm ${
                                s.id === activeSessionId
                                    ? "bg-indigo-50 text-indigo-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span className="text-base">{s.createdBot ? "🤖" : "💬"}</span>
                            <div className="flex-1 min-w-0">
                                <div className="truncate text-[13px]">{s.title}</div>
                                <div className="text-[11px] text-gray-400">{relTime(s.updatedAt)}</div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                title="Delete"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
                {/* Session count */}
                <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-center">
                    {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Sidebar toggle */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl">
                                ✨
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AI Chatbot Builder</h1>
                                <p className="text-sm text-gray-500">Describe your chatbot and I'll create it for you</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={newSession}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg"
                        >
                            + New Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Restaurant Template Wizard */}
                    {showRestaurantTemplate && (
                        <RestaurantTemplate
                            onComplete={handleRestaurantComplete}
                            onBack={() => {
                                setShowRestaurantTemplate(false);
                                setSelectedTemplate(null);
                            }}
                        />
                    )}

                    {/* Template Selector - shown only at start */}
                    {!showRestaurantTemplate && messages.length <= 1 && !createdBot && (
                        <TemplateSelector
                            selectedTemplate={selectedTemplate}
                            onSelect={handleTemplateSelect}
                        />
                    )}

                    {/* Messages */}
                    <div className="space-y-4">
                        {/* Messages BEFORE bot creation (or all if no bot) */}
                        {messages.slice(0, createdAtIndex !== null ? createdAtIndex + 1 : messages.length).map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                        ? "bg-indigo-500 text-white"
                                        : "bg-white border border-gray-200 text-gray-700 shadow-sm"
                                        }`}
                                >
                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </div>
                        ))}

                        {/* Success Card - shows ONCE after bot creation message */}
                        {createdBot && createdAtIndex !== null && (
                            <div className={`w-full rounded-2xl p-6 text-white shadow-xl ${selectedTemplate === "instagram"
                                ? "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                                }`}>
                                {/* Header with celebration */}
                                <div className="text-center mb-5">
                                    <div className="text-4xl mb-2">🎉</div>
                                    <h2 className="text-2xl font-bold mb-1">{createdBot.name} is Live!</h2>
                                    <p className="text-white/80 text-sm">
                                        {selectedTemplate === "instagram"
                                            ? "Your Instagram bot is ready! Use the link below as your 'Link in Bio'."
                                            : "Your chatbot has been created and is ready to use."}
                                    </p>
                                </div>

                                {/* Live Link with copy */}
                                <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
                                    <div className="text-xs text-white/70 mb-2 uppercase tracking-wide">
                                        {selectedTemplate === "instagram" ? "📷 Link in Bio URL" : "🔗 Live Chatbot URL"}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-white/10 px-4 py-3 rounded-lg text-sm break-all font-mono">
                                            {origin}/c/{createdBot.slug}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => navigator.clipboard.writeText(`${origin}/c/${createdBot.slug}`)}
                                            className="px-4 py-3 bg-white/30 hover:bg-white/40 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>

                                {/* Instagram-specific recommendations */}
                                {selectedTemplate === "instagram" && (
                                    <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                                        <div className="text-sm font-medium mb-2">💡 Recommended:</div>
                                        <ul className="text-sm text-white/90 space-y-1">
                                            <li>• Use this link as your Instagram bio link</li>
                                            <li>• Connect your account to enable auto DM replies</li>
                                            <li>• Share the link in your stories for more engagement</li>
                                        </ul>
                                    </div>
                                )}

                                {/* Big Action Button */}
                                <a
                                    href={`/c/${createdBot.slug}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mb-3"
                                >
                                    🚀 Open Live Chatbot
                                </a>

                                {/* Secondary buttons */}
                                <div className={`grid gap-3 ${selectedTemplate === "instagram" ? "grid-cols-2" : "grid-cols-1"}`}>
                                    {selectedTemplate === "instagram" && (
                                        <a
                                            href={`/admin/chatbots/${createdBot.id}/instagram`}
                                            className="py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl text-center transition-colors"
                                        >
                                            📷 Connect Instagram
                                        </a>
                                    )}
                                    <a
                                        href={`/admin/chatbots/${createdBot.id}`}
                                        className="py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl text-center transition-colors"
                                    >
                                        ✏️ Manual Edit
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Helper message after success card */}
                        {createdBot && createdAtIndex !== null && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-700 shadow-sm">
                                    <div className="text-sm">
                                        💡 Need to make any changes? Just tell me what you'd like to update!
                                        <br /><span className="text-gray-500 text-xs mt-1 block">
                                            e.g., "Change the greeting to..." or "Make it more professional"
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages AFTER bot creation (updates/changes) */}
                        {createdAtIndex !== null && messages.slice(createdAtIndex + 1).map((msg, i) => (
                            <div
                                key={`post-${i}`}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                        ? "bg-indigo-500 text-white"
                                        : "bg-white border border-gray-200 text-gray-700 shadow-sm"
                                        }`}
                                >
                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                    {/* Small link button for update confirmations */}
                                    {msg.role === "assistant" && msg.content.includes("Changes applied") && createdBot && (
                                        <a
                                            href={`/c/${createdBot.slug}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                                        >
                                            🚀 View Chatbot
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area - always visible, different placeholder after creation */}
            <div className="bg-white border-t border-gray-200 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={createdBot
                                ? "Ask me to make changes... (e.g., 'Change the greeting to...' or 'Make the tone more friendly')"
                                : "Describe your chatbot... (e.g., 'I need a support bot for my shoe store at www.myshoes.com')"
                            }
                            rows={2}
                            disabled={isLoading || isCreating}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <button
                            type="button"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading || isCreating}
                            className={`px-6 rounded-xl font-medium transition-all ${!input.trim() || isLoading || isCreating
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg"
                                }`}
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        {createdBot
                            ? "💡 You can ask me to change the greeting, update the behavior, or modify any settings"
                            : "The more details you provide, the better your chatbot will be"
                        }
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
}
