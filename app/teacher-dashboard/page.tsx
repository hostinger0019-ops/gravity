"use client";
import { useState } from "react";
import { motion } from "framer-motion";
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
    ChevronRight
} from "lucide-react";

// Mock Data
const studentData = [
    {
        id: 1,
        name: "Emily Johnson",
        email: "emily.j@email.com",
        avatar: "EJ",
        course: "Advanced Mathematics",
        progress: 85,
        quizScore: 92,
        timeSpent: 24.5,
        lastActive: "2 hours ago",
        status: "active",
        streak: 12
    },
    {
        id: 2,
        name: "Michael Chen",
        email: "michael.c@email.com",
        avatar: "MC",
        course: "Physics 101",
        progress: 72,
        quizScore: 88,
        timeSpent: 18.2,
        lastActive: "1 day ago",
        status: "active",
        streak: 7
    },
    {
        id: 3,
        name: "Sarah Williams",
        email: "sarah.w@email.com",
        avatar: "SW",
        course: "Chemistry Basics",
        progress: 45,
        quizScore: 76,
        timeSpent: 12.8,
        lastActive: "3 days ago",
        status: "struggling",
        streak: 3
    },
    {
        id: 4,
        name: "David Martinez",
        email: "david.m@email.com",
        avatar: "DM",
        course: "Biology Advanced",
        progress: 95,
        quizScore: 98,
        timeSpent: 32.1,
        lastActive: "1 hour ago",
        status: "excellent",
        streak: 21
    },
    {
        id: 5,
        name: "Jessica Taylor",
        email: "jessica.t@email.com",
        avatar: "JT",
        course: "Advanced Mathematics",
        progress: 38,
        quizScore: 65,
        timeSpent: 8.5,
        lastActive: "5 days ago",
        status: "at-risk",
        streak: 1
    }
];

const topicsData = [
    { name: "Calculus", mastered: 45, struggling: 12, inProgress: 23 },
    { name: "Algebra", mastered: 62, struggling: 8, inProgress: 15 },
    { name: "Geometry", mastered: 38, struggling: 18, inProgress: 29 },
    { name: "Statistics", mastered: 41, struggling: 15, inProgress: 24 }
];

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, change, trend }: any) => {
    const isPositive = change > 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-sky-500/50 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${trend === 'up' ? 'from-green-500/20 to-emerald-500/20' : trend === 'down' ? 'from-red-500/20 to-pink-500/20' : 'from-sky-500/20 to-cyan-500/20'} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-sky-400'}`} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <h3 className="text-slate-400 text-sm mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
        </motion.div>
    );
};

