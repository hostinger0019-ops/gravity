"use client";

import { useRef, useState, useCallback } from "react";

/**
 * useUltraVoice Hook - Sub-1-Second Voice Chat
 * 
 * Optimized for minimum latency:
 * - Uses /api/voice-ultra endpoint (skips RAG)
 * - Efficient audio recording
 * - Fast audio playback
 */

interface UseUltraVoiceOptions {
    slug?: string;
    language?: string;
    onTranscript?: (text: string) => void;
    onResponse?: (text: string) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: VoiceState) => void;
    onTimings?: (timings: VoiceTimings) => void;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceTimings {
    asr?: number;
    llmFirstSentence?: number;
    llmTotal?: number;
    tts?: number;
    total?: number;
}

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}

export function useUltraVoice(options: UseUltraVoiceOptions = {}) {
    const {
        slug = "default",
        language = "hi",
        onTranscript,
        onResponse,
        onError,
        onStateChange,
        onTimings,
    } = options;

    const [state, setState] = useState<VoiceState>("idle");
    const [isRecording, setIsRecording] = useState(false);
    const [lastTimings, setLastTimings] = useState<VoiceTimings>({});

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const historyRef = useRef<ConversationMessage[]>([]);

    const updateState = useCallback((newState: VoiceState) => {
        setState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    const getAudioElement = useCallback(() => {
        if (!audioElementRef.current) {
            audioElementRef.current = new Audio();
            audioElementRef.current.volume = 1.0;
        }
        return audioElementRef.current;
    }, []);

    // Process audio through ultra-fast pipeline
    const processAudio = useCallback(async (audioBlob: Blob) => {
        const clientStart = Date.now();
        updateState("processing");
        console.log("[UltraVoice] Processing:", audioBlob.size, "bytes");

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");
            formData.append("slug", slug);
            formData.append("language", language);
            formData.append("history", JSON.stringify(historyRef.current.slice(-2)));

            const response = await fetch("/api/voice-ultra", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Voice processing failed");
            }

            // Parse timings from header
            const timingsHeader = response.headers.get("X-Timings");
            const timings: VoiceTimings = timingsHeader ? JSON.parse(timingsHeader) : {};
            timings.total = Date.now() - clientStart;
            setLastTimings(timings);
            onTimings?.(timings);

            // Get text from headers
            const transcribedText = decodeURIComponent(response.headers.get("X-Transcribed-Text") || "");
            const responseText = decodeURIComponent(response.headers.get("X-Response-Text") || "");

            console.log(`[UltraVoice] ✅ Total: ${timings.total}ms | "${transcribedText}" → "${responseText}"`);

            // Update history and notify
            if (transcribedText) {
                onTranscript?.(transcribedText);
                historyRef.current.push({ role: "user", content: transcribedText });
            }
            if (responseText) {
                onResponse?.(responseText);
                historyRef.current.push({ role: "assistant", content: responseText });
            }

            // Keep history short
            if (historyRef.current.length > 6) {
                historyRef.current = historyRef.current.slice(-4);
            }

            // Play audio response
            const audioBlob2 = await response.blob();
            if (audioBlob2.size > 100) {
                updateState("speaking");
                const audio = getAudioElement();
                const audioUrl = URL.createObjectURL(audioBlob2);
                audio.src = audioUrl;

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    updateState("idle");
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    updateState("idle");
                };

                await audio.play();
            } else {
                updateState("idle");
            }

        } catch (error: any) {
            console.error("[UltraVoice] Error:", error);
            onError?.(error?.message || "Voice processing failed");
            updateState("idle");
        }
    }, [slug, language, onTranscript, onResponse, onError, onTimings, getAudioElement, updateState]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            streamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm",
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                console.log("[UltraVoice] Recording stopped:", audioBlob.size, "bytes");

                streamRef.current?.getTracks().forEach(track => track.stop());
                streamRef.current = null;

                if (audioBlob.size > 1000) {
                    await processAudio(audioBlob);
                } else {
                    console.log("[UltraVoice] Audio too short");
                    updateState("idle");
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(50); // Smaller chunks for faster processing

            setIsRecording(true);
            updateState("listening");
            console.log("[UltraVoice] Recording started");

        } catch (error: any) {
            console.error("[UltraVoice] Mic error:", error);
            onError?.("Microphone access denied");
            updateState("idle");
        }
    }, [processAudio, onError, updateState]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            setIsRecording(false);
        }
    }, []);

    // Toggle recording
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    // Stop speaking
    const stopSpeaking = useCallback(() => {
        const audio = audioElementRef.current;
        if (audio) {
            audio.pause();
            if (audio.src) {
                URL.revokeObjectURL(audio.src);
                audio.src = "";
            }
        }
        updateState("idle");
    }, [updateState]);

    // Clear history
    const clearHistory = useCallback(() => {
        historyRef.current = [];
    }, []);

    return {
        state,
        isRecording,
        lastTimings,
        startRecording,
        stopRecording,
        toggleRecording,
        stopSpeaking,
        clearHistory,
    };
}
