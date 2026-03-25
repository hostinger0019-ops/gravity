"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUltraVoice } from "@/hooks/useUltraVoice";

interface UltraVoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onMessage?: (userText: string, aiText: string) => void;
    botSlug?: string;
    language?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

export default function UltraVoiceMode({
    isOpen,
    onClose,
    onMessage,
    botSlug = "default",
    language = "hi",
}: UltraVoiceModeProps) {
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [latency, setLatency] = useState<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    const {
        state,
        isRecording,
        lastTimings,
        toggleRecording,
        stopSpeaking,
        clearHistory,
    } = useUltraVoice({
        slug: botSlug,
        language,
        onTranscript: (text) => setTranscript(text),
        onResponse: (text) => {
            setResponse(text);
            if (transcript && text) {
                onMessage?.(transcript, text);
            }
        },
        onError: (error) => console.error("[UltraVoice] Error:", error),
        onTimings: (timings) => {
            if (timings.total) {
                setLatency(timings.total);
            }
        },
    });

    // Draw pulsing visualizer
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            // Different colors for different states
            const colors: Record<VoiceState, string> = {
                idle: "#6366f1",
                listening: "#22c55e",
                processing: "#f59e0b",
                speaking: "#3b82f6",
            };

            const baseRadius = state === "listening" ? 60 : 50;
            const pulse = state === "listening" || state === "speaking"
                ? Math.sin(Date.now() / 150) * 15
                : 0;
            const radius = baseRadius + pulse;

            // Glow effect
            ctx.shadowBlur = 30;
            ctx.shadowColor = colors[state];

            // Main circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = colors[state];
            ctx.fill();

            // Inner circle
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.fill();

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationRef.current);
    }, [isOpen, state]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setTranscript("");
            setResponse("");
            setLatency(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const stateLabels: Record<VoiceState, string> = {
        idle: "Tap to speak",
        listening: "Listening...",
        processing: "Thinking...",
        speaking: "Speaking...",
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
            >
                ✕
            </button>

            {/* Latency badge */}
            {latency && (
                <div className="absolute top-4 left-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-mono">
                    ⚡ {latency}ms
                </div>
            )}

            {/* Title */}
            <h2 className="text-white text-xl font-semibold mb-2">
                Ultra Voice Mode
            </h2>
            <p className="text-white/50 text-sm mb-8">Sub-1-second responses</p>

            {/* Voice visualizer canvas */}
            <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="cursor-pointer mb-6"
                onClick={state === "speaking" ? stopSpeaking : toggleRecording}
            />

            {/* State indicator */}
            <p className="text-white text-lg mb-4">{stateLabels[state]}</p>

            {/* Transcript */}
            {transcript && (
                <div className="max-w-md text-center mb-2">
                    <p className="text-white/60 text-sm">You said:</p>
                    <p className="text-white">{transcript}</p>
                </div>
            )}

            {/* Response */}
            {response && (
                <div className="max-w-md text-center">
                    <p className="text-blue-400/60 text-sm">AI:</p>
                    <p className="text-blue-300">{response}</p>
                </div>
            )}

            {/* Instructions */}
            <p className="absolute bottom-8 text-white/40 text-sm">
                {state === "idle" && "Tap the circle to start speaking"}
                {state === "listening" && "Tap again when done speaking"}
                {state === "speaking" && "Tap to interrupt"}
            </p>

            {/* Clear history button */}
            <button
                onClick={clearHistory}
                className="absolute bottom-4 left-4 text-white/40 hover:text-white/60 text-xs"
            >
                Clear history
            </button>

            {/* Timings debug (dev only) */}
            {process.env.NODE_ENV === "development" && lastTimings.total && (
                <div className="absolute bottom-4 right-4 text-white/30 text-xs font-mono">
                    ASR: {lastTimings.asr}ms | LLM: {lastTimings.llmFirstSentence || lastTimings.llmTotal}ms | TTS: {lastTimings.tts}ms
                </div>
            )}
        </div>
    );
}
