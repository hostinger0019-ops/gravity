"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onMessage?: (userText: string, aiText: string) => void;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    botSlug?: string; // Bot slug for using correct business logic
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

export default function VoiceMode({ isOpen, onClose, onMessage, conversationHistory = [], botSlug }: VoiceModeProps) {
    const [state, setState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Initialize audio context for visualization
    useEffect(() => {
        if (typeof window !== "undefined") {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            audioContextRef.current?.close();
        };
    }, []);

    // Draw audio visualization
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

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const baseRadius = 80;

            // Draw pulsing circles
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const scale = 1 + (average / 255) * 0.3;

            // Outer glow
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * scale * 1.5);
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
            gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.2)");
            gradient.addColorStop(1, "rgba(168, 85, 247, 0)");

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * scale * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Main circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * scale, 0, Math.PI * 2);
            const mainGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            mainGradient.addColorStop(0, "#6366f1");
            mainGradient.addColorStop(1, "#a855f7");
            ctx.strokeStyle = mainGradient;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Inner pulse
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * scale * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
            ctx.fill();

            // Draw frequency bars in a circle
            const bars = 32;
            for (let i = 0; i < bars; i++) {
                const angle = (i / bars) * Math.PI * 2;
                const barHeight = (dataArray[i * 4] / 255) * 40;
                const x1 = centerX + Math.cos(angle) * (baseRadius * scale + 10);
                const y1 = centerY + Math.sin(angle) * (baseRadius * scale + 10);
                const x2 = centerX + Math.cos(angle) * (baseRadius * scale + 10 + barHeight);
                const y2 = centerY + Math.sin(angle) * (baseRadius * scale + 10 + barHeight);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + barHeight / 80})`;
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.stroke();
            }
        };

        draw();
    }, []);

    // Start visualization when speaking
    useEffect(() => {
        if (state === "speaking" || state === "listening") {
            drawVisualization();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
    }, [state, drawVisualization]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition not supported in this browser");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setTranscript(interimTranscript || finalTranscript);

            if (finalTranscript) {
                handleSendMessage(finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            if (event.error !== "no-speech") {
                setError(`Recognition error: ${event.error}`);
            }
            setState("idle");
        };

        recognition.onend = () => {
            if (state === "listening") {
                setState("idle");
            }
        };

        recognitionRef.current = recognition;
    }, []);

    // Send message to voice stream API with streaming audio support
    const handleSendMessage = async (text: string) => {
        setState("processing");
        setTranscript(text);

        try {
            // Call voice-stream which uses Chat API (with RAG, business logic) then TTS
            const response = await fetch("/api/voice-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    slug: botSlug, // Pass bot slug for correct business logic
                    history: conversationHistory.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Voice API error:", errorData);
                setError("GPU server unavailable. Please check SSH tunnel is running.");
                setState("idle");
                return;
            }

            const contentType = response.headers.get("Content-Type");
            const aiText = decodeURIComponent(response.headers.get("X-Text-Response") || "");

            // Handle streaming audio (application/octet-stream) or regular audio
            if (contentType?.includes("octet-stream") && response.body) {
                // Streaming mode - play chunks as they arrive
                setState("speaking");
                console.log("[VoiceMode] Starting streaming audio playback");

                const reader = response.body.getReader();
                const audioQueue: Blob[] = [];
                let isPlaying = false;
                let audioElement: HTMLAudioElement | null = null;

                const playNextChunk = async () => {
                    if (audioQueue.length === 0 || isPlaying) return;

                    isPlaying = true;
                    const chunk = audioQueue.shift()!;
                    const url = URL.createObjectURL(chunk);

                    if (!audioElement) {
                        audioElement = new Audio();
                    }

                    audioElement.src = url;
                    audioElement.onended = () => {
                        URL.revokeObjectURL(url);
                        isPlaying = false;
                        if (audioQueue.length > 0) {
                            playNextChunk();
                        } else {
                            setState("idle");
                            setTranscript("");
                        }
                    };

                    try {
                        await audioElement.play();
                    } catch (e) {
                        console.error("[VoiceMode] Play chunk error:", e);
                        isPlaying = false;
                    }
                };

                // Read streaming chunks
                let buffer = new Uint8Array(0);
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    // Append to buffer
                    const newBuffer = new Uint8Array(buffer.length + value.length);
                    newBuffer.set(buffer);
                    newBuffer.set(value, buffer.length);
                    buffer = newBuffer;

                    // Parse chunks: 4-byte size prefix + audio data
                    while (buffer.length >= 4) {
                        const chunkSize = new DataView(buffer.buffer).getUint32(0);
                        if (buffer.length >= 4 + chunkSize) {
                            const audioData = buffer.slice(4, 4 + chunkSize);
                            buffer = buffer.slice(4 + chunkSize);

                            const blob = new Blob([audioData], { type: "audio/wav" });
                            console.log("[VoiceMode] Received audio chunk:", blob.size, "bytes");
                            audioQueue.push(blob);
                            playNextChunk(); // Start playing immediately
                        } else {
                            break;
                        }
                    }
                }

                // Notify parent
                if (onMessage && aiText) {
                    onMessage(text, aiText);
                }

            } else if (contentType?.includes("audio")) {
                // Non-streaming audio (fallback)
                setState("speaking");
                const audioBlob = await response.blob();
                console.log("[VoiceMode] Audio blob size:", audioBlob.size);
                const audioUrl = URL.createObjectURL(audioBlob);

                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.onended = () => {
                        console.log("[VoiceMode] Audio playback ended");
                        setState("idle");
                        setTranscript("");
                        URL.revokeObjectURL(audioUrl);
                    };
                    audioRef.current.onerror = (e) => {
                        console.error("[VoiceMode] Audio playback error:", e);
                        setState("idle");
                        setError("Audio playback failed");
                    };
                    try {
                        await audioRef.current.play();
                        console.log("[VoiceMode] Audio playing");
                    } catch (playErr) {
                        console.error("[VoiceMode] Play failed:", playErr);
                        setError("Could not play audio. Try again.");
                        setState("idle");
                    }
                }

                if (onMessage && aiText) {
                    onMessage(text, aiText);
                }
            } else {
                // JSON response (fallback)
                const data = await response.json();
                if (data.text) {
                    onMessage?.(text, data.text);
                }
                setState("idle");
            }
        } catch (err) {
            console.error("Voice stream error:", err);
            setError("Failed to get response. Please try again.");
            setState("idle");
        }
    };

    // Toggle listening
    const toggleListening = () => {
        if (state === "listening") {
            recognitionRef.current?.stop();
            setState("idle");
        } else if (state === "idle") {
            setError(null);
            setTranscript("");
            recognitionRef.current?.start();
            setState("listening");

            // Resume audio context if suspended
            if (audioContextRef.current?.state === "suspended") {
                audioContextRef.current.resume();
            }
        }
    };

    // Stop speaking
    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setState("idle");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-8">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Status text */}
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-light text-white mb-2">
                        {state === "idle" && "Tap to speak"}
                        {state === "listening" && "Listening..."}
                        {state === "processing" && "Thinking..."}
                        {state === "speaking" && "Speaking..."}
                    </h2>
                    {transcript && (
                        <p className="text-white/60 text-sm max-w-xs">
                            "{transcript}"
                        </p>
                    )}
                    {error && (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                </div>

                {/* Visualization canvas */}
                <div className="relative w-64 h-64 mb-8">
                    <canvas
                        ref={canvasRef}
                        width={256}
                        height={256}
                        className="w-full h-full"
                    />

                    {/* Static rings when idle */}
                    {state === "idle" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-40 h-40 rounded-full border-2 border-indigo-500/30 animate-pulse" />
                            <div className="absolute w-32 h-32 rounded-full border-2 border-purple-500/20" />
                        </div>
                    )}
                </div>

                {/* Microphone button */}
                <button
                    onClick={state === "speaking" ? stopSpeaking : toggleListening}
                    disabled={state === "processing"}
                    className={`
            w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300 transform
            ${state === "listening"
                            ? "bg-gradient-to-br from-red-500 to-pink-500 scale-110 shadow-lg shadow-red-500/50"
                            : state === "speaking"
                                ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50"
                                : state === "processing"
                                    ? "bg-gradient-to-br from-yellow-500 to-orange-500 animate-pulse"
                                    : "bg-gradient-to-br from-indigo-500 to-purple-500 hover:scale-105 shadow-lg shadow-indigo-500/50"
                        }
            ${state === "processing" ? "cursor-wait" : "cursor-pointer"}
          `}
                >
                    {state === "speaking" ? (
                        // Stop icon
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    ) : state === "processing" ? (
                        // Loading spinner
                        <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        // Microphone icon
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    )}
                </button>

                {/* Hint text */}
                <p className="mt-6 text-white/40 text-sm">
                    {state === "speaking" ? "Tap to stop" : "Press and release to ask a question"}
                </p>
            </div>

            {/* Hidden audio element */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
