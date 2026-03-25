"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export default function RealEstateBuilderPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0a0e1a] text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
            {/* Enhanced Starfield Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-purple-950/10"></div>
                {[...Array(150)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            width: `${Math.random() * 2 + 0.5}px`,
                            height: `${Math.random() * 2 + 0.5}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.7 + 0.3,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Premium Navbar */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-50 bg-slate-900/30 backdrop-blur-xl border-b border-white/10"
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-600 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-orange-500/50">
                            A
                        </div>
                        <span className="text-2xl font-black">Aura <span className="text-orange-400">AI</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10 text-sm font-medium">
                        <Link href="#features" className="text-white/70 hover:text-white transition-colors">Features</Link>
                        <Link href="#how-it-works" className="text-white/70 hover:text-white transition-colors">How It Works</Link>
                        <Link href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link>
                        <Link href="#testimonials" className="text-white/70 hover:text-white transition-colors">Success Stories</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="#" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105">
                            Get Started
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section
                style={{ y: heroY, opacity: heroOpacity }}
                className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 min-h-screen flex items-center"
            >
                <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
                    {/* Left Column - Enhanced Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -80 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-sm font-bold backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            Powered by Advanced AI
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight">
                            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500">24/7<br />
                                AI</span> Real Estate<br />
                            Assistant
                        </h1>

                        <p className="text-xl md:text-2xl text-white/70 leading-relaxed max-w-xl">
                            Qualify leads, schedule tours, and close deals—<span className="text-white font-semibold">automatically</span>. While you sleep, your AI agent works.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href="#"
                                className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 rounded-full text-white text-lg font-black shadow-2xl shadow-orange-600/40 hover:shadow-orange-500/60 hover:scale-105 transition-all"
                            >
                                <span>Create Your Agent - Free Trial</span>
                                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="#"
                                className="inline-flex items-center gap-2 px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-full text-white text-lg font-bold hover:bg-white/10 transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Watch Demo
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex items-center gap-8 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-white/60">
                                    <div className="font-bold text-white">500+</div>
                                    <div>Happy Agents</div>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-sm text-white/60">
                                <div className="flex items-center gap-1 text-orange-400 font-bold text-lg">
                                    ★★★★★ <span className="text-white ml-1">4.9</span>
                                </div>
                                <div>Based on 200+ reviews</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Enhanced 3D Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative"
                    >
                        {/* Stat Badges */}
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="absolute -top-8 left-12 z-20 px-8 py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-black font-black rounded-2xl shadow-2xl shadow-orange-500/50"
                        >
                            <div className="text-3xl">98%</div>
                            <div className="text-xs uppercase tracking-wide">Response Rate</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute -top-8 right-12 z-20 px-8 py-4 bg-white text-black font-black rounded-2xl shadow-2xl"
                        >
                            <div className="text-3xl">500+</div>
                            <div className="text-xs uppercase tracking-wide">Active Users</div>
                        </motion.div>

                        {/* Enhanced 3D Workflow Illustration */}
                        <div className="relative aspect-square max-w-2xl mx-auto perspective-1000">
                            {/* Central Website Interface - More detailed */}
                            <motion.div
                                animate={{
                                    rotateY: [0, 5, 0],
                                    rotateX: [0, -2, 0]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-64 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl border-4 border-slate-700/50 shadow-2xl transform rotate-6"
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                <div className="p-6 h-full flex flex-col">
                                    {/* Browser Header */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 h-6 bg-slate-700/50 rounded-lg"></div>
                                    </div>
                                    {/* Property Cards */}
                                    <div className="flex-1 space-y-3">
                                        <div className="h-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30"></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="h-16 bg-slate-700/40 rounded-lg"></div>
                                            <div className="h-16 bg-slate-700/40 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Chat Badge */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/50"
                                >
                                    💬
                                </motion.div>
                            </motion.div>

                            {/* Email Icon - Enhanced */}
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [-12, -8, -12]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute left-8 top-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-orange-500/60 border-4 border-orange-300/30"
                            >
                                📧
                            </motion.div>

                            {/* Phone Icon - Enhanced */}
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [6, 10, 6]
                                }}
                                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-blue-500/60 border-4 border-blue-300/30"
                            >
                                📞
                            </motion.div>

                            {/* Calendar Icon - Enhanced */}
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [12, 16, 12]
                                }}
                                transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-purple-500/60 border-4 border-purple-300/30"
                            >
                                📅
                            </motion.div>

                            {/* Enhanced Connecting Arrows */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 500 500">
                                <defs>
                                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.8" />
                                    </linearGradient>
                                    <marker id="arrowhead" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto">
                                        <polygon points="0 0, 12 5, 0 10" fill="url(#arrowGradient)" />
                                    </marker>
                                </defs>
                                <path d="M 100 250 Q 160 220, 220 250" stroke="url(#arrowGradient)" strokeWidth="4" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="8,6">
                                    <animate attributeName="stroke-dashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
                                </path>
                                <path d="M 250 280 Q 250 340, 250 400" stroke="url(#arrowGradient)" strokeWidth="4" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="8,6">
                                    <animate attributeName="stroke-dashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
                                </path>
                                <path d="M 270 400 Q 320 340, 360 280" stroke="url(#arrowGradient)" strokeWidth="4" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="8,6">
                                    <animate attributeName="stroke-dashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
                                </path>
                                <path d="M 380 250 Q 340 220, 280 250" stroke="url(#arrowGradient)" strokeWidth="4" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="8,6">
                                    <animate attributeName="stroke-dashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
                                </path>
                            </svg>

                            {/* Glow Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl -z-10"></div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-32 bg-gradient-to-b from-transparent to-slate-900/30">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <div className="inline-block px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-sm font-bold mb-6">
                            Why Choose Aura AI?
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black mb-6">
                            One AI Agent.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Unlimited Possibilities.</span>
                        </h2>
                        <p className="text-xl text-white/60 max-w-3xl mx-auto">
                            Your AI agent handles everything from first contact to booking, so you can focus on closing deals.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: "🗣️", title: "Natural Voice Calls", desc: "Crystal-clear voice conversations that sound completely human. No robotic responses." },
                            { icon: "📧", title: "Instant Lead Capture", desc: "Automatically collect emails, phone numbers, and qualify prospects 24/7." },
                            { icon: "🎯", title: "Smart Follow-Ups", desc: "AI remembers every conversation and follows up at the perfect time." },
                            { icon: "📅", title: "Calendar Integration", desc: "Book tours and viewings directly into your calendar without lifting a finger." },
                            { icon: "💬", title: "Multi-Channel Support", desc: "Website chat, SMS, WhatsApp, email—all handled by one AI agent." },
                            { icon: "⚡", title: "Lightning Fast Setup", desc: "Go live in under 5 minutes. Just copy-paste one line of code." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/10"
                            >
                                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="p-16 bg-gradient-to-br from-orange-600 via-orange-500 to-pink-600 rounded-[3rem] shadow-2xl shadow-orange-600/40 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                                Ready to 10x Your Leads?
                            </h2>
                            <p className="text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
                                Join 500+ agents who never miss a lead. Start your free trial today.
                            </p>
                            <Link
                                href="#"
                                className="inline-flex items-center gap-3 px-12 py-6 bg-white text-orange-600 rounded-full text-xl font-black shadow-2xl hover:shadow-white/30 hover:scale-105 transition-all"
                            >
                                Get Started Free
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <p className="text-white/70 text-sm mt-6">No credit card required • Setup in 5 minutes</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-slate-950 border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
                    <p>© 2026 Aura AI. All rights reserved. Built with ❤️ for real estate professionals.</p>
                </div>
            </footer>
        </div>
    );
}
