"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Users,
    MessageSquare,
    Home,
    TrendingUp,
    Eye,
    Heart,
    Calendar,
    Phone,
    Mail,
    Clock,
    ChevronRight,
    Search,
    Filter,
    MoreVertical,
    Star,
    CheckCircle,
    AlertCircle,
    XCircle,
    Bell,
    Settings,
    LogOut,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

// Mock Data
const STATS = [
    { label: "Total Leads", value: "1,284", change: "+12.5%", up: true, icon: Users, color: "bg-blue-500" },
    { label: "Active Chats", value: "47", change: "+8.2%", up: true, icon: MessageSquare, color: "bg-emerald-500" },
    { label: "Property Views", value: "8,432", change: "+23.1%", up: true, icon: Eye, color: "bg-purple-500" },
    { label: "Conversions", value: "89", change: "-2.4%", up: false, icon: TrendingUp, color: "bg-orange-500" },
];

const LEADS = [
    { id: 1, name: "James Wilson", email: "james.w@email.com", phone: "+1 (555) 234-5678", property: "3BR Condo in Manhattan", status: "hot", lastChat: "2 min ago", score: 95 },
    { id: 2, name: "Emily Thompson", email: "emily.t@email.com", phone: "+1 (555) 345-6789", property: "Penthouse in Beverly Hills", status: "warm", lastChat: "1 hour ago", score: 78 },
    { id: 3, name: "Michael Brown", email: "m.brown@email.com", phone: "+44 7700 900123", property: "4BR Villa in Hamptons", status: "hot", lastChat: "30 min ago", score: 88 },
    { id: 4, name: "Sarah Mitchell", email: "sarah.m@email.com", phone: "+1 (555) 456-7890", property: "2BR Flat in Brooklyn", status: "cold", lastChat: "2 days ago", score: 42 },
    { id: 5, name: "William Harris", email: "w.harris@email.com", phone: "+44 7911 123456", property: "Studio in Chelsea, London", status: "warm", lastChat: "5 hours ago", score: 65 },
];

const RECENT_CHATS = [
    { id: 1, user: "James Wilson", message: "I'm interested in scheduling a visit for the Manhattan condo", time: "2 min ago", unread: true },
    { id: 2, user: "Emily Thompson", message: "Can you share more photos of the penthouse?", time: "1 hour ago", unread: true },
    { id: 3, user: "Michael Brown", message: "What's the best price you can offer?", time: "30 min ago", unread: false },
    { id: 4, user: "New Visitor", message: "Show me 3BR apartments in Downtown LA", time: "45 min ago", unread: true },
];

const PROPERTY_STATS = [
    { name: "3BR Manhattan Condo", views: 234, saves: 45, inquiries: 12 },
    { name: "Penthouse Beverly Hills", views: 189, saves: 67, inquiries: 8 },
    { name: "4BR Villa Hamptons", views: 156, saves: 34, inquiries: 15 },
    { name: "2BR Brooklyn Flat", views: 298, saves: 23, inquiries: 6 },
];

const ACTIVITIES = [
    { type: "lead", text: "New lead from website", user: "James Wilson", time: "2 min ago" },
    { type: "chat", text: "Chat completed", user: "Emily Thompson", time: "1 hour ago" },
    { type: "visit", text: "Site visit scheduled", user: "Michael Brown", time: "3 hours ago" },
    { type: "conversion", text: "Lead converted to booking", user: "Rachel Adams", time: "Yesterday" },
];

