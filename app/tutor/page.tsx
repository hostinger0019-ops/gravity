"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    Users,
    MessageCircle,
    CheckCircle2,
    ArrowRight,
    Menu,
    X,
    Sparkles,
    Clock,
    Brain,
    FileText,
    Video,
    Trophy,
    Star,
    TrendingUp,
    Lightbulb,
    Target,
    Zap,
    Shield,
    ChevronRight,
    Award,
    BarChart3,
    Scissors
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
        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/95 backdrop-blur-xl border-b border-sky-500/20" : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-500 blur-lg opacity-50 rounded-full"></div>
                                <GraduationCap className="w-9 h-9 text-sky-400 relative" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                                    EduAI Tutor
                                </span>
                                <p className="text-xs text-sky-300/70">Smart Learning Assistant</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-300 hover:text-sky-400 transition-colors">Features</a>
                            <a href="#benefits" className="text-slate-300 hover:text-sky-400 transition-colors">Benefits</a>
                            <a href="#pricing" className="text-slate-300 hover:text-sky-400 transition-colors">Pricing</a>
                            <a href="#testimonials" className="text-slate-300 hover:text-sky-400 transition-colors">Success Stories</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/admin/chatbots" className="text-slate-300 hover:text-white transition-colors px-4 py-2">
                                Sign In
                            </Link>
                            <Link
                                href="/admin/chatbots"
                                className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-sky-500/50 transition-all hover:scale-105"
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
                        className="md:hidden fixed top-20 left-0 right-0 z-40 bg-slate-950/98 backdrop-blur-xl border-b border-sky-500/20 p-6"
                    >
                        <nav className="flex flex-col gap-6">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-sky-400">Features</a>
                            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-sky-400">Benefits</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-sky-400">Pricing</a>
                            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-sky-400">Success Stories</a>
                            <Link href="/admin/chatbots" className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold py-3 rounded-lg text-center">
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
                <div className="absolute top-20 left-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-sky-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-block mb-6"
                >
                    <div className="bg-sky-500/10 border border-sky-500/30 rounded-full px-6 py-2 inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span className="text-sky-400 font-medium">AI-Powered Learning Platform</span>
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
                    <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Teaching Materials
                    </span>
                    <br />
                    <span className="text-white">into AI Tutors</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
                >
                    Let students chat with your notes, textbooks, and course materials 24/7. AI tutors that understand your teaching style and answer questions instantly. Improve learning outcomes by 70%.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                    <Link
                        href="/admin/chatbots"
                        className="group bg-gradient-to-r from-sky-600 to-cyan-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-sky-500/50 transition-all hover:scale-105"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#demo"
                        className="border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                    >
                        Watch Demo
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
                        <AnimatedCounter value={70} suffix="%" />
                        <p className="text-slate-400 mt-2">Better Learning</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={24} suffix="/7" />
                        <p className="text-slate-400 mt-2">Availability</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={90} suffix="%" />
                        <p className="text-slate-400 mt-2">Student Satisfaction</p>
                    </div>
                    <div className="text-center">
                        <AnimatedCounter value={5} suffix="x" />
                        <p className="text-slate-400 mt-2">More Engagement</p>
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
            icon: <Brain className="w-8 h-8" />,
            title: "AI Trained on Your Materials",
            description: "Upload notes, PDFs, textbooks, videos, and slides. AI learns your teaching style and content to provide accurate, personalized answers.",
            gradient: "from-sky-500 to-cyan-500"
        },
        {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "24/7 Student Support",
            description: "Students get instant answers to questions anytime, anywhere. No more waiting for office hours or overwhelmed email inbox.",
            gradient: "from-cyan-500 to-blue-500"
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: "Smart Study Guides",
            description: "AI generates practice questions, summaries, and study guides from your materials. Helps students prepare for exams effectively.",
            gradient: "from-blue-500 to-indigo-500"
        },
        {
            icon: <Target className="w-8 h-8" />,
            title: "Personalized Learning",
            description: "AI adapts to each student's level and learning pace. Provides customized explanations and examples based on understanding.",
            gradient: "from-sky-500 to-teal-500"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Learning Analytics",
            description: "Track what students ask, what they struggle with, and where they excel. Use insights to improve your teaching.",
            gradient: "from-teal-500 to-green-500"
        },
        {
            icon: <Trophy className="w-8 h-8" />,
            title: "Engagement Boost",
            description: "Gamified learning with quizzes, challenges, and progress tracking. Keep students motivated and accountable.",
            gradient: "from-green-500 to-emerald-500"
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
                        <span className="text-white">Everything Tutors Need for</span>
                        <br />
                        <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Modern Teaching</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Powerful AI features designed for educators and tutors
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
                            className="group bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-sky-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer"
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

// Benefits Section
const Benefits = () => {
    const benefits = [
        {
            icon: <TrendingUp />,
            title: "Improve Outcomes",
            description: "70% better learning results with AI tutoring",
            stat: "+70%"
        },
        {
            icon: <Clock />,
            title: "Save Time",
            description: "80% reduction in repetitive questions",
            stat: "80% saved"
        },
        {
            icon: <Users />,
            title: "Scale Teaching",
            description: "Support 100x more students",
            stat: "100x scale"
        },
        {
            icon: <Award />,
            title: "Boost Engagement",
            description: "5x more student interaction",
            stat: "5x more"
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
                        Why Educators <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Love Us</span>
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
                            className="bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/30 rounded-xl p-6 text-center hover:shadow-xl hover:shadow-sky-500/20 transition-all"
                        >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 flex items-center justify-center mx-auto mb-4 text-white">
                                {benefit.icon}
                            </div>
                            <div className="text-3xl font-bold text-sky-400 mb-2">{benefit.stat}</div>
                            <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                            <p className="text-slate-400 text-sm">{benefit.description}</p>
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
            icon: <BookOpen />,
            title: "Private Tutors",
            description: "1-on-1 tutoring with AI study companion for students"
        },
        {
            icon: <GraduationCap />,
            title: "Online Courses",
            description: "Enhance your online courses with AI teaching assistant"
        },
        {
            icon: <Video />,
            title: "Coaching Programs",
            description: "Business, fitness, life coaching with 24/7 AI support"
        },
        {
            icon: <Lightbulb />,
            title: "Training Programs",
            description: "Corporate training and skill development programs"
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
                        Perfect for <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Every Teaching Style</span>
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
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-sky-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 transition-transform">
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
            name: "Solo Tutor",
            price: "$29",
            period: "/month",
            description: "For individual educators",
            features: [
                "1,000 student messages/month",
                "Upload up to 50 documents",
                "Basic analytics",
                "Email support",
                "1 course/subject"
            ],
            highlighted: false
        },
        {
            name: "Professional",
            price: "$79",
            period: "/month",
            description: "For serious educators",
            features: [
                "5,000 student messages/month",
                "Unlimited documents",
                "Advanced analytics",
                "Priority support",
                "Up to 5 courses",
                "Custom branding",
                "Student progress tracking"
            ],
            highlighted: true
        },
        {
            name: "Academy",
            price: "Custom",
            period: "",
            description: "For schools & institutions",
            features: [
                "Unlimited messages",
                "Multi-instructor support",
                "White-label solution",
                "Dedicated account manager",
                "Custom integrations",
                "LMS integration",
                "Advanced reporting"
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
                        Simple, <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Affordable Pricing</span>
                    </h2>
                    <p className="text-xl text-slate-400">Choose the plan that fits your teaching needs</p>
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
                                    ? "bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border-sky-500 shadow-2xl shadow-sky-500/20 scale-105"
                                    : "bg-slate-800/50 border-slate-700"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
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
                                        ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-sky-500/50"
                                        : "bg-white text-slate-900 hover:bg-slate-200"
                                    }`}
                            >
                                Get Started
                            </Link>
                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
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
            name: "Dr. Emily Parker",
            role: "Mathematics Tutor",
            quote: "My students now have a personal tutor available 24/7. Their test scores improved by 40% and I spend less time answering the same questions repeatedly!",
            rating: 5
        },
        {
            name: "James Rodriguez",
            role: "Online Course Creator",
            quote: "This AI tutor knows my course materials better than I do sometimes! Students get instant help and I can focus on creating better content.",
            rating: 5
        },
        {
            name: "Lisa Chen",
            role: "Language Coach",
            quote: "Game-changer for my language students. They practice conversations with the AI anytime, and it corrects their grammar just like I would. Amazing!",
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
                        What <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Educators</span> Say
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
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-sky-500/50 transition-all"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                            <div>
                                <p className="font-semibold text-white">{testimonial.name}</p>
                                <p className="text-slate-400 text-sm">{testimonial.role}</p>
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
                    className="relative bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/50 rounded-3xl p-12 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-cyan-600/10"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            Ready to <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Transform Learning</span>?
                        </h2>
                        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            Join 3,500+ tutors and educators using AI to enhance student success
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/admin/chatbots"
                                className="group bg-gradient-to-r from-sky-600 to-cyan-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-sky-500/50 transition-all hover:scale-105"
                            >
                                Start Your Free Trial
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#pricing"
                                className="border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all"
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
                            <GraduationCap className="w-6 h-6 text-sky-400" />
                            <span className="text-xl font-bold text-white">EduAI Tutor</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            AI-powered learning platform for modern educators
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#features" className="hover:text-sky-400 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-sky-400 transition-colors">Pricing</a></li>
                            <li><a href="#testimonials" className="hover:text-sky-400 transition-colors">Success Stories</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-sky-400 transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} EduAI Tutor. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// Main Component
export default function TutorPage() {
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
