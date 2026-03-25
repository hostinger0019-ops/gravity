"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";

interface RealtimeVoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onMessage?: (userText: string, aiText: string) => void;
    botSlug?: string;
    language?: string;
}

/**
 * RealtimeVoiceMode Component
 * 
 * Uses Whisper ASR (GPU) for transcription instead of Web Speech API.
 * Provides faster response times by using the streaming pipeline:
 * Audio → Whisper (GPU) → vLLM → Kokoro TTS → Audio
 */
export default function RealtimeVoiceMode({
    isOpen,
    onClose,
    onMessage,
    botSlug = "default",
    language = "hi",
}: RealtimeVoiceModeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastUserTextRef = useRef<string>("");
    const lastAiTextRef = useRef<string>("");

    const {
        state,
        isRecording,
        startRecording,
        stopRecording,
        toggleRecording,
        stopSpeaking,
        clearHistory,
    } = useRealtimeVoice({
        slug: botSlug,
        language,
        onTranscript: (text) => {
            lastUserTextRef.current = text;
        },
        onResponse: (text) => {
            lastAiTextRef.current = text;
            if (lastUserTextRef.current && text) {
                onMessage?.(lastUserTextRef.current, text);
            }
        },
        onError: (error) => {
            console.error("[RealtimeVoice] Error:", error);
        },
    });

    // Initialize audio visualization
    useEffect(() => {
        if (!isOpen) return;

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            audioContextRef.current?.close();
        };
    }, [isOpen]);

    // Draw visualization
    const drawVisualization = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) * 0.6;

            // Draw circular visualization
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i++) {
                const angle = (i / bufferLength) * Math.PI * 2;
                const amplitude = dataArray[i] / 255;
                const r = radius + amplitude * 50;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            // Color based on state
            const colors: Record<string, string> = {
                idle: "#6366f1",
                listening: "#22c55e",
                processing: "#eab308",
                speaking: "#3b82f6",
            };
            ctx.strokeStyle = colors[state] || "#6366f1";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw center circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = colors[state] || "#6366f1";
            ctx.fill();
        };

        draw();
    }, [state]);

    // Start visualization when open
    useEffect(() => {
        if (isOpen) {
            drawVisualization();
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isOpen, drawVisualization]);

    // Handle close
    const handleClose = useCallback(() => {
        stopRecording();
        stopSpeaking();
        onClose();
    }, [stopRecording, stopSpeaking, onClose]);

    // Handle main button click
    const handleMainButton = useCallback(() => {
        if (state === "speaking") {
            stopSpeaking();
        } else if (state === "listening" || isRecording) {
            stopRecording();
        } else if (state === "idle") {
            startRecording();
        }
    }, [state, isRecording, startRecording, stopRecording, stopSpeaking]);

    if (!isOpen) return null;

    const stateLabels: Record<string, string> = {
        idle: "Tap to speak",
        listening: "Listening...",
        processing: "Processing...",
        speaking: "Speaking...",
    };

    const stateColors: Record<string, string> = {
        idle: "bg-indigo-500 hover:bg-indigo-600",
        listening: "bg-green-500 hover:bg-green-600 animate-pulse",
        processing: "bg-yellow-500",
        speaking: "bg-blue-500 hover:bg-blue-600",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md p-6 text-center">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
                >
                    ✕
                </button>

                {/* Visualization canvas */}
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    className="mx-auto mb-4 rounded-full"
                />

                {/* State label */}
                <p className="text-white text-lg mb-4">{stateLabels[state]}</p>

                {/* Main action button */}
                <button
                    onClick={handleMainButton}
                    disabled={state === "processing"}
                    className={`w-20 h-20 rounded-full ${stateColors[state]} text-white text-3xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {state === "listening" ? "⬛" : state === "speaking" ? "⏹" : "🎤"}
                </button>

                {/* Language indicator */}
                <p className="text-white/50 text-sm mt-4">
                    Language: {language === "hi" ? "Hindi" : language}
                </p>

                {/* Tech badge */}
                <div className="mt-2 flex justify-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                        Whisper ASR (GPU)
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">
                        Kokoro TTS
                    </span>
                </div>
            </div>
        </div>
    );
}
