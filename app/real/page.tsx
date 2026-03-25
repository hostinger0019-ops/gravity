"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Home,
    Key,
    MapPin,
    Calendar,
    TrendingUp,
    Users,
    MessageCircle,
    Clock,
    Award,
    CheckCircle2,
    ArrowRight,
    Menu,
    X,
    Building,
    Phone,
    Mail,
    DollarSign,
    Search,
    Star,
    Video,
    FileText,
    Briefcase,
    ChevronRight,
    Sparkles
} from "lucide-react";

// Animated Counter
const AnimatedCounter = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
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
        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {prefix}{count}{suffix}
        </span>
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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/95 backdrop-blur-xl border-b border-blue-500/20" : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-lg opacity-50 rounded-lg"></div>
                                <Building2 className="w-9 h-9 text-blue-400 relative" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                    RealEstate AI
                                </span>
                                <p className="text-xs text-blue-300/70">Smart Property Solutions</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-300 hover:text-blue-400 transition-colors">Features</a>
                            <a href="#benefits" className="text-slate-300 hover:text-blue-400 transition-colors">Benefits</a>
                            <a href="#pricing" className="text-slate-300 hover:text-blue-400 transition-colors">Pricing</a>
                            <a href="#testimonials" className="text-slate-300 hover:text-blue-400 transition-colors">Testimonials</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/admin/chatbots" className="text-slate-300 hover:text-white transition-colors px-4 py-2">
                                Sign In
                            </Link>
                            <Link
                                href="/admin/chatbots"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
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
                        className="md:hidden fixed top-20 left-0 right-0 z-40 bg-slate-950/98 backdrop-blur-xl border-b border-blue-500/20 p-6"
                    >
                        <nav className="flex flex-col gap-6">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400">Features</a>
                            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400">Benefits</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400">Pricing</a>
                            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400">Testimonials</a>
                            <Link href="/admin/chatbots" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg text-center">
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
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-block mb-6"
                >
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-full px-6 py-2 inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">AI-Powered Real Estate Solutions</span>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                    <span className="text-white">Revolutionize Your</span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Real Estate Business
                    </span>
                    <br />
                    <span className="text-white">with AI Agents</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
                >
                    24/7 intelligent lead qualification, instant property information, automated appointment scheduling, and personalized client interactions. Close 50% more deals with AI.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                    <Link
                        href="/admin/chatbots"
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#demo"
                        className="border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                    >
                        Watch Demo
                    </a>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    <div className="text-center">
                        <AnimatedCounter value={50} suffix="%" />
                        <p className="text-slate-400 mt-2">More Closings</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={24} suffix="/7" />
                        <p className="text-slate-400 mt-2">Availability</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={70} suffix="%" />
                        <p className="text-slate-400 mt-2">Time Saved</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={10} suffix="x" />
                        <p className="text-slate-400 mt-2">Lead Response</p>
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
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Instant Lead Qualification",
            description: "AI automatically qualifies leads by asking the right questions about budget, timeline, and preferences. No more wasting time on tire-kickers.",
            gradient: "from-blue-500 to-indigo-500"
        },
        {
            icon: <Calendar className="w-8 h-8" />,
            title: "Smart Scheduling",
            description: "Automated appointment booking synced with your calendar. AI handles rescheduling, reminders, and follow-ups automatically.",
            gradient: "from-indigo-500 to-purple-500"
        },
        {
            icon: <Search className="w-8 h-8" />,
            title: "Property Recommendations",
            description: "AI matches clients with perfect properties based on their criteria. Intelligent search across your entire portfolio with instant answers.",
            gradient: "from-purple-500 to-pink-500"
        },
        {
            icon: <Video className="w-8 h-8" />,
            title: "Virtual Tour Coordination",
            description: "Schedule virtual tours, send property videos, and answer questions about amenities, location, and pricing in real-time.",
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: "Document Assistance",
            description: "Guide clients through paperwork, answer questions about contracts, and ensure all required documents are collected.",
            gradient: "from-cyan-500 to-teal-500"
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: "Market Insights",
            description: "Provide instant market data, neighborhood info, pricing trends, and investment analysis to help clients make informed decisions.",
            gradient: "from-teal-500 to-green-500"
        }
    ];

    return (
        <section id="features" className="relative py-24 px-6 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Everything You Need to</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Dominate Real Estate</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Powerful AI features designed specifically for real estate professionals
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
                            className="group bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <div className={`text-white`}>
                                    {feature.icon}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.description}</p>
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
        {
            icon: <Users />,
            title: "Qualify More Leads",
            description: "Handle 100+ conversations simultaneously",
            stat: "10x faster"
        },
        {
            icon: <Clock />,
            title: "Save Time",
            description: "Automate repetitive questions and scheduling",
            stat: "70% saved"
        },
        {
            icon: <DollarSign />,
            title: "Increase Revenue",
            description: "Never miss a lead, respond instantly 24/7",
            stat: "+50% deals"
        },
        {
            icon: <Award />,
            title: "Enhance Experience",
            description: "Professional, consistent client interactions",
            stat: "95% satisfaction"
        }
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
                        Why Top Realtors <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Choose Us</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Join thousands of successful real estate professionals
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-6 text-center hover:shadow-xl hover:shadow-blue-500/20 transition-all overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform">
                                    {benefit.icon}
                                </div>
                                <div className="text-3xl font-bold text-blue-400 mb-2">{benefit.stat}</div>
                                <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                                <p className="text-slate-400 text-sm">{benefit.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Use Cases
const UseCases = () => {
    const cases = [
        {
            icon: <Home />,
            title: "Residential Sales",
            description: "Help buyers find their dream home with intelligent property matching and instant answers"
        },
        {
            icon: <Building />,
            title: "Commercial Real Estate",
            description: "Qualify business clients, provide market analysis, and coordinate property viewings"
        },
        {
            icon: <Key />,
            title: "Property Management",
            description: "Handle tenant inquiries, maintenance requests, and lease information 24/7"
        },
        {
            icon: <Briefcase />,
            title: "Real Estate Investment",
            description: "Provide ROI analysis, market trends, and investment opportunities to investors"
        }
    ];

    return (
        <section className="relative py-24 px-6 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Perfect for <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Every Real Estate Need</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cases.map((useCase, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                                {useCase.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                            <p className="text-slate-400 text-sm">{useCase.description}</p>
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
            name: "Solo Agent",
            price: "₹1,499",
            period: "/month",
            description: "Perfect for individual agents",
            features: [
                "2,000 conversations/month",
                "Lead qualification",
                "Appointment scheduling",
                "Property recommendations",
                "Email support"
            ],
            highlighted: false
        },
        {
            name: "Team",
            price: "₹3,999",
            period: "/month",
            description: "For small to medium teams",
            features: [
                "10,000 conversations/month",
                "Multi-agent support",
                "CRM integration",
                "Advanced analytics",
                "Priority support",
                "Custom branding"
            ],
            highlighted: true
        },
        {
            name: "Agency",
            price: "Custom",
            period: "",
            description: "For large agencies & brokerages",
            features: [
                "Unlimited conversations",
                "White-label solution",
                "Dedicated account manager",
                "Custom AI training",
                "API access",
                "SLA guarantee"
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
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Flexible Pricing</span> for Every Size
                    </h2>
                    <p className="text-xl text-slate-400">Invest in growth, not overhead</p>
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
                                    ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105"
                                    : "bg-slate-800/50 border-slate-700"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <p className="text-slate-400 mb-6">{plan.description}</p>
                            <div className="mb-6">
                                <span className="text-5xl font-bold text-white">{plan.price}</span>
                                <span className="text-slate-400">{plan.period}</span>
                            </div>
                            <Link
                                href="/admin/chatbots"
                                className={`w-full block text-center font-semibold py-4 rounded-lg mb-6 transition-all ${plan.highlighted
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/50"
                                        : "bg-white text-slate-900 hover:bg-slate-200"
                                    }`}
                            >
                                Get Started
                            </Link>
                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
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
            name: "Sarah Mitchell",
            role: "Top Producer, Luxury Homes Realty",
            image: "SM",
            quote: "This AI agent has transformed my business. I'm closing 60% more deals and spending less time on calls. It's like having a full-time assistant that never sleeps.",
            rating: 5
        },
        {
            name: "David Chen",
            role: "Managing Broker, Metro Properties",
            image: "DC",
            quote: "Our team went from handling 50 leads/month to 200+ without hiring more staff. The ROI is incredible. Best investment we've made.",
            rating: 5
        },
        {
            name: "Jessica Rodriguez",
            role: "Commercial Real Estate Advisor",
            image: "JR",
            quote: "The lead qualification alone is worth 10x the price. I only talk to serious buyers now. My conversion rate has doubled.",
            rating: 5
        }
    ];

    return (
        <section id="testimonials" className="relative py-24 px-6 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        What <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Top Agents</span> Say
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
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {testimonial.image}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{testimonial.name}</p>
                                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                                </div>
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
                    className="relative bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/50 rounded-3xl p-12 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            Ready to <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Close More Deals</span>?
                        </h2>
                        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            Join 1,000+ real estate professionals using AI to transform their business
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/admin/chatbots"
                                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
                            >
                                Start Your Free Trial
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#pricing"
                                className="border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all"
                            >
                                View Pricing
                            </a>
                        </div>
                        <p className="text-slate-400 text-sm mt-6">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            No credit card required • 14-day free trial • Cancel anytime
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Footer
const Footer = () => {
    return (
        <footer className="border-t border-slate-800 bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="w-6 h-6 text-blue-400" />
                            <span className="text-xl font-bold text-white">RealEstate AI</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            AI-powered solutions for modern real estate professionals
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                            <li><a href="#testimonials" className="hover:text-blue-400 transition-colors">Testimonials</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} RealEstate AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// Main Component
export default function RealEstatePage() {
    return (
        <div className="bg-slate-950 text-slate-200 min-h-screen">
            <Header />
            <main>
                <Hero />
                <Features />
                <Benefits />
                <UseCases />
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