// Student Row Component
const StudentRow = ({ student }: any) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "excellent": return "text-green-400 bg-green-500/10 border-green-500/30";
            case "active": return "text-sky-400 bg-sky-500/10 border-sky-500/30";
            case "struggling": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
            case "at-risk": return "text-red-400 bg-red-500/10 border-red-500/30";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
        }
    };

    return (
        <tr className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors">
            <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {student.avatar}
                    </div>
                    <div>
                        <p className="font-semibold text-white">{student.name}</p>
                        <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4 text-slate-300">{student.course}</td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2 max-w-[100px]">
                        <div
                            className="bg-gradient-to-r from-sky-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${student.progress}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-semibold text-white">{student.progress}%</span>
                </div>
            </td>
            <td className="py-4 px-4">
                <span className="text-white font-semibold">{student.quizScore}%</span>
            </td>
            <td className="py-4 px-4 text-slate-300">{student.timeSpent}h</td>
            <td className="py-4 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(student.status)}`}>
                    {student.status}
                </span>
            </td>
            <td className="py-4 px-4">
                <button className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 text-sm font-semibold">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

// Main Dashboard Component
export default function TeacherDashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const filteredStudents = studentData.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Brain className="w-8 h-8 text-sky-400" />
                                Teacher Dashboard
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Track student progress and performance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                            <button className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-sky-500/50 transition-all">
                                Add Student
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        icon={Users}
                        title="Total Students"
                        value="124"
                        change={12}
                        trend="up"
                    />
                    <StatsCard
                        icon={TrendingUp}
                        title="Average Progress"
                        value="67%"
                        change={5}
                        trend="up"
                    />
                    <StatsCard
                        icon={Award}
                        title="Avg Quiz Score"
                        value="84%"
                        change={-2}
                        trend="down"
                    />
                    <StatsCard
                        icon={Clock}
                        title="Total Hours"
                        value="2,453h"
                        change={18}
                        trend="up"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Performance Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-sky-400" />
                            Student Performance Distribution
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-400">Excellent (90-100%)</span>
                                    <span className="text-sm font-semibold text-green-400">24 students</span>
                                </div>
                                <div className="bg-slate-700 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '35%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-400">Good (75-89%)</span>
                                    <span className="text-sm font-semibold text-sky-400">52 students</span>
                                </div>
                                <div className="bg-slate-700 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 h-3 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-400">Average (60-74%)</span>
                                    <span className="text-sm font-semibold text-yellow-400">32 students</span>
                                </div>
                                <div className="bg-slate-700 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-400">Needs Attention (&lt;60%)</span>
                                    <span className="text-sm font-semibold text-red-400">16 students</span>
                                </div>
                                <div className="bg-slate-700 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full" style={{ width: '25%' }}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Topics Mastery */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-sky-400" />
                            Topic Mastery Overview
                        </h3>
                        <div className="space-y-4">
                            {topicsData.map((topic, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-semibold text-white">{topic.name}</span>
                                        <div className="flex gap-3 text-xs">
                                            <span className="text-green-400">{topic.mastered} ✓</span>
                                            <span className="text-yellow-400">{topic.inProgress} ⏳</span>
                                            <span className="text-red-400">{topic.struggling} ⚠</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-700 rounded-full h-2 flex overflow-hidden">
                                        <div className="bg-green-500" style={{ width: `${(topic.mastered / 80) * 100}%` }}></div>
                                        <div className="bg-yellow-500" style={{ width: `${(topic.inProgress / 80) * 100}%` }}></div>
                                        <div className="bg-red-500" style={{ width: `${(topic.struggling / 80) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Insights */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Trophy className="w-8 h-8 text-green-400" />
                            <h4 className="font-bold text-white">Top Performers</h4>
                        </div>
                        <p className="text-green-400 text-2xl font-bold mb-1">24 students</p>
                        <p className="text-slate-400 text-sm">Scored above 90% on recent assessments</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                            <h4 className="font-bold text-white">Needs Support</h4>
                        </div>
                        <p className="text-yellow-400 text-2xl font-bold mb-1">16 students</p>
                        <p className="text-slate-400 text-sm">Require additional attention and help</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/30 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className="w-8 h-8 text-sky-400" />
                            <h4 className="font-bold text-white">Active This Week</h4>
                        </div>
                        <p className="text-sky-400 text-2xl font-bold mb-1">98 students</p>
                        <p className="text-slate-400 text-sm">Engaged with course materials recently</p>
                    </motion.div>
                </div>

                {/* Student List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50  border border-slate-700 rounded-xl overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-700">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-sky-400" />
                                Student Overview
                            </h3>
                            <div className="flex gap-3">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                >
                                    <option value="all">All Status</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="active">Active</option>
                                    <option value="struggling">Struggling</option>
                                    <option value="at-risk">At Risk</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr className="text-left text-sm text-slate-400">
                                    <th className="py-3 px-4 font-semibold">Student</th>
                                    <th className="py-3 px-4 font-semibold">Course</th>
                                    <th className="py-3 px-4 font-semibold">Progress</th>
                                    <th className="py-3 px-4 font-semibold">Avg Score</th>
                                    <th className="py-3 px-4 font-semibold">Time Spent</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <StudentRow key={student.id} student={student} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
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
