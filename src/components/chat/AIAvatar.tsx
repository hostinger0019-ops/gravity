"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AIAvatarProps {
    isListening?: boolean;
    isSpeaking?: boolean;
    agentName?: string;
    agentRole?: string;
}

export function AIAvatar({ isListening = false, isSpeaking = false, agentName = "Sophia", agentRole = "Senior Property Advisor" }: AIAvatarProps) {
    const [audioLevels, setAudioLevels] = useState<number[]>([0.3, 0.5, 0.7, 0.5, 0.3]);

    useEffect(() => {
        if (!isSpeaking) {
            setAudioLevels([0.25, 0.25, 0.25, 0.25, 0.25]);
            return;
        }

        const interval = setInterval(() => {
            setAudioLevels([
                Math.random() * 0.6 + 0.4,
                Math.random() * 0.8 + 0.2,
                Math.random() * 1.0,
                Math.random() * 0.8 + 0.2,
                Math.random() * 0.6 + 0.4,
            ]);
        }, 100);

        return () => clearInterval(interval);
    }, [isSpeaking]);

    return (
        <div className="relative">
            {/* Premium Geometric Design - MUCH LARGER */}
            <div className="relative bg-white rounded-3xl p-10 shadow-2xl border border-gray-100">

                {/* Geometric Hexagonal Icon - BIGGER */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-8">
                        {/* Glow effect when speaking - LARGER */}
                        <motion.div
                            animate={isSpeaking ? {
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0.6, 0.3]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 blur-3xl rounded-full"
                        />

                        {/* Hexagonal geometric icon - MUCH BIGGER */}
                        <motion.div
                            animate={isSpeaking ? {
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.05, 1]
                            } : {}}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="relative w-40 h-40"
                        >
                            {/* SVG Hexagon with 3D effect */}
                            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="50%" stopColor="#14b8a6" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                                {/* Outer hexagon */}
                                <path
                                    d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                                    fill="url(#hexGradient)"
                                    className="drop-shadow-lg"
                                />
                                {/* Inner geometric pattern */}
                                <path
                                    d="M50 25 L70 37.5 L70 62.5 L50 75 L30 62.5 L30 37.5 Z"
                                    fill="white"
                                    opacity="0.9"
                                />
                                <path
                                    d="M50 25 L70 37.5 L50 50 Z"
                                    fill="url(#hexGradient)"
                                    opacity="0.6"
                                />
                                <path
                                    d="M50 50 L70 37.5 L70 62.5 Z"
                                    fill="url(#hexGradient)"
                                    opacity="0.4"
                                />
                                <path
                                    d="M50 50 L70 62.5 L50 75 Z"
                                    fill="url(#hexGradient)"
                                    opacity="0.5"
                                />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Agent Name - BIGGER FONT */}
                    <h3 className="text-4xl font-serif text-gray-900 mb-2 tracking-wide">
                        {agentName}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mb-8">
                        {agentRole}
                    </p>

                    {/* Voice Waveform - TALLER */}
                    <div className="flex items-end justify-center gap-2 h-24 mb-6">
                        {audioLevels.map((level, idx) => (
                            <motion.div
                                key={idx}
                                animate={{
                                    height: isSpeaking ? `${level * 100}%` : "35%",
                                    opacity: isSpeaking ? 1 : 0.6
                                }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="w-2 rounded-full bg-gradient-to-t from-emerald-500 via-teal-500 to-cyan-400 shadow-lg"
                                style={{ minHeight: '20px' }}
                            />
                        ))}
                    </div>

                    {/* Status Badge - LARGER */}
                    <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-full border border-gray-200 shadow-sm">
                        <motion.div
                            animate={isSpeaking ? {
                                scale: [1, 1.4, 1],
                                opacity: [1, 0.7, 1]
                            } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                            className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500' : isListening ? 'bg-red-500' : 'bg-gray-400'
                                }`}
                        />
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            {isSpeaking ? "Speaking" : isListening ? "Listening" : "Online"}
                        </span>
                        {isSpeaking && (
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Microphone indicator for listening - LARGER */}
                <AnimatePresence>
                    {isListening && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-6 right-6"
                        >
                            <div className="bg-red-500 p-3 rounded-full shadow-xl">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="text-2xl"
                                >
                                    🎤
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
