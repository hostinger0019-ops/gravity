"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scale,
    Shield,
    Lock,
    Server,
    FileText,
    CheckCircle2,
    ArrowRight,
    Menu,
    X,
    Sparkles,
    Database,
    Key,
    Eye,
    EyeOff,
    Cpu,
    HardDrive,
    CloudOff,
    Zap,
    Award,
    Clock,
    Users,
    TrendingUp,
    ChevronRight,
    Star,
    ShieldCheck,
    Download,
    Code2
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
        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/95 backdrop-blur-xl border-b border-amber-500/20" : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500 blur-lg opacity-50 rounded-lg"></div>
                                <Scale className="w-9 h-9 text-amber-400 relative" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                                    LegalAI Secure
                                </span>
                                <p className="text-xs text-amber-300/70">Privacy-First Legal AI</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-300 hover:text-amber-400 transition-colors">Security</a>
                            <a href="#technology" className="text-slate-300 hover:text-amber-400 transition-colors">Technology</a>
                            <a href="#pricing" className="text-slate-300 hover:text-amber-400 transition-colors">Pricing</a>
                            <a href="#compliance" className="text-slate-300 hover:text-amber-400 transition-colors">Compliance</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/admin/chatbots" className="text-slate-300 hover:text-white transition-colors px-4 py-2">
                                Sign In
                            </Link>
                            <Link
                                href="/admin/chatbots"
                                className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all hover:scale-105"
                            >
                                Request Demo
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
                        className="md:hidden fixed top-20 left-0 right-0 z-40 bg-slate-950/98 backdrop-blur-xl border-b border-amber-500/20 p-6"
                    >
                        <nav className="flex flex-col gap-6">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Security</a>
                            <a href="#technology" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Technology</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Pricing</a>
                            <a href="#compliance" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Compliance</a>
                            <Link href="/admin/chatbots" className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold py-3 rounded-lg text-center">
                                Request Demo
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
                <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-amber-500/5 to-yellow-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-block mb-6"
                >
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-full px-6 py-2 inline-flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 font-medium">100% Private • Zero-Knowledge • Self-Hosted</span>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                    <span className="text-white">AI for Law Firms</span>
                    <br />
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        Your Data, Your Control
                    </span>
                    <br />
                    <span className="text-white">Complete Privacy</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
                >
                    Self-hosted AI with end-to-end encryption. Chat with your case files, contracts, and legal documents using open-source LLMs. Your data never leaves your servers. Even we can't access it.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                >
                    <Link
                        href="/admin/chatbots"
                        className="group bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-amber-500/50 transition-all hover:scale-105"
                    >
                        Request Private Demo
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#technology"
                        className="border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                    >
                        View Architecture
                    </a>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="flex flex-wrap justify-center gap-6 mb-16"
                >
                    <div className="flex items-center gap-2 text-slate-300">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-sm">AES-256 Encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-sm">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-sm">SOC 2 Type II</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-sm">GDPR Ready</span>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    <div className="text-center">
                        <div className="text-5xl md:text-6xl font-bold text-green-400 mb-2">100%</div>
                        <p className="text-slate-400">Private</p>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl md:text-6xl font-bold text-green-400 mb-2">0</div>
                        <p className="text-slate-400">Data Shared</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={256} prefix="AES-" />
                        <p className="text-slate-400 mt-2">Encryption</p>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">OSS</div>
                        <p className="text-slate-400 mt-2">Open Source</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Security Features
