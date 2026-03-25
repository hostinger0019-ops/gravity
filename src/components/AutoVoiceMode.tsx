"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAutoVoice } from "@/hooks/useAutoVoice";

interface AutoVoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onMessage?: (userText: string, aiText: string) => void;
    botSlug?: string;
    language?: string;
}

type VoiceState = "idle" | "listening" | "speaking_detected" | "processing" | "responding";

/**
 * AutoVoiceMode - Nearly Hands-Free Voice Chat
 * 
 * Browser security requires ONE initial tap to grant microphone access.
 * After that, it's fully automatic:
 * - User speaks → Auto-detects and records
 * - User pauses → Auto-processes  
 * - AI responds → Auto-resumes listening
 */
export default function AutoVoiceMode({
    isOpen,
    onClose,
    onMessage,
    botSlug = "default",
    language = "hi",
}: AutoVoiceModeProps) {
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [latency, setLatency] = useState<number | null>(null);
    const [needsTap, setNeedsTap] = useState(true); // Browser needs one tap for mic access
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    const {
        state,
        isActive,
        volume,
        lastTimings,
        startListening,
        stopListening,
        stopSpeaking,
    } = useAutoVoice({
        slug: botSlug,
        language,
        silenceThreshold: -60, // Very sensitive - will detect most environments as "speaking"
        silenceDuration: 800, // 0.8s silence = stop (faster)
        onTranscript: (text) => {
            setTranscript(text);
        },
        onResponse: (text) => {
            setResponse(text);
            if (transcript && text) {
                onMessage?.(transcript, text);
            }
        },
        onError: (error) => {
            // Don't show error overlay for expected offline scenarios
            if (error.includes("Voice server offline") || error.includes("fetch failed")) {
                console.warn("[AutoVoice] Server not available:", error);
            } else {
                console.error("[AutoVoice] Error:", error);
            }
            // If mic access denied, show tap again
            if (error.includes("denied") || error.includes("permission")) {
                setNeedsTap(true);
            }
        },
        onTimings: (timings) => {
            if (timings.total) {
                setLatency(timings.total);
            }
        },
    });

    // Start microphone - called on first tap
    const handleStart = useCallback(() => {
        console.log("[AutoVoiceMode] User tapped - starting microphone...");
        setNeedsTap(false);
        startListening();
    }, [startListening]);

    // Stop on close
    useEffect(() => {
        if (!isOpen) {
            setNeedsTap(true);
            setTranscript("");
            setResponse("");
            setLatency(null);
            if (isActive) {
                stopListening();
            }
        }
    }, [isOpen, isActive, stopListening]);

    // Draw waveform visualizer
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;
            const centerX = width / 2;

            ctx.clearRect(0, 0, width, height);

            // Colors based on state
            const colors: Record<VoiceState | "needsTap", { bg: string; ring: string; pulse: string }> = {
                needsTap: { bg: "#6366f1", ring: "#818cf8", pulse: "#a5b4fc" }, // Indigo for "tap to start"
                idle: { bg: "#1e40af", ring: "#3b82f6", pulse: "#60a5fa" },
                listening: { bg: "#1e40af", ring: "#3b82f6", pulse: "#60a5fa" },
                speaking_detected: { bg: "#15803d", ring: "#22c55e", pulse: "#4ade80" },
                processing: { bg: "#b45309", ring: "#f59e0b", pulse: "#fbbf24" },
                responding: { bg: "#7c3aed", ring: "#8b5cf6", pulse: "#a78bfa" },
            };

            const currentState = needsTap ? "needsTap" : state;
            const color = colors[currentState];
            const baseRadius = 80;

            // Pulsing effect
            let pulseAmount = 0;
            if (needsTap) {
                pulseAmount = Math.sin(Date.now() / 400) * 10;
            } else if (state === "listening" || state === "idle") {
                pulseAmount = Math.sin(Date.now() / 300) * 8;
            } else if (state === "speaking_detected") {
                pulseAmount = volume * 40;
            } else if (state === "processing") {
                pulseAmount = Math.sin(Date.now() / 150) * 12;
            } else if (state === "responding") {
                pulseAmount = Math.sin(Date.now() / 200) * 10;
            }

            const radius = baseRadius + pulseAmount;

            // Outer glow
            ctx.shadowBlur = 50;
            ctx.shadowColor = color.pulse;

            // Outer ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
            ctx.strokeStyle = color.ring;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Main circle
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = color.bg;
            ctx.fill();

            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = color.ring;
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Volume bars (when speaking detected)
            if (state === "speaking_detected" && volume > 0 && !needsTap) {
                const barCount = 7;
                const barWidth = 8;
                const maxBarHeight = 50;
                const barSpacing = 14;
                const startX = centerX - ((barCount - 1) * barSpacing) / 2;

                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.random() * maxBarHeight * volume + 8;
                    const x = startX + i * barSpacing;
                    const y = centerY - barHeight / 2;

                    ctx.fillStyle = "#fff";
                    ctx.globalAlpha = 0.9;
                    ctx.beginPath();
                    ctx.roundRect(x - barWidth / 2, y, barWidth, barHeight, 4);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // Icon/emoji based on state
            ctx.fillStyle = "#fff";
            ctx.font = "32px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (needsTap) {
                ctx.fillText("🎤", centerX, centerY);
            } else if (state === "processing") {
                ctx.fillText("⏳", centerX, centerY);
            } else if (state === "responding") {
                ctx.fillText("🔊", centerX, centerY);
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationRef.current);
    }, [isOpen, state, volume, needsTap]);

    const handleClose = () => {
        stopListening();
        onClose();
    };

    if (!isOpen) return null;

    // State message
    const getMessage = () => {
        if (needsTap) return "Tap to start talking";
        switch (state) {
            case "idle":
            case "listening":
                return "I'm listening...";
            case "speaking_detected":
                return "I hear you...";
            case "processing":
                return "Thinking...";
            case "responding":
                return "Speaking...";
            default:
                return "I'm listening...";
        }
    };

    const getColor = () => {
        if (needsTap) return "text-indigo-400";
        switch (state) {
            case "idle":
            case "listening":
                return "text-blue-400";
            case "speaking_detected":
                return "text-green-400";
            case "processing":
                return "text-yellow-400";
            case "responding":
                return "text-purple-400";
            default:
                return "text-blue-400";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
            {/* Close button */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl transition-colors z-10"
            >
                ✕
            </button>

            {/* Latency badge */}
            {latency && (
                <div className="absolute top-4 left-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-mono flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {latency}ms
                </div>
            )}

            {/* Voice visualizer - tap to start */}
            <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="cursor-pointer mb-6"
                onClick={() => {
                    if (needsTap) {
                        handleStart();
                    } else if (state === "responding") {
                        stopSpeaking();
                    }
                }}
            />

            {/* State indicator */}
            <p className={`text-2xl font-medium mb-8 ${getColor()}`}>
                {getMessage()}
            </p>

            {/* Transcript */}
            {transcript && (
                <div className="max-w-md text-center mb-4 px-4">
                    <p className="text-white/40 text-xs mb-1">You:</p>
                    <p className="text-white text-xl">{transcript}</p>
                </div>
            )}

            {/* Response */}
            {response && (
                <div className="max-w-md text-center px-4">
                    <p className="text-purple-400/50 text-xs mb-1">AI:</p>
                    <p className="text-purple-300 text-xl">{response}</p>
                </div>
            )}

            {/* Language indicator */}
            <div className="absolute bottom-6 text-white/20 text-sm">
                {language === "hi" ? "हिंदी" : "English"}
                {!needsTap && " • Tap circle to interrupt"}
            </div>

            {/* Debug timings */}
            {lastTimings.total && (
                <div className="absolute bottom-6 right-6 text-white/15 text-xs font-mono">
                    ASR: {lastTimings.asr}ms | LLM: {lastTimings.llmFirstSentence || lastTimings.llmTotal}ms | TTS: {lastTimings.tts}ms
                </div>
            )}
        </div>
    );
}
