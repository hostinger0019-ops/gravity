"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useAutoVoice Hook - Automatic Voice Activity Detection
 * 
 * Features:
 * - Auto-detects when user starts speaking
 * - Auto-detects when user stops speaking (silence detection)
 * - No button clicks needed - just speak!
 */

interface UseAutoVoiceOptions {
    slug?: string;
    language?: string;
    onTranscript?: (text: string) => void;
    onResponse?: (text: string) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: VoiceState) => void;
    onTimings?: (timings: VoiceTimings) => void;
    silenceThreshold?: number; // dB threshold for silence detection
    silenceDuration?: number; // ms of silence before stopping
}

type VoiceState = "idle" | "listening" | "speaking_detected" | "processing" | "responding";

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

export function useAutoVoice(options: UseAutoVoiceOptions = {}) {
    const {
        slug = "default",
        language = "hi",
        onTranscript,
        onResponse,
        onError,
        onStateChange,
        onTimings,
        silenceThreshold = -55, // dB (lower = more sensitive, was -45)
        silenceDuration = 1200, // 1.2 seconds of silence = stop
    } = options;

    const [state, setState] = useState<VoiceState>("idle");
    const [isActive, setIsActive] = useState(false);
    const [volume, setVolume] = useState(0);
    const [lastTimings, setLastTimings] = useState<VoiceTimings>({});

    // Use refs to avoid stale closures in VAD interval
    const stateRef = useRef<VoiceState>("idle");
    const isActiveRef = useRef(false);

    // Refs for audio processing
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const historyRef = useRef<ConversationMessage[]>([]);

    // VAD state
    const silenceStartRef = useRef<number | null>(null);
    const speechStartRef = useRef<number | null>(null); // Track when speech started
    const isSpeakingRef = useRef(false);
    const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Max recording duration - fallback if silence detection fails
    const MAX_RECORDING_MS = 5000; // Stop after 5 seconds max

    const updateState = useCallback((newState: VoiceState) => {
        setState(newState);
        stateRef.current = newState;
        onStateChange?.(newState);
    }, [onStateChange]);

    const getAudioElement = useCallback(() => {
        if (!audioElementRef.current) {
            audioElementRef.current = new Audio();
            audioElementRef.current.volume = 1.0;
        }
        return audioElementRef.current;
    }, []);

    // Process recorded audio - with browser STT fallback if server unavailable
    const processAudio = useCallback(async (audioBlob: Blob) => {
        if (audioBlob.size < 2000) {
            console.log("[AutoVoice] Audio too short, ignoring");
            updateState("listening");
            return;
        }

        const clientStart = Date.now();
        updateState("processing");
        console.log("[AutoVoice] Processing:", audioBlob.size, "bytes");

        // Audio queue for seamless playback
        const audioQueue: string[] = [];
        let isPlaying = false;
        let fullResponseText = "";

        const playNextInQueue = async () => {
            if (audioQueue.length === 0 || isPlaying) return;

            isPlaying = true;
            const base64Audio = audioQueue.shift()!;

            try {
                // Convert base64 to blob and play
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const audioBlob2 = new Blob([bytes], { type: "audio/wav" });
                const audioUrl = URL.createObjectURL(audioBlob2);

                const audio = getAudioElement();
                audio.src = audioUrl;

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    isPlaying = false;
                    // Play next in queue or resume listening
                    if (audioQueue.length > 0) {
                        playNextInQueue();
                    } else if (isActiveRef.current) {
                        updateState("listening");
                    } else {
                        updateState("idle");
                    }
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    isPlaying = false;
                    if (audioQueue.length > 0) {
                        playNextInQueue();
                    }
                };

                await audio.play();
            } catch (e) {
                console.error("[AutoVoice] Audio play error:", e);
                isPlaying = false;
                playNextInQueue();
            }
        };

        // Play audio URL directly (for fallback TTS)
        const playAudioUrl = async (url: string): Promise<void> => {
            return new Promise((resolve) => {
                const audio = getAudioElement();
                audio.src = url;
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };
                audio.play().catch(() => resolve());
            });
        };

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
                const errorData = await response.json();
                // Handle 503 ASR unavailable gracefully - don't throw error
                if (response.status === 503 && errorData.code === "ASR_UNAVAILABLE") {
                    console.warn("[AutoVoice] ASR server not available:", errorData.error);
                    onError?.(errorData.error);
                    if (isActiveRef.current) updateState("listening");
                    else updateState("idle");
                    return;
                }
                throw new Error(errorData.error || "Voice processing failed");
            }

            // Get transcribed text from header immediately
            const transcribedText = decodeURIComponent(response.headers.get("X-Transcribed-Text") || "");
            if (transcribedText) {
                onTranscript?.(transcribedText);
                historyRef.current.push({ role: "user", content: transcribedText });
            }

            // Read SSE stream
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let buffer = "";
            let firstAudioReceived = false;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;

                    const eventMatch = line.match(/^event: (\w+)/);
                    const dataMatch = line.match(/^data: (.+)$/m);

                    if (!eventMatch || !dataMatch) continue;

                    const eventType = eventMatch[1];
                    const data = JSON.parse(dataMatch[1]);

                    if (eventType === "audio") {
                        if (!firstAudioReceived) {
                            firstAudioReceived = true;
                            updateState("responding");
                            const latency = Date.now() - clientStart;
                            console.log(`[AutoVoice] 🔊 First audio at ${latency}ms`);
                            setLastTimings({ total: latency, llmFirstSentence: data.llmTime, tts: data.ttsTime });
                            onTimings?.({ total: latency, llmFirstSentence: data.llmTime, tts: data.ttsTime });
                        }

                        fullResponseText += " " + data.sentence;
                        console.log(`[AutoVoice] 📢 Sentence ${data.sentenceNum}: "${data.sentence.substring(0, 30)}..."`);

                        // Add to queue and start playing
                        audioQueue.push(data.audio);
                        playNextInQueue();
                    } else if (eventType === "done") {
                        console.log(`[AutoVoice] ✅ Complete in ${data.totalTime}ms | First: ${data.firstSentenceTime}ms | Sentences: ${data.sentenceCount}`);

                        // Update response
                        fullResponseText = data.fullText || fullResponseText.trim();
                        onResponse?.(fullResponseText);
                        historyRef.current.push({ role: "assistant", content: fullResponseText });

                        if (historyRef.current.length > 6) {
                            historyRef.current = historyRef.current.slice(-4);
                        }
                    } else if (eventType === "error") {
                        throw new Error(data.error);
                    }
                }
            }

            // If no audio was played, go back to listening
            if (!firstAudioReceived) {
                if (isActiveRef.current) updateState("listening");
                else updateState("idle");
            }

        } catch (error: any) {
            // Check if it's a connection error - use browser fallback
            if (error.message?.includes("fetch failed") || error.cause?.code === "ECONNREFUSED") {
                console.log("[AutoVoice] Server unavailable, using browser STT fallback...");

                try {
                    // Use browser's Web Speech API for transcription
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                        throw new Error("Browser speech recognition not supported");
                    }

                    // For now, just notify - actual audio-to-text requires playing audio which is complex
                    // Instead, show a message that server is needed
                    console.log("[AutoVoice] Fallback: Using voice-chat with Groq + Kokoro");

                    // Since we can't easily transcribe the recorded audio blob in browser,
                    // we'll tell user to use the regular voice mode which uses live STT
                    onError?.("Voice server offline. Use the microphone button for browser-based voice.");
                    if (isActiveRef.current) updateState("listening");
                    else updateState("idle");
                    return;

                } catch (fallbackError: any) {
                    console.error("[AutoVoice] Fallback failed:", fallbackError);
                    onError?.(fallbackError.message);
                }
            } else {
                console.error("[AutoVoice] Error:", error);
                onError?.(error?.message || "Voice processing failed");
            }

            if (isActiveRef.current) updateState("listening");
            else updateState("idle");
        }
    }, [slug, language, onTranscript, onResponse, onError, onTimings, getAudioElement, updateState]);

    // Voice Activity Detection - uses refs to avoid stale closures
    const startVAD = useCallback(() => {
        if (!analyserRef.current) {
            console.error("[AutoVoice] No analyser!");
            return;
        }

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Use config threshold, default very sensitive
        const threshold = silenceThreshold;
        const silenceMs = silenceDuration;

        console.log("[AutoVoice] VAD started, threshold:", threshold, "dB, silence:", silenceMs, "ms");

        vadIntervalRef.current = setInterval(() => {
            if (!analyser) return;

            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / bufferLength);
            const dB = rms > 0 ? 20 * Math.log10(rms / 255) : -100;

            // Normalize to 0-1 for display
            setVolume(Math.max(0, Math.min(1, (dB + 60) / 50)));

            const currentState = stateRef.current;
            const isSpeaking = dB > threshold;

            // Log every 500ms for debugging
            if (Date.now() % 500 < 50) {
                console.log(`[VAD] dB: ${dB.toFixed(1)} | speaking: ${isSpeaking} | isSpeakingRef: ${isSpeakingRef.current} | state: ${currentState}`);
            }

            if (isSpeaking) {
                // User is speaking
                silenceStartRef.current = null;

                if (!isSpeakingRef.current && currentState === "listening") {
                    isSpeakingRef.current = true;
                    speechStartRef.current = Date.now(); // Track when speech started
                    updateState("speaking_detected");
                    console.log("[AutoVoice] 🎤 Speech detected! dB:", dB.toFixed(1));

                    // Start recording
                    audioChunksRef.current = [];
                    const recorder = mediaRecorderRef.current;
                    if (recorder && recorder.state === "inactive") {
                        try {
                            recorder.start(50);
                            console.log("[AutoVoice] ✅ Recording started");
                        } catch (e) {
                            console.error("[AutoVoice] Failed to start recording:", e);
                        }
                    }
                }

                // FALLBACK: Force stop after MAX_RECORDING_MS even if still speaking
                if (isSpeakingRef.current && speechStartRef.current) {
                    const recordingDuration = Date.now() - speechStartRef.current;
                    if (recordingDuration > MAX_RECORDING_MS) {
                        console.log("[AutoVoice] ⏰ Max duration reached (5s) - forcing stop!");
                        isSpeakingRef.current = false;
                        silenceStartRef.current = null;
                        speechStartRef.current = null;

                        const recorder = mediaRecorderRef.current;
                        if (recorder && recorder.state === "recording") {
                            recorder.stop();
                            console.log("[AutoVoice] ✅ Recorder stopped (max duration)");
                        }
                    }
                }
            } else {
                // Silence detected
                if (isSpeakingRef.current) {
                    if (!silenceStartRef.current) {
                        silenceStartRef.current = Date.now();
                        console.log("[AutoVoice] ⏱️ Silence started, waiting", silenceMs, "ms...");
                    } else {
                        const elapsed = Date.now() - silenceStartRef.current;
                        if (elapsed > silenceMs) {
                            // Silence threshold reached - stop recording
                            console.log("[AutoVoice] 🔇 Silence confirmed after", elapsed, "ms - stopping recording!");
                            isSpeakingRef.current = false;
                            silenceStartRef.current = null;
                            speechStartRef.current = null;

                            const recorder = mediaRecorderRef.current;
                            if (recorder) {
                                console.log("[AutoVoice] Recorder state:", recorder.state);
                                if (recorder.state === "recording") {
                                    recorder.stop();
                                    console.log("[AutoVoice] ✅ Recorder stopped");
                                }
                            }
                        }
                    }
                }
            }
        }, 50);
    }, [silenceThreshold, silenceDuration, updateState]);

    // Start listening
    const startListening = useCallback(async () => {
        try {
            console.log("[AutoVoice] Requesting microphone...");
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            console.log("[AutoVoice] Got microphone stream");
            streamRef.current = stream;
            audioChunksRef.current = [];

            // Set up audio context for VAD
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();

            // Resume if suspended (required by some browsers)
            if (audioContextRef.current.state === "suspended") {
                await audioContextRef.current.resume();
            }

            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 512; // Larger for better frequency resolution
            analyserRef.current.smoothingTimeConstant = 0.3;
            source.connect(analyserRef.current);

            // Set up MediaRecorder
            let mimeType = "audio/webm";
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                console.log("[AutoVoice] Recording stopped:", audioBlob.size, "bytes");
                audioChunksRef.current = [];
                await processAudio(audioBlob);
            };

            mediaRecorderRef.current = mediaRecorder;
            setIsActive(true);
            isActiveRef.current = true;
            updateState("listening");

            // Start VAD
            startVAD();
            console.log("[AutoVoice] ✅ Listening started - speak anytime!");

        } catch (error: any) {
            console.error("[AutoVoice] Mic error:", error);
            onError?.("Microphone access denied: " + error.message);
            updateState("idle");
        }
    }, [processAudio, onError, updateState, startVAD]);

    // Stop listening
    const stopListening = useCallback(() => {
        console.log("[AutoVoice] Stopping...");

        // Stop VAD
        if (vadIntervalRef.current) {
            clearInterval(vadIntervalRef.current);
            vadIntervalRef.current = null;
        }

        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.warn("[AutoVoice] Error stopping recorder:", e);
            }
        }
        mediaRecorderRef.current = null;

        // Stop stream
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
        }
        audioContextRef.current = null;
        analyserRef.current = null;

        isSpeakingRef.current = false;
        silenceStartRef.current = null;
        setIsActive(false);
        isActiveRef.current = false;
        updateState("idle");
        console.log("[AutoVoice] Stopped");
    }, [updateState]);

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
        if (isActiveRef.current) {
            updateState("listening");
        } else {
            updateState("idle");
        }
    }, [updateState]);

    // Clear history
    const clearHistory = useCallback(() => {
        historyRef.current = [];
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (vadIntervalRef.current) {
                clearInterval(vadIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                try { mediaRecorderRef.current.stop(); } catch { }
            }
            streamRef.current?.getTracks().forEach(track => track.stop());
            audioContextRef.current?.close().catch(() => { });
        };
    }, []);

    return {
        state,
        isActive,
        volume,
        lastTimings,
        startListening,
        stopListening,
        stopSpeaking,
        clearHistory,
    };
}
