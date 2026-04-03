"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UtensilsCrossed,
    ChefHat,
    Calendar,
    Clock,
    Users,
    MessageCircle,
    Star,
    TrendingUp,
    Phone,
    Menu as MenuIcon,
    X,
    ShoppingBag,
    MapPin,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Coffee,
    Pizza,
    Wine,
    IceCream,
    ChevronRight,
    Zap,
    Shield,
    DollarSign,
    BarChart3
} from "lucide-react";

// Animated Stats
const AnimatedStat = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
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
        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            {prefix}{count}{suffix}
        </span>
    );
};

// Header
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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-stone-950/95 backdrop-blur-xl border-b border-orange-500/20" : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 blur-lg opacity-50 rounded-full"></div>
                                <ChefHat className="w-9 h-9 text-orange-400 relative" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                                    Restaurant AI
                                </span>
                                <p className="text-xs text-orange-300/70">Smart Dining Solutions</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-stone-300 hover:text-orange-400 transition-colors">Features</a>
                            <a href="#benefits" className="text-stone-300 hover:text-orange-400 transition-colors">Benefits</a>
                            <a href="#pricing" className="text-stone-300 hover:text-orange-400 transition-colors">Pricing</a>
                            <a href="#demo" className="text-stone-300 hover:text-orange-400 transition-colors">Demo</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/admin/chatbots" className="text-stone-300 hover:text-white transition-colors px-4 py-2">
                                Sign In
                            </Link>
                            <Link
                                href="/admin/chatbots"
                                className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all hover:scale-105"
                            >
                                Start Free Trial
                            </Link>
                        </div>

                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
                            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
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
                        className="md:hidden fixed top-20 left-0 right-0 z-40 bg-stone-950/98 backdrop-blur-xl border-b border-orange-500/20 p-6"
                    >
                        <nav className="flex flex-col gap-6">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-stone-300 hover:text-orange-400">Features</a>
                            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="text-stone-300 hover:text-orange-400">Benefits</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-stone-300 hover:text-orange-400">Pricing</a>
                            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-stone-300 hover:text-orange-400">Demo</a>
                            <Link href="/admin/chatbots" className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold py-3 rounded-lg text-center">
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
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-block mb-6"
                >
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-full px-6 py-2 inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 font-medium">AI-Powered Restaurant Solutions</span>
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
                    <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                        Restaurant Experience
                    </span>
                    <br />
                    <span className="text-white">with AI Agents</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-stone-400 mb-10 max-w-3xl mx-auto leading-relaxed"
                >
                    24/7 automated reservations, instant menu questions, order taking, and personalized recommendations. Increase revenue by 35% while reducing staff workload by 60%.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                    <Link
                        href="/admin/chatbots"
                        className="group bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-orange-500/50 transition-all hover:scale-105"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#demo"
                        className="border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                    >
                        See Demo
                    </a>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    <div className="text-center">
                        <AnimatedStat value={35} suffix="%" />
                        <p className="text-stone-400 mt-2">Revenue Increase</p>
                    </div>
                    <div className="text-center">
                        <AnimatedStat value={24} suffix="/7" />
                        <p className="text-stone-400 mt-2">Availability</p>
                    </div>
                    <div className="text-center">
                        <AnimatedStat value={60} suffix="%" />
                        <p className="text-stone-400 mt-2">Staff Time Saved</p>
                    </div>
                    <div className="text-center">
                        <AnimatedStat value={95} suffix="%" />
                        <p className="text-stone-400 mt-2">Guest Satisfaction</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Features Section
