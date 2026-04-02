"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [status, setStatus] = useState("Ready");

  const websocketRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize WebSocket
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${wsProtocol}://localhost:8000/ws/voice`);

    ws.onopen = () => {
      console.log("Connected to Voice Worker");
      setStatus("Connected");
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === "generation_done") {
          setIsProcessing(false);
          setStatus("Ready");
          setAiResponse(message.text);
        } else if (message.type === "error") {
          console.error("Server error:", message.message);
          setStatus("Error: " + message.message);
          setIsProcessing(false);
        }
      } else {
        // Binary audio data
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          queueAudio(arrayBuffer);
        }
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected (Start voice_worker.py)");
    };

    websocketRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Initialize Speech Recognition (Web Speech API - runs in browser)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Send final transcript to backend
        if (transcript && websocketRef.current?.readyState === WebSocket.OPEN) {
          setIsProcessing(true);
          setStatus("AI Thinking...");
          websocketRef.current.send(JSON.stringify({ type: "user_message", text: transcript }));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setStatus("Mic Error: " + event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setStatus("Speech recognition not supported");
    }
  }, [transcript]);

  // Initialize Audio Context on user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const queueAudio = (buffer: ArrayBuffer) => {
    audioQueueRef.current.push(buffer);
    if (!isPlayingRef.current) {
      playNextChunk();
    }
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(chunk.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        playNextChunk();
      };
      source.start(0);
    } catch (e) {
      console.error("Error decoding audio chunk", e);
      // Try next chunk
      playNextChunk();
    }
  };

  const startListening = () => {
    initAudioContext();
    setTranscript("");
    setAiResponse("");
    setIsListening(true);
    setStatus("Listening...");
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-black text-white p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-8 text-center">

        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            Voice Assistant
          </h1>
          <p className={`text-sm font-medium transition-colors duration-300 ${status.startsWith("Error") || status.startsWith("Disconnected") ? "text-red-400" : "text-blue-400"}`}>
            {status}
          </p>
        </div>

        {/* Visualizer / Status Ring */}
        <div className="relative flex items-center justify-center">
          <div className={`w-32 h-32 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${isListening ? "scale-110 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]" : "bg-white/5"}`}>
            {isProcessing ? (
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-red-400 animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* Ripples when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-20" />
              <div className="absolute inset-[-10px] rounded-full border border-red-500/20 animate-ping delay-150 opacity-10" />
            </>
          )}
        </div>

        {/* Transcript Area */}
        <div className="min-h-[100px] space-y-4">
          {transcript && (
            <div className="text-lg text-gray-300 font-light italic">
              &quot;{transcript}&quot;
            </div>
          )}
          {aiResponse && (
            <div className="text-lg text-white font-medium animate-in fade-in slide-in-from-bottom-4">
              {aiResponse}
            </div>
          )}
        </div>

        {/* Controls */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`
                    px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isListening
              ? "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20"
              : "bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"}
                `}
        >
          {isListening ? "Stop Speaking" : "Tap to Speak"}
        </button>

        <div className="text-xs text-gray-600 mt-8">
          Uses Browser Speech Recognition & Kokoro TTS
        </div>
      </div>
    </div>
  );
}
