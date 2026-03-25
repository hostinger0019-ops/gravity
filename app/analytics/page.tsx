"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Users,
    TrendingUp,
    BookOpen,
    Clock,
    Award,
    BarChart3,
    Activity,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    Download,
    Calendar,
    Target,
    Brain,
    Zap,
    Trophy,
    Star,
    ThumbsUp,
    ChevronRight,
    ArrowLeft,
    TrendingDown,
    Circle
} from "lucide-react";

// Mock data with trends
const performanceTrends = [
    { date: "Jan 1", avgScore: 72, activeStudents: 45, timeSpent: 120 },
    { date: "Jan 8", avgScore: 75, activeStudents: 52, timeSpent: 145 },
    { date: "Jan 15", avgScore: 78, activeStudents: 61, timeSpent: 168 },
    { date: "Jan 22", avgScore: 81, activeStudents: 68, timeSpent: 189 },
    { date: "Jan 29", avgScore: 84, activeStudents: 72, timeSpent: 210 }
];

const topicInsights = [
    {
        id: 1,
        name: "Calculus Fundamentals",
        mastered: 45,
        inProgress: 23,
        struggling: 12,
        avgTimeToMaster: 12.5,
        avgScore: 88,
        commonQuestions: [
            "What is the difference between derivatives and integrals?",
            "How do I solve limits with L'Hôpital's rule?",
            "When should I use the chain rule?"
        ],
        difficulty: "Medium"
    },
    {
        id: 2,
        name: "Linear Algebra",
        mastered: 62,
        inProgress: 15,
        struggling: 8,
        avgTimeToMaster: 8.3,
        avgScore: 92,
        commonQuestions: [
            "How do I multiply matrices?",
            "What are eigenvalues used for?",
            "How to find the determinant?"
        ],
        difficulty: "Easy"
    },
    {
        id: 3,
        name: "Differential Equations",
        mastered: 28,
        inProgress: 34,
        struggling: 23,
        avgTimeToMaster: 18.7,
        avgScore: 76,
        commonQuestions: [
            "How to solve separable differential equations?",
            "What is the difference between ordinary and partial DEs?",
            "How to apply initial conditions?"
        ],
        difficulty: "Hard"
    }
];

const engagementHeatmap = {
    hourly: [
        { hour: "6am", value: 5 },
        { hour: "9am", value: 45 },
        { hour: "12pm", value: 78 },
        { hour: "3pm", value: 92 },
        { hour: "6pm", value: 65 },
        { hour: "9pm", value: 34 },
        { hour: "12am", value: 8 }
    ],
    weekly: [
        { day: "Mon", value: 85 },
        { day: "Tue", value: 92 },
        { day: "Wed", value: 88 },
        { day: "Thu", value: 76 },
        { day: "Fri", value: 65 },
        { day: "Sat", value: 45 },
        { day: "Sun", value: 38 }
    ]
};

