"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    MessageCircle,
    TrendingUp,
    Target,
    Mic,
    Share2,
    Sparkles,
    ArrowRight,
    ChevronRight,
    Shield,
    Zap,
    Clock,
    Users,
    CheckCircle2,
    Building2,
    ShoppingCart,
    UtensilsCrossed,
    Home as HomeIcon,
    GraduationCap,
    Plane,
    Stethoscope,
    ArrowLeft
} from "lucide-react";

// Header
const Header = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-stone-950/95 backdrop-blur-xl border-b border-blue-500/20" : "bg-transparent"}`}
        >
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center h-20">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-violet-500 blur-lg opacity-50 rounded-full"></div>
                            <Zap className="w-8 h-8 text-blue-400 relative" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                Agent Forja
                            </span>
                            <p className="text-xs text-blue-300/70">AI Digital Employees</p>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#solutions" className="text-stone-300 hover:text-blue-400 transition-colors">Solutions</a>
                        <a href="#industries" className="text-stone-300 hover:text-blue-400 transition-colors">Industries</a>
                        <a href="#why-us" className="text-stone-300 hover:text-blue-400 transition-colors">Why Agent Forja</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-stone-300 hover:text-white transition-colors px-4 py-2 flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                        <Link
                            href="/"
                            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
                        >
                            Build Your Agent
                        </Link>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

// Hero
const Hero = () => (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6 pt-20 overflow-hidden">
        <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-block mb-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-full px-6 py-2 inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">AI-Powered Digital Employees</span>
                </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="text-white">Hire AI Agents</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    That Work 24/7
                </span>
                <br />
                <span className="text-white">For Your Business</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-xl text-stone-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                Deploy intelligent AI employees that handle customer support, sales, lead capture, voice calls, and social media — so your team can focus on what matters most.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/" className="group bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </motion.div>
        </div>
    </section>
);

