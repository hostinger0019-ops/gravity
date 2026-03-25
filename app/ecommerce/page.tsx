"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    ShoppingCart,
    TrendingUp,
    Users,
    MessageCircle,
    Clock,
    Package,
    Zap,
    BarChart3,
    Check,
    ArrowRight,
    Sparkles,
    Star,
    Menu,
    X,
    Search,
    Heart,
    CreditCard,
    Truck,
    Shield,
    ChevronRight
} from "lucide-react";

// Animated Stats Component
const AnimatedStat = ({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 2000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div className="text-center">
            <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-4xl md:text-5xl font-bold text-white mb-2"
            >
                {count}{suffix}
            </motion.div>
            <p className="text-zinc-400">{label}</p>
        </div>
    );
};

// Header Component
const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-emerald-500/20" : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-lg opacity-50 rounded-full"></div>
                                <ShoppingCart className="w-8 h-8 text-emerald-400 relative" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                E-Commerce AI
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-zinc-300 hover:text-emerald-400 transition-colors">Features</a>
                            <a href="#benefits" className="text-zinc-300 hover:text-emerald-400 transition-colors">Benefits</a>
                            <a href="#pricing" className="text-zinc-300 hover:text-emerald-400 transition-colors">Pricing</a>
                            <a href="#demo" className="text-zinc-300 hover:text-emerald-400 transition-colors">Demo</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/admin/chatbots" className="text-zinc-300 hover:text-white transition-colors px-4 py-2">
                                Sign In
                            </Link>
                            <Link
                                href="/admin/chatbots"
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
                            >
                                Start Free Trial
                            </Link>
                        </div>

                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden fixed top-20 left-0 right-0 z-40 bg-[#0f0f0f]/98 backdrop-blur-xl border-b border-emerald-500/20 p-6"
                    >
                        <nav className="flex flex-col gap-6 text-center">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-emerald-400 transition-colors">Features</a>
                            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-emerald-400 transition-colors">Benefits</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-emerald-400 transition-colors">Pricing</a>
                            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-emerald-400 transition-colors">Demo</a>
                            <Link href="/admin/chatbots" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 rounded-lg">
                                Start Free Trial
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Hero Section
const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-block mb-6"
                >
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-2 inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">AI-Powered E-Commerce Solutions</span>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                    <span className="text-white">Transform Your</span>
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        E-Commerce Business
                    </span>
                    <br />
                    <span className="text-white">with AI Agents</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto"
                >
                    24/7 intelligent customer support, automated sales, and personalized shopping experiences. Boost conversions by 40% and reduce support costs by 60%.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Link
                        href="/admin/chatbots"
                        className="group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#demo"
                        className="border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                    >
                        Watch Demo
                    </a>
                </motion.div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    <AnimatedStat value={40} label="Conversion Increase" suffix="%" />
                    <AnimatedStat value={60} label="Cost Reduction" suffix="%" />
                    <AnimatedStat value={24} label="Hours Support" suffix="/7" />
                    <AnimatedStat value={95} label="Customer Satisfaction" suffix="%" />
                </motion.div>
            </div>
        </section>
    );
};

