"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function InstagramLanding() {
    const [demoMessages, setDemoMessages] = useState([
        { role: "assistant", content: "Hey! 👋 Thanks for checking out my profile. How can I help you today?" }
    ]);
    const [demoInput, setDemoInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    const handleDemoMessage = async (message: string) => {
        if (!message.trim() || isTyping) return;

        // Add user message
        const newMessages = [...demoMessages, { role: "user", content: message }];
        setDemoMessages(newMessages);
        setDemoInput("");
        setIsTyping(true);

        try {
            // Call real AI API
            const response = await fetch('/api/demo/instagram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.content
                    }))
                }),
            });

            const data = await response.json();

            // Add AI response
            setDemoMessages(prev => [...prev, {
                role: "assistant",
                content: data.reply || "Sorry, I couldn't process that. Try again!"
            }]);
        } catch (error) {
            console.error('Demo chat error:', error);
            setDemoMessages(prev => [...prev, {
                role: "assistant",
                content: "Oops! Something went wrong. Try refreshing the page! 😅"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-x-hidden">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ChatBot AI
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Features
                            </Link>
                            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Pricing
                            </Link>
                            <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                                Login
                            </Link>
                            <Link href="/admin" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 sm:py-32">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-orange-600/10"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
                                <span className="text-purple-600 font-medium text-sm">🚀 For Instagram Influencers & Brands</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Never Miss a{" "}
                                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                                    DM Again
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                                Auto-reply to Instagram DMs instantly with AI. Turn your Link in Bio into a lead generation machine.
                                No coding required.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <Link href="/admin" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-2xl hover:scale-105 transition-all text-center">
                                    Start Free Trial →
                                </Link>
                                <button className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-medium hover:border-purple-600 hover:text-purple-600 transition-all">
                                    Watch Demo
                                </button>
                            </div>

                            <div className="flex items-center gap-8 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Setup in 60 seconds</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Demo Chatbot - Hidden on mobile, visible on desktop */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative hidden lg:block"
                        >
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-20"></div>

                            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                                {/* Chat Header */}
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                                        👩‍🎨
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-white">@fashion_creator</div>
                                        <div className="text-purple-100 text-sm flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                            Active now
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {demoMessages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-md px-4 py-3 rounded-2xl whitespace-pre-wrap ${msg.role === "user"
                                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                                : "bg-white text-gray-900 shadow-sm border border-gray-200"
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Typing indicator */}
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Quick Replies */}
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="text-xs text-gray-500 mb-2">Try it out:</div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <button
                                            onClick={() => handleDemoMessage("Link in bio?")}
                                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                                        >
                                            Link in bio?
                                        </button>
                                        <button
                                            onClick={() => handleDemoMessage("Collab?")}
                                            className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm hover:bg-pink-200 transition-colors"
                                        >
                                            Collab?
                                        </button>
                                        <button
                                            onClick={() => handleDemoMessage("info@example.com")}
                                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                                        >
                                            Send email
                                        </button>
                                    </div>

                                    {/* Input */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={demoInput}
                                            onChange={(e) => setDemoInput(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleDemoMessage(demoInput)}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600"
                                        />
                                        <button
                                            onClick={() => handleDemoMessage(demoInput)}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Trust Bar */}
            <section className="py-12 bg-white border-y border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <p className="text-gray-600">Trusted by 5,000+ influencers and brands</p>
                    </div>
                    <div className="flex justify-center items-center gap-12 flex-wrap opacity-50">
                        <div className="text-2xl font-bold text-gray-400">@fashion.daily</div>
                        <div className="text-2xl font-bold text-gray-400">@fitness_coach</div>
                        <div className="text-2xl font-bold text-gray-400">@food_blogger</div>
                        <div className="text-2xl font-bold text-gray-400">@travel_tales</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gradient-to-br from-white to-purple-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Automate Instagram
                        </h2>
                        <p className="text-xl text-gray-600">
                            Save 10+ hours per week on DM replies and grow your audience faster
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "💬",
                                title: "Auto-Reply to DMs",
                                description: "Instantly respond to every DM with AI. Never leave a follower waiting again."
                            },
                            {
                                icon: "🔗",
                                title: "Link in Bio Chatbot",
                                description: "Turn your bio link into an interactive chatbot. Capture emails and qualify leads automatically."
                            },
                            {
                                icon: "📧",
                                title: "Email Collection",
                                description: "Automatically capture emails from DMs. Build your email list while you sleep."
                            },
                            {
                                icon: "🤖",
                                title: "AI-Powered Responses",
                                description: "Sounds like you, not a robot. Learns from your content and personality."
                            },
                            {
                                icon: "📊",
                                title: "Analytics Dashboard",
                                description: "Track DM volume, response times, and lead capture rates in real-time."
                            },
                            {
                                icon: "⚡",
                                title: "Instant Setup",
                                description: "Connect your Instagram account and go live in 60 seconds. No technical skills needed."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-purple-200"
                            >
                                <div className="text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Loved by Influencers
                        </h2>
                        <p className="text-xl text-gray-600">
                            See what creators are saying about our Instagram automation
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "@fashion_creator",
                                followers: "120K followers",
                                text: "I used to spend 2 hours every day replying to DMs. Now it's completely automated and my engagement is higher than ever!",
                                avatar: "👩‍🎨"
                            },
                            {
                                name: "@fitness_coach",
                                followers: "85K followers",
                                text: "The Link in Bio chatbot is a game-changer. I'm collecting 50+ emails per day from people asking about my programs.",
                                avatar: "💪"
                            },
                            {
                                name: "@travel_blogger",
                                followers: "200K followers",
                                text: "My DMs were  out of control. This bot handles everything - collab requests, product questions, you name it. Total lifesaver!",
                                avatar: "✈️"
                            }
                        ].map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-200"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-4xl">{testimonial.avatar}</div>
                                    <div>
                                        <div className="font-bold text-gray-900">{testimonial.name}</div>
                                        <div className="text-sm text-gray-600">{testimonial.followers}</div>
                                    </div>
                                </div>
                                <p className="text-gray-700 italic">"{testimonial.text}"</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Start free, upgrade as you grow
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {[
                            {
                                name: "Starter",
                                price: "$49",
                                period: "/month",
                                features: [
                                    "1,000 DM replies/month",
                                    "Email capture",
                                    "Basic analytics",
                                    "Link in Bio chatbot",
                                    "Email support"
                                ],
                                cta: "Start Free Trial",
                                popular: false
                            },
                            {
                                name: "Pro",
                                price: "$149",
                                period: "/month",
                                features: [
                                    "Unlimited DM replies",
                                    "Advanced analytics",
                                    "Custom branding",
                                    "Priority support",
                                    "Zapier integration",
                                    "Comment automation",
                                    "API access"
                                ],
                                cta: "Start Free Trial",
                                popular: true
                            }
                        ].map((plan, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className={`relative bg-white p-8 rounded-2xl shadow-xl ${plan.popular ? "border-2 border-purple-600 scale-105" : "border border-gray-200"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                                        <span className="text-gray-600 ml-1">{plan.period}</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/admin"
                                    className={`block w-full py-3 rounded-full font-medium text-center transition-all ${plan.popular
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to Automate Your Instagram?
                    </h2>
                    <p className="text-xl text-purple-100 mb-8">
                        Join 5,000+ influencers saving 10+ hours per week
                    </p>
                    <Link
                        href="/admin"
                        className="inline-block px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
                    >
                        Start Your Free Trial →
                    </Link>
                    <p className="text-purple-100 mt-4 text-sm">
                        No credit card required • Setup in 60 seconds
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-4">ChatBot AI</h3>
                            <p className="text-sm">Instagram automation for influencers and brands.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link href="/admin" className="hover:text-white transition-colors">Get Started</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="/" className="hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/" className="hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="/" className="hover:text-white transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>© 2026 ChatBot AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Floating Chat Button - Mobile Only */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-bounce">
                {/* Tooltip Label */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="bg-white px-3 py-1 rounded-lg shadow-md text-sm font-semibold text-purple-600 mb-1 mr-2 relative"
                >
                    Try AI Demo 👇
                    <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white transform rotate-45"></div>
                </motion.div>

                <button
                    onClick={() => setIsMobileModalOpen(true)}
                    className="relative w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform group"
                >
                    {/* Pulse Rings */}
                    <span className="absolute inset-0 rounded-full bg-pink-500 opacity-75 animate-ping"></span>

                    {/* Icon */}
                    <svg className="w-8 h-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>

                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold border-2 border-white z-20">1</span>
                </button>
            </div>

            {/* Mobile Chat Modal - Fullscreen */}
            {isMobileModalOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between shadow-lg flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">
                                🤖
                            </div>
                            <div>
                                <div className="font-semibold text-white">Try Live Demo</div>
                                <div className="text-purple-100 text-sm">Powered by GPT-4o-mini</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMobileModalOpen(false)}
                            className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {demoMessages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${msg.role === "user"
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                    : "bg-white text-gray-900 shadow-sm border border-gray-200"
                                    }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-200 p-4 safe-area-bottom flex-shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={demoInput}
                                onChange={(e) => setDemoInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleDemoMessage(demoInput)}
                                placeholder="Ask about pricing..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                            <button
                                onClick={() => handleDemoMessage(demoInput)}
                                disabled={isTyping}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