export default function RealEstateAdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedLead, setSelectedLead] = useState<typeof LEADS[0] | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "hot": return "bg-red-100 text-red-700";
            case "warm": return "bg-orange-100 text-orange-700";
            case "cold": return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "hot": return <Star className="w-3 h-3" />;
            case "warm": return <CheckCircle className="w-3 h-3" />;
            case "cold": return <AlertCircle className="w-3 h-3" />;
            default: return <XCircle className="w-3 h-3" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">DreamHomes</h1>
                            <p className="text-xs text-gray-500">Admin Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { id: "overview", label: "Overview", icon: BarChart3 },
                        { id: "leads", label: "Leads", icon: Users, badge: 12 },
                        { id: "chats", label: "Conversations", icon: MessageSquare, badge: 4 },
                        { id: "properties", label: "Properties", icon: Home },
                        { id: "analytics", label: "Analytics", icon: TrendingUp },
                        { id: "calendar", label: "Calendar", icon: Calendar },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {activeTab === "overview" && "Dashboard Overview"}
                                {activeTab === "leads" && "Lead Management"}
                                {activeTab === "chats" && "Conversations"}
                                {activeTab === "properties" && "Property Analytics"}
                                {activeTab === "analytics" && "Analytics"}
                                {activeTab === "calendar" && "Calendar"}
                            </h2>
                            <p className="text-gray-500 text-sm">Welcome back, Admin</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="relative p-2 hover:bg-gray-100 rounded-full">
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                A
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {STATS.map((stat, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${stat.color}`}>
                                                <stat.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className={`flex items-center gap-1 text-sm font-medium ${stat.up ? "text-green-600" : "text-red-600"}`}>
                                                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                {stat.change}
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                        <p className="text-gray-500 text-sm">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Recent Activity Overview */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Leads</h3>
                                    <div className="space-y-3">
                                        {LEADS.slice(0, 3).map((lead) => (
                                            <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{lead.name}</h4>
                                                        <p className="text-sm text-gray-500">{lead.property}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Activity</h3>
                                    <div className="space-y-4">
                                        {ACTIVITIES.map((activity, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === "lead" ? "bg-blue-500" :
                                                    activity.type === "chat" ? "bg-emerald-500" :
                                                        activity.type === "visit" ? "bg-purple-500" : "bg-orange-500"
                                                    }`} />
                                                <div>
                                                    <p className="text-sm text-gray-900">{activity.text}</p>
                                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* LEADS TAB */}
                    {activeTab === "leads" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900">All Leads ({LEADS.length})</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" placeholder="Search leads..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <Filter className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                                            + Add Lead
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property Interest</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {LEADS.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50" onClick={() => setSelectedLead(lead)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{lead.name}</p>
                                                        <p className="text-xs text-gray-500">{lead.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{lead.property}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lead.score}%` }} />
                                                    </div>
                                                    <span className="text-sm text-gray-600">{lead.score}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{lead.lastChat}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600"><Phone className="w-4 h-4" /></button>
                                                    <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Mail className="w-4 h-4" /></button>
                                                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CONVERSATIONS TAB */}
                    {activeTab === "chats" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                            {/* Chat List */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <div className="p-4 border-b border-gray-100">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" placeholder="Search conversations..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                                    {RECENT_CHATS.map((chat, idx) => (
                                        <div key={chat.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${idx === 0 ? "bg-emerald-50" : ""}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {chat.user.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-medium text-gray-900">{chat.user}</h4>
                                                        <span className="text-xs text-gray-400">{chat.time}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{chat.message}</p>
                                                </div>
                                                {chat.unread && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">J</div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">James Wilson</h4>
                                            <p className="text-xs text-emerald-600">Online</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone className="w-5 h-5 text-gray-600" /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                                    <div className="flex justify-start"><div className="bg-white rounded-2xl px-4 py-2 max-w-[70%] shadow-sm"><p className="text-sm">Hi, I'm interested in the 3BR condo in Manhattan</p></div></div>
                                    <div className="flex justify-end"><div className="bg-emerald-600 text-white rounded-2xl px-4 py-2 max-w-[70%]"><p className="text-sm">Hello James! Great choice. It's a premium property with excellent amenities.</p></div></div>
                                    <div className="flex justify-start"><div className="bg-white rounded-2xl px-4 py-2 max-w-[70%] shadow-sm"><p className="text-sm">Can I schedule a visit for this weekend?</p></div></div>
                                    <div className="flex justify-end"><div className="bg-emerald-600 text-white rounded-2xl px-4 py-2 max-w-[70%]"><p className="text-sm">Absolutely! Saturday or Sunday works best?</p></div></div>
                                </div>
                                <div className="p-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-2 border border-gray-200 rounded-xl" />
                                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Send</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROPERTIES TAB */}
                    {activeTab === "properties" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {PROPERTY_STATS.map((prop, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300" />
                                        <div className="p-4">
                                            <h4 className="font-bold text-gray-900 mb-3">{prop.name}</h4>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div><p className="text-lg font-bold text-gray-900">{prop.views}</p><p className="text-xs text-gray-500">Views</p></div>
                                                <div><p className="text-lg font-bold text-gray-900">{prop.saves}</p><p className="text-xs text-gray-500">Saves</p></div>
                                                <div><p className="text-lg font-bold text-gray-900">{prop.inquiries}</p><p className="text-xs text-gray-500">Inquiries</p></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === "analytics" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Sources</h3>
                                    <div className="space-y-4">
                                        {[{ name: "Website Chat", value: 45, color: "bg-emerald-500" }, { name: "Direct Calls", value: 28, color: "bg-blue-500" }, { name: "Social Media", value: 18, color: "bg-purple-500" }, { name: "Referrals", value: 9, color: "bg-orange-500" }].map((source, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-sm mb-1"><span>{source.name}</span><span className="font-medium">{source.value}%</span></div>
                                                <div className="h-2 bg-gray-200 rounded-full"><div className={`h-full ${source.color} rounded-full`} style={{ width: `${source.value}%` }} /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h3>
                                    <div className="space-y-3">
                                        {[{ stage: "Website Visitors", count: 8432 }, { stage: "Chat Initiated", count: 1284 }, { stage: "Lead Qualified", count: 456 }, { stage: "Site Visit", count: 189 }, { stage: "Converted", count: 89 }].map((stage, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                                                <div className="flex-1"><p className="font-medium text-gray-900">{stage.stage}</p></div>
                                                <p className="font-bold text-gray-900">{stage.count.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CALENDAR TAB */}
                    {activeTab === "calendar" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Site Visits</h3>
                            <div className="space-y-4">
                                {[{ date: "Today, 2:00 PM", client: "James Wilson", property: "3BR Manhattan Condo" }, { date: "Tomorrow, 11:00 AM", client: "Emily Thompson", property: "Penthouse Beverly Hills" }, { date: "Jan 20, 3:00 PM", client: "Michael Brown", property: "4BR Villa Hamptons" }].map((visit, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{visit.client}</p>
                                            <p className="text-sm text-gray-500">{visit.property}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-emerald-600">{visit.date}</p>
                                            <button className="text-sm text-gray-500 hover:text-gray-700">Reschedule</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lead Detail Slide-over */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedLead(null)} />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="relative w-96 bg-white shadow-2xl"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Lead Details</h3>
                                <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-gray-100 rounded">
                                    <XCircle className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {selectedLead.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedLead.name}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)}`}>
                                        {selectedLead.status.toUpperCase()} LEAD
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Info</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="w-4 h-4" />
                                        <span>{selectedLead.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="w-4 h-4" />
                                        <span>{selectedLead.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Interested Property</h4>
                                <p className="text-gray-900">{selectedLead.property}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Lead Score</h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${selectedLead.score}%` }}
                                        />
                                    </div>
                                    <span className="font-bold text-gray-900">{selectedLead.score}%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
                                    <Phone className="w-4 h-4" />
                                    Call
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 col-span-2">
                                    <Calendar className="w-4 h-4" />
                                    Schedule Visit
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