// Features Section
const Features = () => {
    const features = [
        {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "24/7 Customer Support",
            description: "Instant responses to customer queries about products, orders, shipping, and returns. Never lose a sale due to delayed responses.",
            color: "emerald"
        },
        {
            icon: <Search className="w-8 h-8" />,
            title: "Smart Product Recommendations",
            description: "AI analyzes customer preferences and browsing history to suggest perfect products, increasing average order value by 30%.",
            color: "teal"
        },
        {
            icon: <ShoppingCart className="w-8 h-8" />,
            title: "Abandoned Cart Recovery",
            description: "Automatically engage shoppers who leave items in cart with personalized messages and offers. Recover up to 25% of lost sales.",
            color: "cyan"
        },
        {
            icon: <Package className="w-8 h-8" />,
            title: "Order Tracking",
            description: "Customers can check order status, shipping updates, and delivery estimates instantly without human intervention.",
            color: "emerald"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Sales Analytics",
            description: "Real-time insights into customer behavior, popular products, and sales trends to optimize your inventory and marketing.",
            color: "teal"
        },
        {
            icon: <Heart className="w-8 h-8" />,
            title: "Personalized Shopping",
            description: "Create unique experiences for each customer with AI-driven personalization based on their preferences and purchase history.",
            color: "cyan"
        }
    ];

    return (
        <section id="features" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Powerful Features for</span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Modern E-Commerce</span>
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Everything you need to automate customer interactions and boost sales
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-${feature.color}-400`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                            <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Benefits Section
const Benefits = () => {
    const benefits = [
        { icon: <TrendingUp />, title: "Increase Sales", value: "40% more conversions with instant, personalized support" },
        { icon: <Clock />, title: "Save Time", value: "60% reduction in support tickets and manual responses" },
        { icon: <Users />, title: "Scale Effortlessly", value: "Handle 1000+ customers simultaneously without hiring" },
        { icon: <Zap />, title: "Instant Setup", value: "Go live in 5 minutes with zero coding required" }
    ];

    return (
        <section id="benefits" className="relative py-24 px-6 bg-zinc-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Why E-Commerce Brands <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Love Us</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6 text-center hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 text-white">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                            <p className="text-zinc-400 text-sm">{benefit.value}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Pricing Section
const Pricing = () => {
    const plans = [
        {
            name: "Starter",
            price: "₹999",
            period: "/month",
            description: "Perfect for small online stores",
            features: [
                "1,000 conversations/month",
                "Product recommendations",
                "Order tracking",
                "Email support",
                "Basic analytics"
            ],
            highlighted: false
        },
        {
            name: "Growth",
            price: "₹2,499",
            period: "/month",
            description: "For growing e-commerce businesses",
            features: [
                "5,000 conversations/month",
                "Advanced AI recommendations",
                "Abandoned cart recovery",
                "Priority support",
                "Advanced analytics",
                "Multi-language support"
            ],
            highlighted: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "For large-scale operations",
            features: [
                "Unlimited conversations",
                "Custom AI training",
                "Dedicated account manager",
                "White-label solution",
                "API access",
                "Custom integrations"
            ],
            highlighted: false
        }
    ];

    return (
        <section id="pricing" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Simple, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Transparent Pricing</span>
                    </h2>
                    <p className="text-xl text-zinc-400">Choose the plan that fits your business needs</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className={`rounded-2xl p-8 border ${plan.highlighted
                                    ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500 shadow-xl shadow-emerald-500/20"
                                    : "bg-zinc-900/50 border-zinc-800"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <p className="text-zinc-400 mb-6">{plan.description}</p>
                            <div className="mb-6">
                                <span className="text-5xl font-bold text-white">{plan.price}</span>
                                <span className="text-zinc-400">{plan.period}</span>
                            </div>
                            <Link
                                href="/admin/chatbots"
                                className={`w-full block text-center font-semibold py-4 rounded-lg mb-6 transition-all ${plan.highlighted
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/50"
                                        : "bg-white text-black hover:bg-zinc-200"
                                    }`}
                            >
                                Get Started
                            </Link>
                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-zinc-300">
                                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Use Cases Section
const UseCases = () => {
    const cases = [
        {
            icon: <ShoppingCart />,
            title: "Fashion & Apparel",
            description: "Style recommendations, size guides, and outfit suggestions"
        },
        {
            icon: <Package />,
            title: "Electronics",
            description: "Technical specifications, product comparisons, and warranty info"
        },
        {
            icon: <Heart />,
            title: "Beauty & Cosmetics",
            description: "Product matching, ingredient information, and usage tips"
        },
        {
            icon: <Truck />,
            title: "Food & Grocery",
            description: "Recipe suggestions, dietary restrictions, and delivery tracking"
        }
    ];

    return (
        <section className="relative py-24 px-6 bg-zinc-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Perfect for <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Any E-Commerce Niche</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cases.map((useCase, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                                {useCase.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                            <p className="text-zinc-400 text-sm">{useCase.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// CTA Section
const CTA = () => {
    return (
        <section className="relative py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-3xl p-12 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            Ready to <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">10x Your Sales</span>?
                        </h2>
                        <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                            Join 500+ e-commerce brands already using AI to transform their customer experience
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/admin/chatbots"
                                className="group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105"
                            >
                                Start Your Free Trial
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#pricing"
                                className="border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all"
                            >
                                View Pricing
                            </a>
                        </div>
                        <p className="text-zinc-400 text-sm mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Footer
const Footer = () => {
    return (
        <footer className="border-t border-zinc-800 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="w-6 h-6 text-emerald-400" />
                            <span className="text-xl font-bold text-white">E-Commerce AI</span>
                        </div>
                        <p className="text-zinc-400 text-sm">
                            AI-powered chatbots for modern e-commerce businesses
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-zinc-400 text-sm">
                            <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
                            <li><a href="#demo" className="hover:text-emerald-400 transition-colors">Demo</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-2 text-zinc-400 text-sm">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-zinc-400 text-sm">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-zinc-800 text-center text-zinc-400 text-sm">
                    <p>© {new Date().getFullYear()} E-Commerce AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// Main Component
export default function EcommercePage() {
    return (
        <div className="bg-[#0a0a0a] text-zinc-200 min-h-screen">
            <Header />
            <main>
                <Hero />
                <Features />
                <Benefits />
                <UseCases />
                <Pricing />
                <CTA />
            </main>
            <Footer />

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        html {
          scroll-behavior: smooth;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
        </div>
    );
}
