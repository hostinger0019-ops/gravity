"use client";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    ArrowRight,
    CheckCircle2,
    Menu,
    X,
    Sparkles,
    ChevronRight,
    ChevronDown,
    Shield,
    Code2,
    Palette,
    MessageSquare,
    FileText,
    Send,
    ShoppingCart,
    Mic,
    BarChart3,
    Globe,
    Users,
    Laptop,
    Rocket,
    TrendingUp,
    DollarSign,
    Clock,
    Bot,
    Star,
    BadgeCheck,
} from "lucide-react";

/* ═══ Animated Counter ═══ */
const AnimCounter = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 2000;
        const inc = end / (duration / 16);
        const timer = setInterval(() => {
            start += inc;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return (
        <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
};

/* ═══ Header ═══ */
const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-violet-500/20" : "bg-transparent"}`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-lg opacity-50 rounded-lg" />
                                <Zap className="w-8 h-8 text-violet-400 relative" />
                            </div>
                            <div>
                                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Agent Forja</span>
                                <p className="text-[10px] text-violet-300/60">Lifetime Deal</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-zinc-400 hover:text-violet-400 transition-colors text-sm">Features</a>
                            <a href="#how" className="text-zinc-400 hover:text-violet-400 transition-colors text-sm">How It Works</a>
                            <a href="#pricing" className="text-zinc-400 hover:text-violet-400 transition-colors text-sm">Pricing</a>
                            <a href="/demo" className="text-zinc-400 hover:text-violet-400 transition-colors text-sm">Live Demo</a>
                            <a href="#faq" className="text-zinc-400 hover:text-violet-400 transition-colors text-sm">FAQ</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <a href="/demo" className="text-violet-400 hover:text-violet-300 transition-colors text-sm font-medium">Try Demo</a>
                            <a href="#pricing" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-violet-500/30 transition-all hover:scale-105 text-sm">
                                Get Lifetime Access
                            </a>
                        </div>

                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white">
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.header>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden fixed top-20 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-violet-500/20 p-6"
                    >
                        <nav className="flex flex-col gap-6">
                            <a href="#features" onClick={() => setMobileOpen(false)} className="text-zinc-300 hover:text-violet-400">Features</a>
                            <a href="#how" onClick={() => setMobileOpen(false)} className="text-zinc-300 hover:text-violet-400">How It Works</a>
                            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-zinc-300 hover:text-violet-400">Pricing</a>
                            <a href="/demo" onClick={() => setMobileOpen(false)} className="text-zinc-300 hover:text-violet-400">Live Demo</a>
                            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-zinc-300 hover:text-violet-400">FAQ</a>
                            <a href="#pricing" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold py-3 rounded-lg text-center">
                                Get Lifetime Access
                            </a>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

/* ═══ Hero — Split Layout ═══ */
const Hero = () => (
    <section className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-fuchsia-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/5 to-cyan-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left — Text */}
                <div>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-block mb-8">
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-full px-5 py-2 inline-flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-rose-400" />
                            <span className="text-rose-400 font-medium text-sm">Limited — Only 100 Deals Available</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                        className="text-5xl md:text-7xl font-bold mb-6 leading-[0.95] tracking-tight"
                    >
                        <span className="text-white">Build AI Chatbots.</span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                            Sell as Your Own.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-lg text-zinc-400 mb-10 max-w-lg leading-relaxed"
                    >
                        White-label AI chatbot platform for agencies and freelancers. Create bots for your clients, embed on their websites, charge them monthly — keep 100% of the revenue.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="mb-8">
                        <div className="flex items-baseline gap-4 mb-1">
                            <span className="text-xl text-zinc-500 line-through">$588/yr</span>
                            <span className="text-6xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">$99</span>
                        </div>
                        <p className="text-zinc-500 text-sm">One-time payment · Lifetime access · Zero monthly fees</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <a
                            href="#pricing"
                            className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-4 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105"
                        >
                            Get Lifetime Access
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#how"
                            className="border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 text-center"
                        >
                            See How It Works
                        </a>
                    </motion.div>
                </div>

                {/* Right — Dashboard Mockup + Floating elements */}
                <motion.div
                    initial={{ opacity: 0, x: 60, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="relative hidden lg:block"
                >
                    {/* Main image */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/10">
                        <img src="/dashboard.png" alt="Agent Forja Dashboard" className="w-full h-auto" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    {/* Floating chat widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="absolute -bottom-6 -left-8 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                    >
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-white">Your Brand Bot</p>
                                <p className="text-[10px] text-emerald-400">● Online</p>
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="bg-white/5 border border-white/5 rounded-xl rounded-bl-sm px-3 py-2 text-xs text-zinc-300 max-w-[85%]">
                                Hi! 👋 How can I help you today?
                            </div>
                            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl rounded-br-sm px-3 py-2 text-xs text-white ml-auto max-w-[85%]">
                                Book a table for 2
                            </div>
                            <div className="flex gap-1 px-3 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0s" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0.15s" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating stats badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                        className="absolute -top-4 -right-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-3 shadow-xl"
                    >
                        <p className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">5,900%</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ROI</p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    </section>
);

/* ═══ Stats Bar ═══ */
const StatsBar = () => (
    <section className="border-y border-white/5 bg-zinc-950/50">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-8"
        >
            {[
                [7, "+", "", "Themes"],
                [2000, "", "", "Messages/mo"],
                [100, "%", "", "White-Label"],
                [0, "", "$", "Monthly Fees"],
                [5900, "%", "", "ROI"],
            ].map(([val, suf, pre, label]) => (
                <div key={label as string} className="text-center">
                    <AnimCounter value={val as number} suffix={suf as string} prefix={pre as string} />
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">{label as string}</p>
                </div>
            ))}
        </motion.div>
    </section>
);

/* ═══ How It Works ═══ */
const HowItWorks = () => {
    const steps = [
        { icon: <MessageSquare className="w-8 h-8" />, title: "Build with AI", desc: "Describe your client's business in plain English. Our AI creates a fully configured chatbot — greeting, knowledge base, lead capture, branding — in seconds." },
        { icon: <Code2 className="w-8 h-8" />, title: "Embed Anywhere", desc: "Copy a single line of code. Your client pastes it on their website. The chatbot appears as a premium floating widget — under their brand, not yours." },
        { icon: <DollarSign className="w-8 h-8" />, title: "Charge Monthly", desc: "Set your own price — $49, $99, $299/month. Handle billing however you prefer. You keep 100% of the revenue. No commission, no rev share." },
    ];

    return (
        <section id="how" className="relative py-24 px-6 bg-zinc-950/50">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">From Zero to Revenue</span><br />
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">in 10 Minutes</span>
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Build AI chatbots for your clients, deploy with one line of code, and start earning monthly.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-violet-500/40 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer"
                        >
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-violet-400">
                                {step.icon}
                            </div>
                            <div className="text-xs font-bold text-violet-400/60 uppercase tracking-widest mb-3">Step {i + 1}</div>
                            <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                            <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══ Features ═══ */
const Features = () => {
    const features = [
        { icon: <Bot className="w-7 h-7" />, title: "AI-Powered Builder", desc: "Describe the business. AI builds the bot, writes the greeting, configures everything automatically.", gradient: "from-violet-500 to-fuchsia-500" },
        { icon: <Palette className="w-7 h-7" />, title: "Full White-Label", desc: "Your brand everywhere. Remove all Agent Forja branding. Custom colors, logo, and company name.", gradient: "from-fuchsia-500 to-rose-500" },
        { icon: <Globe className="w-7 h-7" />, title: "One-Line Embed", desc: "Copy-paste embed code works on WordPress, Shopify, Wix, Squarespace, or raw HTML.", gradient: "from-cyan-500 to-blue-500" },
        { icon: <BarChart3 className="w-7 h-7" />, title: "Lead Capture", desc: "Auto-collect emails, names, and phone numbers from every conversation. Export leads anytime.", gradient: "from-rose-500 to-orange-500" },
        { icon: <FileText className="w-7 h-7" />, title: "Knowledge Base", desc: "Upload PDFs or scrape any website. Bot answers accurately using RAG technology.", gradient: "from-amber-500 to-yellow-500" },
        { icon: <Star className="w-7 h-7" />, title: "7 Industry Themes", desc: "Restaurant, e-commerce, real estate, healthcare, SaaS, Instagram, and modern.", gradient: "from-violet-500 to-indigo-500" },
        { icon: <Send className="w-7 h-7" />, title: "Instagram DM Bot", desc: "Auto-reply to Instagram DMs with AI. Perfect for businesses drowning in social messages.", gradient: "from-pink-500 to-rose-500" },
        { icon: <ShoppingCart className="w-7 h-7" />, title: "Product Catalog", desc: "Scrape e-commerce sites automatically. Bot shows products, prices, and helps customers shop.", gradient: "from-emerald-500 to-teal-500" },
        { icon: <Mic className="w-7 h-7" />, title: "Voice Bot (Soon)", desc: "Real-time AI voice conversations with sub-second latency. Like talking to a phone agent.", gradient: "from-red-500 to-rose-500" },
    ];

    return (
        <section id="features" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Everything You Need to</span><br />
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Sell AI Chatbots</span>
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Not a toy. A complete platform built for agencies that want to sell AI chatbot services.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-7 hover:border-violet-500/40 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} bg-opacity-20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform text-white`}>
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══ Who This Is For ═══ */
const BuiltFor = () => {
    const cases = [
        { icon: <Laptop />, title: "Digital Agencies", desc: "Add AI chatbots to your service offering. Upsell clients $99-$299/month.", stat: "$299/mo" },
        { icon: <TrendingUp />, title: "Marketing Consultants", desc: "Bundle lead-capture chatbots with your marketing packages.", stat: "3x leads" },
        { icon: <Users />, title: "Web Developers", desc: "Ship AI chatbots with every website build. Earn recurring revenue from every project.", stat: "+$99/mo" },
        { icon: <Rocket />, title: "SaaS Entrepreneurs", desc: "Launch your own AI chatbot product without building the infrastructure.", stat: "0 code" },
    ];

    return (
        <section className="relative py-24 px-6 bg-zinc-950/50">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Your Next <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Revenue Stream</span>
                    </h2>
                    <p className="text-lg text-zinc-400">Perfect for anyone who provides services to businesses</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cases.map((c, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="relative bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-6 text-center hover:shadow-xl hover:shadow-violet-500/10 transition-all overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform">
                                    {c.icon}
                                </div>
                                <div className="text-2xl font-bold text-violet-400 mb-2">{c.stat}</div>
                                <h3 className="text-lg font-bold mb-2 text-white">{c.title}</h3>
                                <p className="text-zinc-400 text-sm">{c.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══ Pricing ═══ */
const Pricing = () => {
    const plans = [
        {
            name: "Starter",
            price: "$99",
            oldPrice: "$588",
            description: "Perfect for getting started with AI chatbots",
            badge: null,
            highlighted: false,
            features: [
                "2,000 messages per month",
                "5 AI chatbots included",
                "Standard AI model",
                "White-label branding",
                "7 industry themes",
                "Website embed widget",
                "Lead capture system",
                "Knowledge base — PDF upload & scraping",
                "All future updates included",
            ],
        },
        {
            name: "Reseller Pro",
            price: "$199",
            oldPrice: "$1,188",
            description: "Smarter AI with higher limits for growing agencies",
            badge: "MOST POPULAR",
            highlighted: true,
            features: [
                "5,000 messages per month",
                "15 AI chatbots included",
                "Smarter AI model — better accuracy & tone",
                "White-label branding",
                "7 industry themes",
                "Website embed widget",
                "Lead capture system",
                "Knowledge base — PDF upload & scraping",
                "Instagram DM automation",
                "Priority support",
                "All future updates included",
            ],
        },
        {
            name: "Agency Elite",
            price: "$399",
            oldPrice: "$2,388",
            description: "Maximum power with your own API keys",
            badge: "BEST VALUE",
            highlighted: false,
            features: [
                "15,000 messages per month",
                "Unlimited AI chatbots",
                "Smartest AI model — GPT-level intelligence",
                "Bring your own API key — OpenAI, Anthropic, etc.",
                "White-label branding",
                "7 industry themes",
                "Website embed widget",
                "Lead capture system",
                "Knowledge base — PDF upload & scraping",
                "Instagram DM automation",
                "Voice Bot access (when launched)",
                "Dedicated support",
                "All future updates included",
            ],
        },
    ];

    return (
        <section id="pricing" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Pay Once.</span> Use Forever.
                    </h2>
                    <p className="text-lg text-zinc-400">No subscriptions. No per-seat pricing. Choose your tier.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className={`rounded-3xl p-8 border relative overflow-hidden ${
                                plan.highlighted
                                    ? "bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border-2 border-violet-500 shadow-2xl shadow-violet-500/20 scale-105"
                                    : "bg-zinc-900/50 border-zinc-800"
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full" />
                            )}
                            <div className="relative">
                                {plan.badge && (
                                    <div className={`text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-5 ${
                                        plan.highlighted
                                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                                            : "bg-gradient-to-r from-amber-600 to-orange-600"
                                    }`}>
                                        <Zap className="w-3.5 h-3.5" />
                                        {plan.badge}
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                                <p className="text-zinc-400 mb-6 text-sm">{plan.description}</p>

                                <div className="mb-2 flex items-baseline gap-3">
                                    <span className="text-lg text-zinc-500 line-through">{plan.oldPrice}</span>
                                    <span className="text-6xl font-black text-white tracking-tight">{plan.price}</span>
                                </div>
                                <p className="text-zinc-500 text-sm mb-8">One-time payment · Lifetime access</p>

                                <a
                                    href="#"
                                    className={`w-full block text-center font-bold py-4 rounded-xl transition-all hover:scale-[1.02] text-base mb-6 ${
                                        plan.highlighted
                                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/40"
                                            : "bg-white text-zinc-900 hover:bg-zinc-100"
                                    }`}
                                >
                                    Get {plan.name} — {plan.price}
                                </a>

                                <ul className="space-y-3">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-zinc-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <p className="text-center text-zinc-500 text-xs flex items-center justify-center gap-1.5 mt-6">
                                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                    30-day money-back guarantee
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══ Revenue Calculator ═══ */
const Calculator = () => (
    <section className="relative py-24 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                    Do the <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Math</span>
                </h2>
                <p className="text-lg text-zinc-400">See how quickly this $99 investment pays for itself</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
            >
                <div className="px-8 py-5 border-b border-zinc-800 flex items-center gap-2 text-white font-semibold">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Revenue Calculator
                </div>
                {[
                    ["Your investment", "$99", "one-time", false],
                    ["You charge each client", "$99", "/month", false],
                    ["With 5 clients", "$495", "/month", false],
                    ["Annual revenue", "$5,940", "", true],
                    ["Return on investment", "5,900%", "", false],
                ].map(([label, val, note, highlight], i) => (
                    <div key={i} className={`flex items-center justify-between px-8 py-5 border-b border-zinc-800/50 last:border-0 ${highlight ? "bg-violet-500/5" : ""}`}>
                        <span className={`text-sm ${highlight ? "text-white font-semibold" : "text-zinc-400"}`}>{label as string}</span>
                        <span className={`font-bold ${highlight ? "text-3xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" : "text-lg text-white"}`}>
                            {val as string}
                            {note && <span className="text-xs font-normal text-zinc-500 ml-1">{note as string}</span>}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    </section>
);

/* ═══ Testimonials ═══ */
const Testimonials = () => {
    const testimonials = [
        { name: "Alex Rivera", role: "Agency Owner, Digital Wave", quote: "Paid for itself in the first week. I landed 3 clients at $149/month each. The white-label is flawless — they have no idea I'm using Agent Forja.", rating: 5 },
        { name: "Sarah Kim", role: "Freelance Web Developer", quote: "I add a chatbot to every website I build now. It's an easy $99/month upsell. My clients love it and I barely do any extra work.", rating: 5 },
        { name: "Marcus Chen", role: "Marketing Consultant", quote: "The lead capture feature alone is worth 10x the price. My restaurant clients went from losing leads to converting 40% more inquiries.", rating: 5 },
    ];

    return (
        <section className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        What <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Resellers</span> Say
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-violet-500/40 transition-all"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(t.rating)].map((_, j) => (
                                    <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-zinc-300 mb-6 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm">
                                    {t.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">{t.name}</p>
                                    <p className="text-zinc-500 text-xs">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══ FAQ ═══ */
const FAQ = () => {
    const items = [
        { q: "What do I get for $99?", a: "Lifetime access to Agent Forja: 5 AI chatbots, 2,000 messages/month, full white-label branding, 7 industry themes, lead capture, knowledge base (PDF + web scraping), embed widget, Instagram DM automation, and all future updates. No monthly fees, ever." },
        { q: "Is this really lifetime? No hidden charges?", a: "Yes. Pay $99 once, use forever. We host everything — AI models, servers, database. No per-seat charges, no usage overages, no hidden fees." },
        { q: "What does white-label mean?", a: "Remove all Agent Forja branding. Replace with your own company name, logo, and colors. Your clients will never know you're using our platform." },
        { q: "Can I charge my clients monthly?", a: "Absolutely. Set your own prices, handle your own billing (Stripe, PayPal, invoices). We don't take any cut. Most resellers charge $49-$299/month." },
        { q: "What happens at 2,000 messages?", a: "Chatbots pause until your quota resets on the 1st of next month. You can also purchase additional message packs." },
        { q: "What AI powers the chatbots?", a: "Self-hosted AI on dedicated GPUs — not OpenAI or third-party APIs. Faster responses, lower latency, no per-token costs eating your margins." },
        { q: "Money-back guarantee?", a: "Yes. 30-day no-questions-asked refund. Not satisfied? We'll refund your $99 immediately." },
    ];

    return (
        <section id="faq" className="relative py-24 px-6 bg-zinc-950/50">
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Common <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Questions</span>
                    </h2>
                </motion.div>

                <div className="space-y-4">
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                        >
                            <details className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-violet-500/30 transition-colors">
                                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-white hover:text-violet-300 transition-colors">
                                    {item.q}
                                    <ChevronDown className="w-5 h-5 text-zinc-500 chevron flex-shrink-0" />
                                </summary>
                                <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-4">
                                    {item.a}
                                </div>
                            </details>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══ Final CTA ═══ */
const FinalCTA = () => (
    <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-500/40 rounded-3xl p-12 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5" />
                <div className="absolute top-10 left-10 w-60 h-60 bg-violet-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-10 right-10 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-[100px]" />

                <div className="relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Start Building Your<br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">Chatbot Empire Today</span>
                    </h2>
                    <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
                        Join agencies and freelancers already earning recurring revenue with AI chatbots.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="#pricing"
                            className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-4 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105"
                        >
                            Get Lifetime Access — $99
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                    <p className="text-zinc-500 text-sm mt-6 flex items-center justify-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                        30-day money-back guarantee · No monthly fees · Instant access
                    </p>
                </div>
            </motion.div>
        </div>
    </section>
);

/* ═══ Footer ═══ */
const Footer = () => (
    <footer className="border-t border-zinc-800 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-6 h-6 text-violet-400" />
                        <span className="text-xl font-bold text-white">Agent Forja</span>
                    </div>
                    <p className="text-zinc-500 text-sm">White-label AI chatbot platform for agencies and resellers.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Product</h3>
                    <ul className="space-y-2 text-zinc-500 text-sm">
                        <li><a href="#features" className="hover:text-violet-400 transition-colors">Features</a></li>
                        <li><a href="#pricing" className="hover:text-violet-400 transition-colors">Pricing</a></li>
                        <li><a href="#how" className="hover:text-violet-400 transition-colors">How It Works</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Company</h3>
                    <ul className="space-y-2 text-zinc-500 text-sm">
                        <li><a href="#" className="hover:text-violet-400 transition-colors">About</a></li>
                        <li><a href="#" className="hover:text-violet-400 transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-violet-400 transition-colors">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Legal</h3>
                    <ul className="space-y-2 text-zinc-500 text-sm">
                        <li><a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-violet-400 transition-colors">Refund Policy</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
                <p>© {new Date().getFullYear()} Agent Forja. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

/* ═══ Main Page ═══ */
export default function LifetimeDealPage() {
    return (
        <div className="bg-black text-zinc-200 min-h-screen">
            <Header />
            <main>
                <Hero />
                <StatsBar />
                <HowItWorks />
                <Features />
                <BuiltFor />
                <Pricing />
                <Calculator />
                <Testimonials />
                <FAQ />
                <FinalCTA />
            </main>
            <Footer />
            <Script
                src="https://tarik.business/embed/widget.js"
                data-slug="lifetime-deal-bot-mnfsd3f6"
                data-mode="float"
                strategy="lazyOnload"
            />
        </div>
    );
}
