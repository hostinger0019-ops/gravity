"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RenderedMessage } from "@/components/public/RenderedMessage";
import OrderModal from "./OrderModal";
import ReservationModal from "./ReservationModal";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface RestaurantChatUIProps {
    slug: string;
    name: string;
    avatarUrl: string | null;
    brandColor: string;
    greeting: string;
    starterQuestions: string[];
    botId: string;
    tagline?: string;
}

export default function RestaurantChatUI({
    slug,
    name,
    brandColor,
    greeting,
    starterQuestions,
    botId,
    tagline,
}: RestaurantChatUIProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: greeting },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);

    // Handle successful order/reservation
    const handleModalSuccess = (message: string) => {
        setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(`/api/bots/${encodeURIComponent(slug)}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error("Failed to get response");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                if (chunk) {
                    assistantContent += chunk;
                    setMessages((prev) => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = {
                            role: "assistant",
                            content: assistantContent,
                        };
                        return newMsgs;
                    });
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, something went wrong. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 to-orange-50">
            {/* Restaurant Header */}
            <header className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-inner">
                        🍽️
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{name}</h1>
                        <p className="text-orange-100 text-sm">{tagline || "Your restaurant assistant"}</p>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={`/admin/chatbots/${botId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium backdrop-blur transition-colors flex items-center gap-1"
                        >
                            ⚙️ Admin
                        </a>
                    </div>
                </div>
            </header>

            {/* Quick Actions Bar */}
            <div className="bg-white border-b border-orange-100 py-3 px-4 overflow-x-auto">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowReservationModal(true)}
                        className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
                    >
                        📅 Make Reservation
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowOrderModal(true)}
                        className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
                    >
                        🛒 Order Food
                    </button>
                    {["View Menu", "Hours & Location"].map((action) => (
                        <button
                            key={action}
                            type="button"
                            onClick={() => sendMessage(action)}
                            className="flex-shrink-0 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-full text-sm font-medium transition-colors"
                        >
                            {action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-lg mr-3 flex-shrink-0 shadow-md">
                                    🍽️
                                </div>
                            )}
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === "user"
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-md"
                                    : "bg-white text-gray-800 border border-orange-100 rounded-bl-md"
                                    }`}
                            >
                                <div className="text-sm">
                                    <RenderedMessage content={msg.content} light={true} slug={slug} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex justify-start">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-lg mr-3 flex-shrink-0">
                                🍽️
                            </div>
                            <div className="bg-white border border-orange-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Starter Questions */}
            {messages.length === 1 && starterQuestions.length > 0 && (
                <div className="bg-white/80 backdrop-blur border-t border-orange-100 p-4">
                    <div className="max-w-3xl mx-auto">
                        <p className="text-xs text-gray-500 mb-2 text-center">Quick questions</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {starterQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => sendMessage(q)}
                                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all hover:scale-105"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t border-orange-200 p-4 shadow-lg">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="flex gap-3 items-center bg-orange-50 rounded-2xl p-2 border border-orange-200">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about reservations, menu, hours..."
                            disabled={isLoading}
                            className="flex-1 bg-transparent px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={`px-6 py-2 rounded-xl font-semibold transition-all ${input.trim() && !isLoading
                                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Powered by AI • {name}
                    </p>
                </form>
            </div>

            {/* Modals */}
            <OrderModal
                isOpen={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                slug={slug}
                onSuccess={handleModalSuccess}
            />
            <ReservationModal
                isOpen={showReservationModal}
                onClose={() => setShowReservationModal(false)}
                slug={slug}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
