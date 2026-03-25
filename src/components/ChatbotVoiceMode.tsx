"use client";

import { useEffect, useCallback } from "react";
import { useChatbotVoice } from "@/hooks/useChatbotVoice";

interface ChatbotVoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onMessage?: (userText: string, aiText: string) => void;
    chatbotId?: string;
    systemPrompt?: string;
}

/**
 * ChatbotVoiceMode — Full-screen overlay for hands-free voice chat
 * Continuous PCM streaming with GPU-side VAD, word-by-word typing, barge-in.
 */
export default function ChatbotVoiceMode({
    isOpen,
    onClose,
    onMessage,
    chatbotId,
    systemPrompt,
}: ChatbotVoiceModeProps) {
    const { state, isTyping, lastTranscription, lastResponse, start, stop } = useChatbotVoice({
        chatbotId,
        systemPrompt,
        onMessage,
    });

    useEffect(() => {
        if (isOpen) {
            start();
        } else {
            stop();
        }
    }, [isOpen, start, stop]);

    // ESC key to close
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const stateConfig: Record<string, { label: string; color: string; icon: string; pulse: boolean }> = {
        idle: { label: "Starting...", color: "#6B7280", icon: "🎤", pulse: false },
        connecting: { label: "Connecting...", color: "#F59E0B", icon: "⏳", pulse: true },
        listening: { label: "I'm listening — speak now", color: "#10B981", icon: "🎤", pulse: true },
        processing: { label: "Thinking...", color: "#8B5CF6", icon: "⏳", pulse: true },
        speaking: { label: "Speaking...", color: "#3B82F6", icon: "🔊", pulse: true },
    };

    const config = stateConfig[state] || stateConfig.idle;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(180deg, rgba(8,14,26,0.97) 0%, rgba(15,23,42,0.98) 100%)" }}>
            
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full transition-all hover:scale-110"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#E8E0D8" }}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Main visualizer */}
            <div className="flex flex-col items-center gap-8">
                {/* Pulsing orb — tap to interrupt when speaking */}
                <div 
                    className="relative cursor-pointer"
                    onClick={() => {
                        if (state === "speaking") {
                            // Barge-in: stop audio
                            stop();
                            setTimeout(start, 300);
                        }
                    }}
                    title={state === "speaking" ? "Tap to interrupt" : ""}
                >
                    <div
                        className={`w-32 h-32 rounded-full transition-all duration-500 ${config.pulse ? "animate-pulse" : ""}`}
                        style={{
                            background: `radial-gradient(circle, ${config.color}40, ${config.color}10)`,
                            boxShadow: `0 0 60px ${config.color}30, 0 0 120px ${config.color}15`,
                        }}
                    />
                    <div
                        className="absolute inset-4 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${config.color}60, ${config.color}20)`,
                            boxShadow: `0 0 30px ${config.color}40`,
                        }}
                    />
                    {/* Icon center */}
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        {config.icon}
                    </div>
                </div>

                {/* State label */}
                <div className="text-center">
                    <p className="text-lg font-medium" style={{ color: config.color }}>
                        {config.label}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#7A8BA8" }}>
                        {state === "listening" ? "Just speak — I'll detect automatically" : 
                         state === "speaking" ? "Speak to interrupt" : ""}
                    </p>
                </div>

                {/* Transcription display */}
                {lastTranscription && (
                    <div className="max-w-md text-center px-6 py-3 rounded-2xl" 
                        style={{ backgroundColor: "rgba(30, 41, 65, 0.6)", border: "1px solid rgba(212, 165, 116, 0.15)" }}>
                        <p className="text-xs mb-1" style={{ color: "#7A8BA8" }}>You said:</p>
                        <p className="text-sm" style={{ color: "#E8E0D8" }}>{lastTranscription}</p>
                    </div>
                )}

                {/* Response display — word-by-word typing */}
                {lastResponse && (
                    <div className="max-w-md text-center px-6 py-3 rounded-2xl"
                        style={{ backgroundColor: "rgba(30, 41, 65, 0.6)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
                        <p className="text-xs mb-1" style={{ color: "#7A8BA8" }}>Assistant:</p>
                        <p className="text-sm" style={{ color: "#E8E0D8" }}>
                            {lastResponse}
                            {isTyping && <span className="animate-pulse">▋</span>}
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom hint */}
            <p className="absolute bottom-8 text-xs" style={{ color: "#4A5568" }}>
                Press ESC or click ✕ to exit voice mode
            </p>
        </div>
    );
}