// Solutions Grid
const Solutions = () => {
    const solutions = [
        {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "AI Customer Support",
            description: "Deploy a tireless support agent that answers customer questions instantly, resolves issues, and escalates complex cases to your team. Available 24/7 across chat, email, and your website.",
            features: ["Instant responses", "Multi-language support", "Smart escalation", "Knowledge base integration"],
            color: "blue",
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: "AI Sales Agent",
            description: "Convert more visitors into paying customers with an AI that understands your products, recommends solutions, handles objections, and guides prospects through your sales funnel.",
            features: ["Product recommendations", "Objection handling", "Cart recovery", "Upselling & cross-selling"],
            color: "emerald",
            gradient: "from-emerald-500 to-green-500"
        },
        {
            icon: <Target className="w-8 h-8" />,
            title: "AI Lead Capture",
            description: "Automatically qualify and capture leads from every channel. Your AI agent asks the right questions, scores prospects, and feeds qualified leads directly to your CRM.",
            features: ["Lead qualification", "Smart forms", "CRM integration", "Follow-up sequences"],
            color: "amber",
            gradient: "from-amber-500 to-orange-500"
        },
        {
            icon: <Mic className="w-8 h-8" />,
            title: "AI Voice Agent",
            description: "A voice-powered AI assistant that handles phone calls, answers questions in natural language, and provides real-time support — just like a human receptionist.",
            features: ["Natural speech", "Call routing", "Appointment booking", "Real-time transcription"],
            color: "violet",
            gradient: "from-violet-500 to-purple-500"
        },
        {
            icon: <Share2 className="w-8 h-8" />,
            title: "AI Social Media Agent",
            description: "Automate your social media engagement. Reply to DMs, respond to comments, handle inquiries, and maintain consistent brand voice across all platforms.",
            features: ["Instagram DMs", "Comment replies", "Brand voice AI", "24/7 engagement"],
            color: "pink",
            gradient: "from-pink-500 to-rose-500"
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "AI Knowledge Agent",
            description: "Train your AI on your company data — documents, FAQs, product catalogs, policies. It becomes an expert on your business and answers any question accurately.",
            features: ["Document training", "Website scraping", "Accurate answers", "Auto-updating"],
            color: "sky",
            gradient: "from-sky-500 to-blue-500"
        }
    ];

    return (
        <section id="solutions" className="relative py-24 px-6 bg-stone-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Your AI</span>{" "}
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Digital Workforce</span>
                    </h2>
                    <p className="text-xl text-stone-400 max-w-2xl mx-auto">
                        Each agent is purpose-built to excel at a specific role in your business
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {solutions.map((solution, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group bg-stone-800/50 border border-stone-700 rounded-2xl p-8 hover:border-blue-500/50 hover:bg-stone-800/80 transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${solution.gradient} bg-opacity-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-white`} style={{ background: `linear-gradient(135deg, var(--tw-gradient-from) / 0.2, var(--tw-gradient-to) / 0.2)` }}>
                                <div className={`text-${solution.color}-400`}>
                                    {solution.icon}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white">{solution.title}</h3>
                            <p className="text-stone-400 leading-relaxed mb-6">{solution.description}</p>
                            <ul className="space-y-2">
                                {solution.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-stone-300 text-sm">
                                        <CheckCircle2 className={`w-4 h-4 text-${solution.color}-400 flex-shrink-0`} />
                                        {feature}
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

// Industries Section
const Industries = () => {
    const industries = [
        { icon: <ShoppingCart />, title: "E-Commerce", description: "Product support, order tracking, returns, recommendations", link: "/ecommerce", color: "emerald" },
        { icon: <UtensilsCrossed />, title: "Restaurants", description: "Reservations, menu inquiries, online ordering, feedback", link: "/restaurant", color: "orange" },
        { icon: <HomeIcon />, title: "Real Estate", description: "Property inquiries, scheduling viewings, lead qualification", link: "/real", color: "blue" },
        { icon: <GraduationCap />, title: "Education", description: "Student support, course info, enrollment assistance", link: "/tutor", color: "violet" },
        { icon: <Plane />, title: "Travel", description: "Booking assistance, itinerary planning, travel support", link: "/travel", color: "cyan" },
        { icon: <Building2 />, title: "SaaS & Tech", description: "Product demos, onboarding, technical support", link: "/software", color: "pink" },
        { icon: <Stethoscope />, title: "Healthcare", description: "Appointment booking, FAQ, patient intake forms", link: "#", color: "red" },
        { icon: <Building2 />, title: "Enterprise", description: "Custom AI solutions for large organizations", link: "#", color: "amber" },
    ];

    return (
        <section id="industries" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Built for <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Every Industry</span>
                    </h2>
                    <p className="text-xl text-stone-400 max-w-2xl mx-auto">
                        Pre-trained templates for your industry — customize in minutes, not months
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {industries.map((industry, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={industry.link} className="block bg-stone-800/50 border border-stone-700 rounded-xl p-6 hover:border-blue-500/50 transition-all group hover:bg-stone-800/80">
                                <div className={`w-12 h-12 rounded-lg bg-${industry.color}-500/20 flex items-center justify-center mb-4 text-${industry.color}-400 group-hover:scale-110 transition-transform`}>
                                    {industry.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{industry.title}</h3>
                                <p className="text-stone-400 text-sm mb-3">{industry.description}</p>
                                <span className="text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Learn more <ChevronRight className="w-4 h-4" />
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Why Us
const WhyUs = () => {
    const reasons = [
        { icon: <Zap />, title: "Deploy in Minutes", description: "Describe your business and our AI builds your agent. No code needed — just tell it what you want.", stat: "5 min" },
        { icon: <Clock />, title: "24/7 Availability", description: "Your AI employees never sleep, never call in sick, and handle unlimited conversations simultaneously.", stat: "Always On" },
        { icon: <Users />, title: "Scales Instantly", description: "From 1 to 10,000 conversations at once. No hiring, no training, no overhead.", stat: "∞ Scale" },
        { icon: <Shield />, title: "Your Data, Your Control", description: "Runs on your own infrastructure. No data shared with third parties. Full privacy.", stat: "100% Private" }
    ];

    return (
        <section id="why-us" className="relative py-24 px-6 bg-stone-900/30">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Why <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Agent Forja</span>?
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {reasons.map((reason, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/30 rounded-xl p-6 text-center hover:shadow-xl hover:shadow-blue-500/20 transition-all"
                        >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-4 text-white">
                                {reason.icon}
                            </div>
                            <div className="text-3xl font-bold text-blue-400 mb-2">{reason.stat}</div>
                            <h3 className="text-xl font-bold mb-2 text-white">{reason.title}</h3>
                            <p className="text-stone-400 text-sm">{reason.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// CTA
const CTA = () => (
    <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/50 rounded-3xl p-12 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10"></div>
                <div className="relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Ready to <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Hire Your AI Team</span>?
                    </h2>
                    <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
                        Build your first AI agent in under 5 minutes. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="group bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
                        >
                            Build Your Agent Now
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <p className="text-stone-400 text-sm mt-6">Free to start • No credit card • Deploy in minutes</p>
                </div>
            </motion.div>
        </div>
    </section>
);

// Footer
const Footer = () => (
    <footer className="border-t border-stone-800 bg-stone-900/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-6 h-6 text-blue-400" />
                        <span className="text-xl font-bold text-white">Agent Forja</span>
                    </div>
                    <p className="text-stone-400 text-sm">
                        AI digital employees for every business
                    </p>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Solutions</h3>
                    <ul className="space-y-2 text-stone-400 text-sm">
                        <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Customer Support</a></li>
                        <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Sales Agent</a></li>
                        <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Lead Capture</a></li>
                        <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Voice Agent</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Industries</h3>
                    <ul className="space-y-2 text-stone-400 text-sm">
                        <li><Link href="/ecommerce" className="hover:text-blue-400 transition-colors">E-Commerce</Link></li>
                        <li><Link href="/restaurant" className="hover:text-blue-400 transition-colors">Restaurants</Link></li>
                        <li><Link href="/real" className="hover:text-blue-400 transition-colors">Real Estate</Link></li>
                        <li><Link href="/travel" className="hover:text-blue-400 transition-colors">Travel</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Company</h3>
                    <ul className="space-y-2 text-stone-400 text-sm">
                        <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                        <li><Link href="/legal" className="hover:text-blue-400 transition-colors">Legal</Link></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-stone-800 text-center text-stone-400 text-sm">
                <p>© {new Date().getFullYear()} Agent Forja. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

// Main
export default function SolutionsPage() {
    return (
        <div className="bg-stone-950 text-stone-200 min-h-screen">
            <Header />
            <main>
                <Hero />
                <Solutions />
                <Industries />
                <WhyUs />
                <CTA />
            </main>
            <Footer />

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                html { scroll-behavior: smooth; }
                body { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
}
