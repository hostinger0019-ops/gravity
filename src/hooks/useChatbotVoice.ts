"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useChatbotVoice — Continuous PCM Streaming with GPU-side VAD
 * 
 * Features:
 * - Streams 16kHz PCM via AudioWorklet to GPU WebSocket
 * - GPU detects speech start/end (no browser VAD needed)
 * - Word-by-word typing synced to audio playback duration
 * - Barge-in: user speaking stops audio + cancels pipeline
 */

type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking";

interface UseChatbotVoiceOptions {
  wsUrl?: string;
  chatbotId?: string;
  systemPrompt?: string;
  onMessage?: (userText: string, aiText: string) => void;
  onStateChange?: (state: VoiceState) => void;
}

export function useChatbotVoice(options: UseChatbotVoiceOptions = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [lastTranscription, setLastTranscription] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Refs for stable closure
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const startedRef = useRef(false);

  // Audio playback state
  const audioQueueRef = useRef<Blob[]>([]);
  const sentenceQueueRef = useRef<string[]>([]);
  const audioMetaQueueRef = useRef<{ duration_ms: number; word_count: number }[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayedTextRef = useRef("");
  const streamingMsgAddedRef = useRef(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const updateState = useCallback((s: VoiceState) => {
    setState(s);
    optionsRef.current.onStateChange?.(s);
  }, []);

  // --- Barge-in: stop all audio + clear queues ---
  const stopAllAudio = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    sentenceQueueRef.current = [];
    audioMetaQueueRef.current = [];
    isPlayingRef.current = false;
    setIsTyping(false);
  }, []);

  // --- Play next audio chunk from queue ---
  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) return;
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    const sentence = sentenceQueueRef.current.shift();

    // Word-by-word typing animation synced to audio duration
    if (sentence) {
      const words = sentence.split(" ");
      let wordIndex = 0;
      const baseText = displayedTextRef.current;
      const prefix = baseText ? "\n" : "";
      const meta = audioMetaQueueRef.current.shift();
      const intervalMs = meta
        ? Math.max(50, (meta.duration_ms * 0.7) / meta.word_count)
        : Math.max(60, Math.min(120, 2000 / words.length));

      setIsTyping(true);

      if (!streamingMsgAddedRef.current) {
        streamingMsgAddedRef.current = true;
        setLastResponse(baseText + prefix + words[0]);
        wordIndex = 1;
      }

      typingIntervalRef.current = setInterval(() => {
        if (wordIndex < words.length) {
          const partial = words.slice(0, wordIndex + 1).join(" ");
          setLastResponse(baseText + prefix + partial);
          wordIndex++;
        } else {
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          displayedTextRef.current = baseText + prefix + sentence;
          setIsTyping(false);
        }
      }, intervalMs);
    }

    const url = URL.createObjectURL(chunk);
    const audio = new Audio(url);
    currentAudioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudioRef.current = null;
      isPlayingRef.current = false;
      if (typingIntervalRef.current) {
        const waitForTyping = setInterval(() => {
          if (!typingIntervalRef.current) {
            clearInterval(waitForTyping);
            playNextAudio();
          }
        }, 50);
      } else {
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        } else {
          updateState("listening");
        }
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudioRef.current = null;
      isPlayingRef.current = false;
      playNextAudio();
    };

    audio.play().catch(() => {
      currentAudioRef.current = null;
      isPlayingRef.current = false;
      playNextAudio();
    });
  }, [updateState]);

  // --- Start: connect WebSocket + AudioWorklet ---
  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    updateState("connecting");

    try {
      // Get mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      audioStreamRef.current = stream;

      // 16kHz AudioContext
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      console.log(`[Voice] AudioContext sample rate: ${ctx.sampleRate}Hz`);

      // Load AudioWorklet
      await ctx.audioWorklet.addModule("/pcm-processor.js");

      // Build WebSocket URL
      const opts = optionsRef.current;
      const baseWsUrl = opts.wsUrl
        || process.env.NEXT_PUBLIC_CHATBOT_VOICE_WS_URL
        || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
      const wsUrl = `${baseWsUrl}/ws/voice?api_key=test-key-1`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Voice] WS connected, streaming 16kHz PCM...");
        updateState("listening");

        // Send config with stream mode
        ws.send(JSON.stringify({
          type: "config",
          mode: "stream",
          sample_rate: 16000,
          chatbot_id: opts.chatbotId || null,
          system_prompt: opts.systemPrompt || null,
          history: historyRef.current.slice(-6),
        }));

        // Connect AudioWorklet: source → worklet → streams int16 PCM chunks
        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, "pcm-processor");
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(e.data); // raw int16 PCM bytes
          }
        };

        source.connect(workletNode);
        workletNode.connect(ctx.destination);
      };

      ws.onmessage = (event) => {
        // Binary = audio chunk
        if (event.data instanceof Blob) {
          updateState("speaking");
          audioQueueRef.current.push(event.data);
          playNextAudio();
          return;
        }

        try {
          const data = JSON.parse(event.data);

          if (data.type === "vad_speech_start") {
            console.log("[Voice] GPU: speech started");
            // Barge-in
            stopAllAudio();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "cancel" }));
            }
            displayedTextRef.current = "";
            streamingMsgAddedRef.current = false;
            setLastResponse("");
            updateState("processing");

          } else if (data.type === "vad_speech_end") {
            console.log("[Voice] GPU: speech ended, processing...");

          } else if (data.type === "transcription") {
            console.log(`[Voice] Transcription: "${data.text}" (${data.latency_ms}ms)`);
            setLastTranscription(data.text);
            historyRef.current.push({ role: "user", content: data.text });

          } else if (data.type === "llm_sentence") {
            sentenceQueueRef.current.push(data.text);
            console.log(`[Voice] Sentence queued: "${data.text}"`);

          } else if (data.type === "audio_meta") {
            audioMetaQueueRef.current.push({
              duration_ms: data.duration_ms,
              word_count: data.word_count,
            });

          } else if (data.type === "llm_token") {
            // Ignore — we use llm_sentence for display synced with audio

          } else if (data.type === "done") {
            const fullResponse = data.full_response || displayedTextRef.current;
            console.log(`[Voice] Done: ${data.total_pipeline_ms}ms, first audio: ${data.first_audio_ms}ms`);

            // Show full response if audio hasn't shown text yet
            if (!streamingMsgAddedRef.current && fullResponse) {
              setLastResponse(fullResponse);
              streamingMsgAddedRef.current = true;
            }

            historyRef.current.push({ role: "assistant", content: fullResponse });
            if (historyRef.current.length > 10) {
              historyRef.current = historyRef.current.slice(-6);
            }

            // Call onMessage callback
            const transcript = historyRef.current.find(
              (m) => m.role === "user"
            )?.content || "";
            optionsRef.current.onMessage?.(transcript, fullResponse);

          } else if (data.type === "pong") {
            // keepalive response
          }
        } catch (e) {
          console.warn("[Voice] Parse error:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("[Voice] WS Error:", e);
      };

      ws.onclose = () => {
        console.log("[Voice] WS Closed");
        if (startedRef.current) {
          updateState("idle");
          startedRef.current = false;
        }
      };

    } catch (e: any) {
      console.error("[Voice] Start error:", e);
      startedRef.current = false;
      updateState("idle");

      if (e.name === "NotFoundError") {
        alert("No microphone found. Please connect a microphone.");
      } else if (e.name === "NotAllowedError") {
        alert("Microphone access denied. Please allow microphone access.");
      }
    }
  }, [updateState, stopAllAudio, playNextAudio]);

  // --- Stop: disconnect everything ---
  const stop = useCallback(() => {
    stopAllAudio();

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      wsRef.current.close();
      wsRef.current = null;
    }

    startedRef.current = false;
    displayedTextRef.current = "";
    streamingMsgAddedRef.current = false;
    updateState("idle");
    console.log("[Voice] Stopped");
  }, [updateState, stopAllAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (startedRef.current) {
        stop();
      }
    };
  }, [stop]);

  return {
    state,
    isTyping,
    lastTranscription,
    lastResponse,
    start,
    stop,
  };
}