const Features = () => {
    const features = [
        {
            icon: <Calendar className="w-8 h-8" />,
            title: "Smart Reservations",
            description: "Automated table booking with real-time availability, waitlist management, and confirmation reminders. Never miss a reservation again.",
            color: "orange"
        },
        {
            icon: <MenuIcon className="w-8 h-8" />,
            title: "Menu Intelligence",
            description: "Answer questions about ingredients, allergens, dietary restrictions, and dish recommendations instantly. Upsell premium items automatically.",
            color: "red"
        },
        {
            icon: <ShoppingBag className="w-8 h-8" />,
            title: "Online Ordering",
            description: "Take orders for delivery and pickup through your website, social media, and phone. Process payments and send order confirmations.",
            color: "amber"
        },
        {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Customer Support",
            description: "Handle inquiries about hours, location, parking, special events, and group reservations. Provide instant answers 24/7.",
            color: "orange"
        },
        {
            icon: <Star className="w-8 h-8" />,
            title: "Loyalty & Feedback",
            description: "Collect reviews, manage loyalty programs, send personalized offers, and gather valuable customer feedback automatically.",
            color: "red"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Analytics Dashboard",
            description: "Track bookings, popular dishes, peak hours, customer preferences, and revenue trends. Make data-driven decisions.",
            color: "amber"
        }
    ];

    return (
        <section id="features" className="relative py-24 px-6 bg-stone-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Everything Your Restaurant</span>
                        <br />
                        <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Needs to Thrive</span>
                    </h2>
                    <p className="text-xl text-stone-400 max-w-2xl mx-auto">
                        Powerful AI features designed for modern restaurants
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
                            className="group bg-stone-800/50 border border-stone-700 rounded-2xl p-8 hover:border-orange-500/50 hover:bg-stone-800/80 transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-${feature.color}-400`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                            <p className="text-stone-400 leading-relaxed">{feature.description}</p>
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
        { icon: <TrendingUp />, title: "Increase Revenue", value: "35% more sales with AI upselling & recommendations", stat: "+35%" },
        { icon: <Clock />, title: "Save Time", value: "60% reduction in phone calls and manual bookings", stat: "60% saved" },
        { icon: <Users />, title: "Better Service", value: "Handle 10x more customers simultaneously", stat: "10x capacity" },
        { icon: <Shield />, title: "Never Close", value: "Accept orders & reservations 24/7/365", stat: "24/7/365" }
    ];

    return (
        <section id="benefits" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Why Restaurants <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Love Us</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6 text-center hover:shadow-xl hover:shadow-orange-500/20 transition-all"
                        >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center mx-auto mb-4 text-white">
                                {benefit.icon}
                            </div>
                            <div className="text-3xl font-bold text-orange-400 mb-2">{benefit.stat}</div>
                            <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                            <p className="text-stone-400 text-sm">{benefit.value}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Restaurant Types
const RestaurantTypes = () => {
    const types = [
        { icon: <Coffee />, title: "Cafés & Bistros", description: "Quick orders, loyalty programs, and daily specials" },
        { icon: <Pizza />, title: "Fast Casual", description: "Online ordering, delivery coordination, and menu customization" },
        { icon: <Wine />, title: "Fine Dining", description: "Premium reservations, wine pairing suggestions, and VIP management" },
        { icon: <IceCream />, title: "Dessert Shops", description: "Custom orders, seasonal menu updates, and catering inquiries" }
    ];

    return (
        <section className="relative py-24 px-6 bg-stone-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Perfect for <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Every Type of Restaurant</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {types.map((type, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-stone-800/50 border border-stone-700 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4 text-orange-400 group-hover:scale-110 transition-transform">
                                {type.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
                            <p className="text-stone-400 text-sm">{type.description}</p>
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
            price: "$49",
            period: "/month",
            description: "Perfect for small restaurants",
            features: [
                "1,000 conversations/month",
                "Basic reservations",
                "Menu Q&A",
                "Email support",
                "Simple analytics"
            ],
            highlighted: false
        },
        {
            name: "Professional",
            price: "$149",
            period: "/month",
            description: "For growing restaurants",
            features: [
                "5,000 conversations/month",
                "Advanced reservations",
                "Online ordering",
                "Priority support",
                "Full analytics",
                "Custom branding"
            ],
            highlighted: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "For restaurant chains",
            features: [
                "Unlimited conversations",
                "Multi-location support",
                "White-label solution",
                "Dedicated account manager",
                "API access",
                "Custom integration"
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
                        Simple, <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Affordable Pricing</span>
                    </h2>
                    <p className="text-xl text-stone-400">Choose the plan that fits your restaurant</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className={`rounded-2xl p-8 border ${plan.highlighted
                                    ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500 shadow-2xl shadow-orange-500/20 scale-105"
                                    : "bg-stone-800/50 border-stone-700"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <p className="text-stone-400 mb-6">{plan.description}</p>
                            <div className="mb-6">
                                <span className="text-5xl font-bold text-white">{plan.price}</span>
                                <span className="text-stone-400">{plan.period}</span>
                            </div>
                            <Link
                                href="/admin/chatbots"
                                className={`w-full block text-center font-semibold py-4 rounded-lg mb-6 transition-all ${plan.highlighted
                                        ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/50"
                                        : "bg-white text-stone-900 hover:bg-stone-200"
                                    }`}
                            >
                                Get Started
                            </Link>
                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-stone-300">
                                        <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
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

// Testimonials
const Testimonials = () => {
    const testimonials = [
        {
            name: "Marco Rossi",
            role: "Owner, Bella Italia",
            quote: "Our reservation no-shows dropped by 80% and we're taking 3x more online orders. This AI is like having a full-time host and order taker!",
            rating: 5
        },
        {
            name: "Sarah Kim",
            role: "Manager, Seoul Kitchen",
            quote: "We went from answering 100+ calls daily to almost zero. The AI handles everything perfectly. Staff can focus on cooking and service.",
            rating: 5
        },
        {
            name: "Jean-Pierre Dubois",
            role: "Chef & Owner, Le Gourmet",
            quote: "The AI knows our wine list better than some sommeliers! It makes excellent pairing suggestions and upsells desserts beautifully.",
            rating: 5
        }
    ];

    return (
        <section className="relative py-24 px-6 bg-stone-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        What <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Restaurant Owners</span> Say
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="bg-stone-800/50 border border-stone-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-stone-300 mb-6 italic">"{testimonial.quote}"</p>
                            <div>
                                <p className="font-semibold text-white">{testimonial.name}</p>
                                <p className="text-stone-400 text-sm">{testimonial.role}</p>
                            </div>
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
                    className="relative bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-3xl p-12 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            Ready to <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Serve More Guests</span>?
                        </h2>
                        <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
                            Join 2,500+ restaurants using AI to transform their customer experience
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/admin/chatbots"
                                className="group bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-orange-500/50 transition-all hover:scale-105"
                            >
                                Start Your Free Trial
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#pricing"
                                className="border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all"
                            >
                                View Pricing
                            </a>
                        </div>
                        <p className="text-stone-400 text-sm mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Footer
const Footer = () => {
    return (
        <footer className="border-t border-stone-800 bg-stone-900/50">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ChefHat className="w-6 h-6 text-orange-400" />
                            <span className="text-xl font-bold text-white">Restaurant AI</span>
                        </div>
                        <p className="text-stone-400 text-sm">
                            AI-powered solutions for modern restaurants
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-stone-400 text-sm">
                            <li><a href="#features" className="hover:text-orange-400 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                            <li><a href="#demo" className="hover:text-orange-400 transition-colors">Demo</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-2 text-stone-400 text-sm">
                            <li><a href="#" className="hover:text-orange-400 transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-orange-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-orange-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-stone-400 text-sm">
                            <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-orange-400 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-stone-800 text-center text-stone-400 text-sm">
                    <p>© {new Date().getFullYear()} Restaurant AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// Main Component
export default function RestaurantPage() {
    return (
        <div className="bg-stone-950 text-stone-200 min-h-screen">
            <Header />
            <main>
                <Hero />
                <Features />
                <Benefits />
                <RestaurantTypes />
                <Pricing />
                <Testimonials />
                <CTA />
            </main>
            <Footer />

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
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
