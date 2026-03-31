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

export function AIChat() {
    const router = useRouter();
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! 🤖 I'll help you create the perfect chatbot. Tell me about your business and what you want the chatbot to do.\n\n💡 **Tip:** Include your website URL and I'll automatically import your content!",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showRestaurantTemplate, setShowRestaurantTemplate] = useState(false);
    const [createdBot, setCreatedBot] = useState<CreatedChatbot | null>(null);
    const [createdAtIndex, setCreatedAtIndex] = useState<number | null>(null); // Track when bot was created
    const [isCreating, setIsCreating] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const STORAGE_KEY = "ai-chat-session";

    // Load chat history from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const session = JSON.parse(saved);
                if (session.messages && session.messages.length > 1) {
                    setMessages(session.messages);
                }
                if (session.selectedTemplate) {
                    setSelectedTemplate(session.selectedTemplate);
                }
                if (session.createdBot) {
                    setCreatedBot(session.createdBot);
                }
                if (session.createdAtIndex !== undefined) {
                    setCreatedAtIndex(session.createdAtIndex);
                }
            }
        } catch (e) {
            console.error("Failed to load chat history:", e);
        }
        setHasLoadedHistory(true);
    }, []);

    // Save chat history to localStorage whenever state changes
    useEffect(() => {
        if (!hasLoadedHistory || typeof window === "undefined") return;
        try {
            const session = {
                messages,
                selectedTemplate,
                createdBot,
                createdAtIndex,
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
            console.error("Failed to save chat history:", e);
        }
    }, [messages, selectedTemplate, createdBot, createdAtIndex, hasLoadedHistory]);

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
        // Check login before creating
        const gpuId = (session?.user as any)?.gpu_id;
        if (!devNoAuth && !gpuId) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "🔒 **You need to log in first** to create a chatbot. Your bot needs to be linked to your account.\n\n[👉 Click here to log in](/login?next=/admin/ai)"
            }]);
            return;
        }
        setIsCreating(true);
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "⏳ Creating your chatbot..."
        }]);

        try {
            // Use the session gpu_id instead of localStorage
            const userId = devNoAuth
                ? "00000000-0000-0000-0000-000000000000"
                : gpuId;
            console.log("Creating chatbot with userId:", userId);

            const response = await fetch("/api/ai-generator/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config, userId }),
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

    const resetChat = () => {
        setMessages([{
            role: "assistant",
            content: "Hi! 🤖 I'll help you create the perfect chatbot. Tell me about your business and what you want the chatbot to do.\n\n💡 **Tip:** Include your website URL and I'll automatically import your content!",
        }]);
        setSelectedTemplate(null);
        setShowRestaurantTemplate(false);
        setCreatedBot(null);
        setCreatedAtIndex(null);
        setInput("");
        // Clear localStorage when starting over
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
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
                            onClick={resetChat}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg"
                        >
                            Start Over
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
    );
}