const SecurityFeatures = () => {
    const features = [
        {
            icon: <Lock className="w-8 h-8" />,
            title: "End-to-End Encryption",
            description: "Your documents are encrypted in your browser before upload. Only you have the decryption key. We never see your plaintext data - mathematically impossible.",
            gradient: "from-amber-500 to-yellow-500"
        },
        {
            icon: <Server className="w-8 h-8" />,
            title: "Self-Hosted Deployment",
            description: "Run the entire AI stack on your own servers. Your data never leaves your infrastructure. Complete control and compliance.",
            gradient: "from-yellow-500 to-orange-500"
        },
        {
            icon: <Download className="w-8 h-8" />,
            title: "Open-Source LLMs",
            description: "Deploy Llama 3, Mistral, or other open models locally. No data sent to OpenAI, Google, or any third party. Your assistant stays in-house.",
            gradient: "from-orange-500 to-red-500"
        },
        {
            icon: <Database className="w-8 h-8" />,
            title: "Private RAG System",
            description: "Chat with your case files, contracts, and precedents using Retrieval-Augmented Generation. All processing happens on your servers.",
            gradient: "from-amber-500 to-green-500"
        },
        {
            icon: <EyeOff className="w-8 h-8" />,
            title: "Zero-Knowledge Architecture",
            description: "We provide the software, you control the data. Zero-knowledge design means we cannot access your information even if we wanted to.",
            gradient: "from-green-500 to-teal-500"
        },
        {
            icon: <Key className="w-8 h-8" />,
            title: "Client-Side Key Management",
            description: "You manage your own encryption keys. Hardware Security Module (HSM) support for enterprise. Keys never leave your possession.",
            gradient: "from-teal-500 to-cyan-500"
        }
    ];

    return (
        <section id="features" className="relative py-24 px-6 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Bank-Grade Security</span>
                        <br />
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Built for Legal Compliance</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Attorney-client privilege protected with military-grade encryption
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
                            className="group bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all duration-300"
                        >
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <div className="text-white">
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

// Technology Stack
const TechnologyStack = () => {
    return (
        <section id="technology" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        How It <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        Enterprise-grade AI infrastructure you control completely
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <CloudOff className="w-8 h-8 text-amber-400" />
                            Deployment Options
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Self-Hosted (Recommended)</p>
                                    <p className="text-slate-400 text-sm">Run on your own servers - AWS, Azure, Google Cloud, or on-premises</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Docker/Kubernetes</p>
                                    <p className="text-slate-400 text-sm">Containerized deployment with auto-scaling and load balancing</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Air-Gapped Environments</p>
                                    <p className="text-slate-400 text-sm">Deploy in completely isolated networks with zero internet access</p>
                                </div>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-2xl p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Cpu className="w-8 h-8 text-green-400" />
                            Supported LLMs
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Llama 3.1 (70B/405B)</p>
                                    <p className="text-slate-400 text-sm">Meta's flagship open model - GPT-4 class performance</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Mistral (7B/8x7B)</p>
                                    <p className="text-slate-400 text-sm">Efficient and powerful - perfect for document analysis</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Custom Fine-Tuned Models</p>
                                    <p className="text-slate-400 text-sm">Train on your firm's historical cases for specialized expertise</p>
                                </div>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Architecture Diagram */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8"
                >
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Security Architecture</h3>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="font-semibold text-white mb-2">1. Upload</h4>
                            <p className="text-slate-400 text-sm">Documents encrypted in browser with YOUR key</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                                <HardDrive className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="font-semibold text-white mb-2">2. Store</h4>
                            <p className="text-slate-400 text-sm">Encrypted blobs stored on YOUR servers</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                                <Cpu className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="font-semibold text-white mb-2">3. Process</h4>
                            <p className="text-slate-400 text-sm">Decrypted in-memory, processed by local LLM</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="font-semibold text-white mb-2">4. Deliver</h4>
                            <p className="text-slate-400 text-sm">Answers returned, memory cleared instantly</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Use Cases
const UseCases = () => {
    const cases = [
        { icon: <FileText />, title: "Case Research", description: "Chat with case law, precedents, and legal briefs" },
        { icon: <Users />, title: "Contract Analysis", description: "Review and analyze contracts with AI assistance" },
        { icon: <Database />, title: "Discovery Search", description: "Search through thousands of discovery documents instantly" },
        { icon: <Award />, title: "Memo Drafting", description: "Generate legal memos based on your research" }
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
                        Built for <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Legal Professionals</span>
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
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-amber-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
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

// Pricing
const Pricing = () => {
    const plans = [
        {
            name: "Solo Practitioner",
            price: "$499",
            period: "/month",
            description: "Self-hosted, full privacy",
            features: [
                "Self-hosted deployment",
                "End-to-end encryption",
                "Open-source LLM (Llama 3)",
                "Unlimited documents",
                "Priority email support",
                "Compliance documentation",
                "Regular security updates"
            ],
            highlighted: false
        },
        {
            name: "Law Firm",
            price: "$1,499",
            period: "/month",
            description: "For small to mid-size firms",
            features: [
                "Everything in Solo, plus:",
                "Multi-user support (unlimited)",
                "Advanced RAG system",
                "Custom model fine-tuning",
                "Dedicated support team",
                "SOC 2 compliance package",
                "SSO/SAML integration",
                "API access"
            ],
            highlighted: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "For large firms & corporations",
            features: [
                "Everything in Law Firm, plus:",
                "White-label solution",
                "Dedicated infrastructure",
                "Custom SLA",
                "On-site training",
                "HSM key management",
                "24/7 phone support"
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
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Transparent Pricing</span>
                    </h2>
                    <p className="text-xl text-slate-400">One-time setup fee + monthly license</p>
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
                                ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500 shadow-2xl shadow-amber-500/20 scale-105"
                                : "bg-slate-800/50 border-slate-700"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
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
                                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:shadow-lg hover:shadow-amber-500/50"
                                    : "bg-white text-slate-900 hover:bg-slate-200"
                                    }`}
                            >
                                Request Demo
                            </Link>
                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
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

// Compliance
const Compliance = () => {
    const standards = [
        { name: "ABA Model Rules", description: "Attorney-client privilege protection" },
        { name: "HIPAA", description: "Health information security" },
        { name: "SOC 2 Type II", description: "Security and availability controls" },
        { name: "GDPR", description: "EU data protection compliance" },
        { name: "ISO 27001", description: "Information security management" },
        { name: "AES-256", description: "Military-grade encryption" }
    ];

    return (
        <section id="compliance" className="relative py-24 px-6 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Enterprise <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Compliance</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {standards.map((standard, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center hover:border-amber-500/30 transition-all"
                        >
                            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">{standard.name}</h3>
                            <p className="text-slate-400 text-sm">{standard.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// CTA
const CTA = () => {
    return (
        <section className="relative py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-3xl p-12 overflow-hidden"
                >
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            Ready for <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Complete Privacy</span>?
                        </h2>
                        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            Join 400+ law firms protecting client data with self-hosted AI
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/admin/chatbots"
                                className="group bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-amber-500/50 transition-all hover:scale-105"
                            >
                                Schedule Private Demo
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#technology"
                                className="border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all"
                            >
                                View Architecture
                            </a>
                        </div>
                        <p className="text-slate-400 text-sm mt-6">
                            <ShieldCheck className="w-4 h-4 inline mr-1 text-green-400" />
                            Your data never leaves your servers • Zero-knowledge design • Open source
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
                            <Scale className="w-6 h-6 text-amber-400" />
                            <span className="text-xl font-bold text-white">LegalAI Secure</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Privacy-first AI for law firms
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#features" className="hover:text-amber-400 transition-colors">Security</a></li>
                            <li><a href="#technology" className="hover:text-amber-400 transition-colors">Technology</a></li>
                            <li><a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Resources</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-amber-400 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-amber-400 transition-colors">Deployment Guide</a></li>
                            <li><a href="#" className="hover:text-amber-400 transition-colors">Security Whitepaper</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} LegalAI Secure. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// Main Component
export default function LegalPage() {
    return (
        <div className="bg-slate-950 text-slate-200 min-h-screen">
            <Header />
            <main>
                <Hero />
                <SecurityFeatures />
                <TechnologyStack />
                <UseCases />
                <Pricing />
                <Compliance />
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
