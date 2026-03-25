"use client";

import { useRef, useState, useCallback } from "react";

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface UseVoiceChatOptions {
    onTranscript?: (text: string) => void;
    onPartial?: (text: string) => void;
    onError?: (error: string) => void;
    voice?: string;
}

// Sentence boundary regex - matches . ! ? followed by space or end
const SENTENCE_END_REGEX = /[.!?:]\s*$/;

// Clean text for TTS - remove markdown, code blocks, etc.
function cleanTextForTTS(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, "") // remove code blocks
        .replace(/`[^`]+`/g, "") // remove inline code
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // remove images
        .replace(/\[[^\]]*\]\([^)]+\)/g, (m) => m.replace(/\[|\]|\([^)]+\)/g, "")) // clean links
        .replace(/[#*_~]/g, "") // remove markdown
        .replace(/\n+/g, " ") // newlines to spaces
        .replace(/\s+/g, " ") // collapse whitespace
        .trim();
}

// Queue item for ordered TTS processing
interface TTSQueueItem {
    index: number;
    text: string;
    audioUrl?: string;
    status: 'pending' | 'fetching' | 'ready' | 'playing' | 'done';
}

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
    const { onTranscript, onPartial, onError, voice = "af_bella" } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);

    // Audio queue for streaming TTS - using ordered queue for correct sequencing
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const ttsQueueRef = useRef<TTSQueueItem[]>([]);
    const nextPlayIndexRef = useRef(0);
    const isPlayingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize Audio Context (must be done on user gesture)
    const initAudioContext = useCallback(async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            console.log("[TTS] Created new AudioContext, state:", audioContextRef.current.state);
        }
        if (audioContextRef.current.state === "suspended") {
            console.log("[TTS] Resuming suspended AudioContext...");
            await audioContextRef.current.resume();
            console.log("[TTS] AudioContext resumed, state:", audioContextRef.current.state);
        }
        return audioContextRef.current;
    }, []);

    // Use a single reusable Audio element for more reliable playback
    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    // Get or create the audio element
    const getAudioElement = useCallback(() => {
        if (!audioElementRef.current) {
            audioElementRef.current = new Audio();
            audioElementRef.current.volume = 1.0;
            console.log("[TTS] Created new Audio element");
        }
        return audioElementRef.current;
    }, []);

    // Play next ready item from the ordered queue
    const playNextInOrder = useCallback(() => {
        const queue = ttsQueueRef.current;
        const nextIndex = nextPlayIndexRef.current;

        console.log("[TTS] playNextInOrder - looking for index:", nextIndex, "queue size:", queue.length);

        // Find the item with the next index to play
        const nextItem = queue.find(item => item.index === nextIndex && item.status === 'ready');

        if (!nextItem) {
            // Check if all items are done
            const allDone = queue.every(item => item.status === 'done');
            if (allDone && queue.length > 0) {
                console.log("[TTS] All items played, clearing queue");
                ttsQueueRef.current = [];
                nextPlayIndexRef.current = 0;
                isPlayingRef.current = false;
                setIsSpeaking(false);
            } else {
                console.log("[TTS] Waiting for index", nextIndex, "to be ready...");
            }
            return;
        }

        // Mark as playing
        nextItem.status = 'playing';
        isPlayingRef.current = true;
        setIsSpeaking(true);

        const audioUrl = nextItem.audioUrl!;
        const audio = getAudioElement();

        console.log("[TTS] Playing index", nextIndex, ":", nextItem.text.substring(0, 30) + "...");

        // Set up event handlers for this playback
        const handleEnded = () => {
            console.log("[TTS] Audio ended for index", nextIndex);
            URL.revokeObjectURL(audioUrl);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            nextItem.status = 'done';
            nextPlayIndexRef.current = nextIndex + 1;
            // Try to play next
            playNextInOrder();
        };

        const handleError = (e: Event) => {
            console.error("[TTS] Audio error for index", nextIndex, ":", e);
            URL.revokeObjectURL(audioUrl);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            nextItem.status = 'done';
            nextPlayIndexRef.current = nextIndex + 1;
            // Try next
            playNextInOrder();
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        audio.src = audioUrl;

        // Use play() with promise to catch autoplay issues
        audio.play()
            .then(() => {
                console.log("[TTS] Audio play() started for index", nextIndex);
            })
            .catch((e) => {
                console.error("[TTS] Audio play() failed:", e);
                URL.revokeObjectURL(audioUrl);
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
                nextItem.status = 'done';
                nextPlayIndexRef.current = nextIndex + 1;
                playNextInOrder();
            });
    }, [getAudioElement]);

    // Add sentence to queue and start fetching audio
    const queueSentence = useCallback((text: string, index: number) => {
        const cleanText = cleanTextForTTS(text);
        if (!cleanText || cleanText.length < 2) {
            console.log("[TTS] Skipping short text at index", index, ":", text);
            return;
        }

        console.log("[TTS] Queuing sentence", index, ":", cleanText.substring(0, 50) + (cleanText.length > 50 ? "..." : ""));

        // Add to queue with pending status
        const item: TTSQueueItem = {
            index,
            text: cleanText,
            status: 'pending'
        };
        ttsQueueRef.current.push(item);
        item.status = 'fetching';

        // Fetch audio asynchronously
        fetch("/api/tts/kokoro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleanText, voice }),
        })
            .then(async response => {
                if (!response.ok) {
                    console.warn("[TTS] API failed for index", index, ":", response.status);
                    item.status = 'done'; // Skip this item
                    playNextInOrder();
                    return;
                }

                const blob = await response.blob();
                console.log("[TTS] Received audio for index", index, ":", blob.size, "bytes");

                if (blob.size < 100) {
                    console.warn("[TTS] Audio too small for index", index);
                    item.status = 'done';
                    playNextInOrder();
                    return;
                }

                item.audioUrl = URL.createObjectURL(blob);
                item.status = 'ready';
                console.log("[TTS] Ready to play index", index);

                // Try to play if this is the next expected index
                if (!isPlayingRef.current || nextPlayIndexRef.current === index) {
                    playNextInOrder();
                }
            })
            .catch(error => {
                console.warn("[TTS] Fetch error for index", index, ":", error);
                item.status = 'done';
                playNextInOrder();
            });
    }, [voice, playNextInOrder]);

    // Reset the queue for a new streaming session
    const resetQueue = useCallback(() => {
        // Clean up any pending audio URLs
        ttsQueueRef.current.forEach(item => {
            if (item.audioUrl) {
                URL.revokeObjectURL(item.audioUrl);
            }
        });
        ttsQueueRef.current = [];
        nextPlayIndexRef.current = 0;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    // Streaming TTS - reads from response stream and speaks sentences as they complete
    const speakTextStreaming = useCallback(async (
        reader: ReadableStreamDefaultReader<Uint8Array>
    ): Promise<string> => {
        console.log("[TTS Streaming] Starting...");
        resetQueue();
        setIsSpeaking(true);

        // Create abort controller for this streaming session
        abortControllerRef.current = new AbortController();

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let sentenceIndex = 0;

        // Find natural speech breaks - periods, commas, semicolons, colons, question/exclamation marks
        // This enables faster TTS by sending chunks as soon as they're complete
        const findSentenceBreak = (text: string): number => {
            // Priority 1: Strong breaks (. ! ?) - full sentence boundaries
            const strongMatch = text.match(/[.!?](\s|$)/);
            if (strongMatch && strongMatch.index !== undefined) {
                return strongMatch.index;
            }

            // Priority 2: Medium breaks (: ;) - clause boundaries  
            const mediumMatch = text.match(/[:;](\s|$)/);
            if (mediumMatch && mediumMatch.index !== undefined && mediumMatch.index > 15) {
                // Only break on : or ; if we have at least 15 chars (meaningful chunk)
                return mediumMatch.index;
            }

            // Priority 3: Soft breaks (,) - only if we have accumulated enough text
            const commaMatch = text.match(/,\s/);
            if (commaMatch && commaMatch.index !== undefined && commaMatch.index > 25) {
                // Only break on comma if we have at least 25 chars (good for TTS natural pacing)
                return commaMatch.index;
            }

            return -1;
        };

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                fullText += chunk;

                // Check for sentence boundaries and queue completed sentences
                let breakIndex = findSentenceBreak(buffer);
                while (breakIndex !== -1) {
                    // Include the punctuation in the sentence
                    const sentence = buffer.substring(0, breakIndex + 1).trim();
                    buffer = buffer.substring(breakIndex + 1).trimStart();

                    if (sentence.length > 0) {
                        console.log("[TTS Streaming] Queuing sentence", sentenceIndex, ":", sentence.substring(0, 50) + "...");
                        // Queue this sentence with its index for ordered playback
                        queueSentence(sentence, sentenceIndex);
                        sentenceIndex++;
                    }

                    breakIndex = findSentenceBreak(buffer);
                }
            }

            // Queue any remaining text in buffer
            if (buffer.trim().length > 0) {
                console.log("[TTS Streaming] Queuing remaining text as sentence", sentenceIndex);
                queueSentence(buffer.trim(), sentenceIndex);
            }

            console.log("[TTS Streaming] Complete. Total sentences:", sentenceIndex + (buffer.trim().length > 0 ? 1 : 0));
            return fullText;
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Streaming TTS error:", error);
                onError?.(error?.message || "Streaming speech failed");
            }
            return fullText;
        }
    }, [resetQueue, queueSentence, onError]);

    // Play audio from Kokoro TTS (non-streaming, for backwards compatibility)
    const speakText = useCallback(async (text: string): Promise<void> => {
        if (!text.trim()) return;

        try {
            setIsSpeaking(true);
            const audioContext = await initAudioContext();

            // Call Kokoro TTS API
            const response = await fetch("/api/tts/kokoro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice }),
            });

            if (!response.ok) {
                throw new Error("TTS synthesis failed");
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Stop any currently playing audio
            if (currentAudioRef.current) {
                try {
                    currentAudioRef.current.stop();
                } catch { }
            }

            // Play the audio
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            currentAudioRef.current = source;

            return new Promise((resolve) => {
                source.onended = () => {
                    setIsSpeaking(false);
                    currentAudioRef.current = null;
                    resolve();
                };
                source.start(0);
            });
        } catch (error: any) {
            console.error("TTS error:", error);
            setIsSpeaking(false);
            onError?.(error?.message || "Speech synthesis failed");
        }
    }, [initAudioContext, voice, onError]);

    // Stop speaking and clear queue
    const stopSpeaking = useCallback(() => {
        // Abort any ongoing streaming
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Stop HTML5 Audio element
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.src = '';
        }

        // Stop AudioContext source (for legacy speakText)
        if (currentAudioRef.current) {
            try {
                currentAudioRef.current.stop();
            } catch { }
            currentAudioRef.current = null;
        }

        // Clear ordered queue and revoke URLs
        ttsQueueRef.current.forEach(item => {
            if (item.audioUrl) {
                URL.revokeObjectURL(item.audioUrl);
            }
        });
        ttsQueueRef.current = [];
        nextPlayIndexRef.current = 0;

        // Clear legacy buffer queue
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsSpeaking(false);
    }, []);

    // Start listening for voice input
    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            onError?.("Speech recognition not supported in this browser");
            return;
        }

        // Initialize audio context on user gesture
        initAudioContext();

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
            const results = Array.from(event.results);
            const transcript = results
                .map((result: any) => result[0].transcript)
                .join("");

            const isFinal = results.some((result: any) => result.isFinal);

            if (isFinal) {
                onTranscript?.(transcript);
            } else {
                onPartial?.(transcript);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            onError?.(`Microphone error: ${event.error}`);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        setIsListening(true);
        recognition.start();
    }, [initAudioContext, onTranscript, onPartial, onError]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        isSpeaking,
        startListening,
        stopListening,
        toggleListening,
        speakText,
        speakTextStreaming,
        stopSpeaking,
        initAudio: initAudioContext,
    };
}
