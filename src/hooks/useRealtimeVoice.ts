"use client";

import { useRef, useState, useCallback } from "react";

/**
 * useRealtimeVoice Hook
 * 
 * Real-time voice chat using:
 * 1. MediaRecorder to capture audio chunks
 * 2. Whisper ASR (GPU) for transcription
 * 3. vLLM for response generation
 * 4. Kokoro TTS for audio response
 * 
 * Flow:
 * User speaks → Audio chunks → Whisper → LLM → TTS → Audio playback
 */

interface UseRealtimeVoiceOptions {
    slug?: string;
    language?: string;
    onTranscript?: (text: string) => void;
    onResponse?: (text: string) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: "idle" | "listening" | "processing" | "speaking") => void;
}

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
    const {
        slug = "default",
        language = "hi",
        onTranscript,
        onResponse,
        onError,
        onStateChange,
    } = options;

    const [state, setState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const historyRef = useRef<ConversationMessage[]>([]);

    // Update state and notify
    const updateState = useCallback((newState: "idle" | "listening" | "processing" | "speaking") => {
        setState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    // Get or create audio element
    const getAudioElement = useCallback(() => {
        if (!audioElementRef.current) {
            audioElementRef.current = new Audio();
            audioElementRef.current.volume = 1.0;
        }
        return audioElementRef.current;
    }, []);

    // Process recorded audio through the pipeline
    const processAudio = useCallback(async (audioBlob: Blob) => {
        updateState("processing");
        console.log("[Realtime] Processing audio:", audioBlob.size, "bytes");

        try {
            // Create form data with audio
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.wav");
            formData.append("slug", slug);
            formData.append("language", language);
            formData.append("history", JSON.stringify(historyRef.current.slice(-4)));

            // Call the ULTRA-FAST voice API (sub-1s latency)
            const response = await fetch("/api/voice-ultra", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Voice processing failed");
            }

            // Get transcribed and response text from headers
            const transcribedText = decodeURIComponent(response.headers.get("X-Transcribed-Text") || "");
            const responseText = decodeURIComponent(response.headers.get("X-Response-Text") || "");

            console.log("[Realtime] Transcript:", transcribedText);
            console.log("[Realtime] Response:", responseText);

            // Notify callbacks
            if (transcribedText) {
                onTranscript?.(transcribedText);
                historyRef.current.push({ role: "user", content: transcribedText });
            }
            if (responseText) {
                onResponse?.(responseText);
                historyRef.current.push({ role: "assistant", content: responseText });
            }

            // Play audio response
            const audioBlob2 = await response.blob();
            if (audioBlob2.size > 100) {
                updateState("speaking");
                const audio = getAudioElement();
                audio.src = URL.createObjectURL(audioBlob2);

                audio.onended = () => {
                    URL.revokeObjectURL(audio.src);
                    updateState("idle");
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(audio.src);
                    updateState("idle");
                };

                await audio.play();
            } else {
                updateState("idle");
            }

        } catch (error: any) {
            console.error("[Realtime] Error:", error);
            onError?.(error?.message || "Voice processing failed");
            updateState("idle");
        }
    }, [slug, language, onTranscript, onResponse, onError, getAudioElement, updateState]);

    // Start recording audio
    const startRecording = useCallback(async () => {
        try {
            // Request microphone access
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

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Combine all chunks into a single blob
                const mimeType = mediaRecorder.mimeType;
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                console.log("[Realtime] Recording stopped, size:", audioBlob.size);

                // Clean up stream
                streamRef.current?.getTracks().forEach(track => track.stop());
                streamRef.current = null;

                // Process the audio if we have data
                if (audioBlob.size > 1000) {
                    await processAudio(audioBlob);
                } else {
                    console.log("[Realtime] Audio too short, ignoring");
                    updateState("idle");
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Capture in 100ms chunks

            setIsRecording(true);
            updateState("listening");
            console.log("[Realtime] Recording started");

        } catch (error: any) {
            console.error("[Realtime] Failed to start recording:", error);
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
            console.log("[Realtime] Stopping recording...");
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

    // Clear conversation history
    const clearHistory = useCallback(() => {
        historyRef.current = [];
    }, []);

    return {
        state,
        isRecording,
        startRecording,
        stopRecording,
        toggleRecording,
        stopSpeaking,
        clearHistory,
    };
}