// Stats Card
const StatsCard = ({ icon: Icon, title, value, change, trend }: any) => {
    const isPositive = change > 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-sky-500/50 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${trend === 'up' ? 'from-green-500/20 to-emerald-500/20' :
                        trend === 'down' ? 'from-red-500/20 to-pink-500/20' :
                            'from-sky-500/20 to-cyan-500/20'
                    } flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${trend === 'up' ? 'text-green-400' :
                            trend === 'down' ? 'text-red-400' :
                                'text-sky-400'
                        }`} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <h3 className="text-slate-400 text-sm mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
        </motion.div>
    );
};

// Performance Trend Chart
const PerformanceTrendChart = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                Performance Trends Over Time
            </h3>

            {/* Simple line chart visualization */}
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-400">Average Quiz Score</span>
                        <span className="text-sm font-semibold text-green-400">+17% vs last month</span>
                    </div>
                    <div className="h-32 flex items-end justify-between gap-2">
                        {performanceTrends.map((data, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-slate-700 rounded-t-lg relative group cursor-pointer hover:bg-slate-600 transition-colors"
                                    style={{ height: `${data.avgScore}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {data.avgScore}%
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{data.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-400">Active Students</span>
                        <span className="text-sm font-semibold text-sky-400">+60% growth</span>
                    </div>
                    <div className="h-24 flex items-end justify-between gap-2">
                        {performanceTrends.map((data, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-gradient-to-t from-sky-500 to-cyan-500 rounded-t-lg relative group cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                    style={{ height: `${(data.activeStudents / 80) * 100}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {data.activeStudents} students
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Topic Insights Card
const TopicInsightCard = ({ topic }: any) => {
    const total = topic.mastered + topic.inProgress + topic.struggling;
    const masteryRate = ((topic.mastered / total) * 100).toFixed(0);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Easy": return "text-green-400 bg-green-500/10 border-green-500/30";
            case "Medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
            case "Hard": return "text-red-400 bg-red-500/10 border-red-500/30";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-sky-500/50 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="font-bold text-white text-lg mb-1">{topic.name}</h4>
                    <span className={`text-xs px-3 py-1 rounded-full border ${getDifficultyColor(topic.difficulty)}`}>
                        {topic.difficulty}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-sky-400">{masteryRate}%</div>
                    <div className="text-xs text-slate-400">Mastery Rate</div>
                </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3 mb-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">✓ Mastered</span>
                        <span className="text-white font-semibold">{topic.mastered}</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(topic.mastered / total) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-yellow-400">⏳ In Progress</span>
                        <span className="text-white font-semibold">{topic.inProgress}</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(topic.inProgress / total) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">⚠ Struggling</span>
                        <span className="text-white font-semibold">{topic.struggling}</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(topic.struggling / total) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-900/50 rounded-lg">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Avg Time to Master</div>
                    <div className="text-lg font-bold text-white">{topic.avgTimeToMaster}h</div>
                </div>
                <div>
                    <div className="text-xs text-slate-400 mb-1">Avg Quiz Score</div>
                    <div className="text-lg font-bold text-white">{topic.avgScore}%</div>
                </div>
            </div>

            {/* Common Questions */}
            <div>
                <div className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-sky-400" />
                    Top Questions
                </div>
                <ul className="space-y-2">
                    {topic.commonQuestions.slice(0, 3).map((q: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                            <Circle className="w-2 h-2 fill-sky-400 text-sky-400 mt-1 flex-shrink-0" />
                            <span>{q}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
};

// Engagement Heatmap
const EngagementHeatmap = () => {
    const getHeatColor = (value: number) => {
        if (value >= 80) return "bg-green-500";
        if (value >= 60) return "bg-sky-500";
        if (value >= 40) return "bg-yellow-500";
        if (value >= 20) return "bg-orange-500";
        return "bg-slate-600";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                Student Engagement Patterns
            </h3>

            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Peak Learning Hours</h4>
                    <div className="flex items-end justify-between gap-2 h-32">
                        {engagementHeatmap.hourly.map((data, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className={`w-full rounded-t-lg relative group cursor-pointer ${getHeatColor(data.value)}`}
                                    style={{ height: `${data.value}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {data.value}% active
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{data.hour}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                        💡 Peak engagement: 3pm-6pm (92% active) • Lowest: 12am-6am (8% active)
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Weekly Activity</h4>
                    <div className="space-y-2">
                        {engagementHeatmap.weekly.map((data, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-sm text-slate-400 w-12">{data.day}</span>
                                <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                                    <div className={`h-6 rounded-full ${getHeatColor(data.value)} transition-all`}
                                        style={{ width: `${data.value}%` }}></div>
                                </div>
                                <span className="text-sm text-white font-semibold w-12 text-right">{data.value}%</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                        💡 Most active: Tuesday (92%) • Least active: Sunday (38%)
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
export default function EnhancedAnalyticsDashboard() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/teacher-dashboard" className="text-slate-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <BarChart3 className="w-8 h-8 text-sky-400" />
                                    Advanced Analytics
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">Deep insights into student performance and engagement</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard icon={Users} title="Total Students" value="124" change={12} trend="up" />
                    <StatsCard icon={TrendingUp} title="Average Progress" value="67%" change={5} trend="up" />
                    <StatsCard icon={Award} title="Avg Quiz Score" value="84%" change={7} trend="up" />
                    <StatsCard icon={Clock} title="Total Hours" value="2,453h" change={18} trend="up" />
                </div>

                {/* Performance Trends */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <PerformanceTrendChart />
                    <EngagementHeatmap />
                </div>

                {/* Topic-Specific Insights */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Target className="w-6 h-6 text-sky-400" />
                            Topic-Specific Insights
                        </h2>
                        <select className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500">
                            <option>All Topics</option>
                            <option>Struggling Students Only</option>
                            <option>Sort by Difficulty</option>
                        </select>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topicInsights.map((topic) => (
                            <TopicInsightCard key={topic.id} topic={topic} />
                        ))}
                    </div>
                </div>

                {/* Additional Insights */}
                <div className="grid md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6"
                    >
                        <Brain className="w-10 h-10 text-purple-400 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">AI Insights</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Students asking 40% more questions about Differential Equations. Consider hosting a live Q&A session.
                        </p>
                        <button className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1">
                            View Details <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
                    >
                        <Trophy className="w-10 h-10 text-green-400 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Success Prediction</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            89% of students are on track to complete the course successfully based on current progress patterns.
                        </p>
                        <button className="text-green-400 hover:text-green-300 text-sm font-semibold flex items-center gap-1">
                            View Predictions <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6"
                    >
                        <AlertCircle className="w-10 h-10 text-orange-400 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">At-Risk Students</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            16 students haven't logged in for 5+ days. Automated reminder emails sent. Consider personal outreach.
                        </p>
                        <button className="text-orange-400 hover:text-orange-300 text-sm font-semibold flex items-center gap-1">
                            View List <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
        </div>
    );
}
