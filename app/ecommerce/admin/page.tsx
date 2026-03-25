"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingCart,
    MessageSquare,
    Package,
    Users,
    TrendingUp,
    BarChart3,
    Settings,
    LogOut,
    Bell,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    Eye,
    RefreshCw,
    CheckCircle,
    Clock,
    XCircle,
    Truck,
    CreditCard,
    Star,
    Gift,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Heart,
    ExternalLink,
    Sparkles,
    Bot,
    Headphones,
    Box,
    Menu,
    X
} from "lucide-react";

// Mock Data
const STATS = [
    { label: "Total Orders", value: "2,847", change: "+18.2%", up: true, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Revenue", value: "$128,450", change: "+24.5%", up: true, icon: CreditCard, color: "bg-emerald-500" },
    { label: "Active Chats", value: "23", change: "+5.3%", up: true, icon: MessageSquare, color: "bg-purple-500" },
    { label: "Conversion Rate", value: "4.2%", change: "-0.8%", up: false, icon: TrendingUp, color: "bg-orange-500" },
];

const ORDERS = [
    { id: "ORD-7821", customer: "Emma Watson", email: "emma@email.com", items: 3, total: "$245.00", status: "delivered", date: "2 hours ago" },
    { id: "ORD-7820", customer: "John Smith", email: "john@email.com", items: 1, total: "$89.99", status: "shipped", date: "4 hours ago" },
    { id: "ORD-7819", customer: "Sarah Johnson", email: "sarah@email.com", items: 5, total: "$567.50", status: "processing", date: "6 hours ago" },
    { id: "ORD-7818", customer: "Mike Brown", email: "mike@email.com", items: 2, total: "$156.00", status: "pending", date: "8 hours ago" },
    { id: "ORD-7817", customer: "Lisa Davis", email: "lisa@email.com", items: 1, total: "$49.99", status: "cancelled", date: "Yesterday" },
];

const CONVERSATIONS = [
    { id: 1, customer: "Emma Watson", message: "When will my order arrive? Tracking shows no updates.", time: "2 min ago", unread: true, type: "support", aiHandled: true },
    { id: 2, customer: "New Visitor", message: "Looking for a gift for my wife, budget $200", time: "8 min ago", unread: true, type: "recommendation", aiHandled: true },
    { id: 3, customer: "John Smith", message: "I want to return the blue jacket, wrong size", time: "15 min ago", unread: false, type: "support", aiHandled: false },
    { id: 4, customer: "Sarah Johnson", message: "Do you have this dress in red?", time: "1 hour ago", unread: false, type: "recommendation", aiHandled: true },
];

const PRODUCTS = [
    { id: 1, name: "Premium Leather Jacket", price: "$299", stock: 45, sold: 234, rating: 4.8, image: "🧥" },
    { id: 2, name: "Wireless Headphones Pro", price: "$189", stock: 12, sold: 567, rating: 4.9, image: "🎧" },
    { id: 3, name: "Smart Watch Elite", price: "$399", stock: 8, sold: 189, rating: 4.7, image: "⌚" },
    { id: 4, name: "Designer Sunglasses", price: "$159", stock: 67, sold: 345, rating: 4.6, image: "🕶️" },
];

const AI_MODES = [
    { id: "support", name: "Customer Support", icon: Headphones, color: "bg-blue-500", active: true, chats: 15, resolved: 89 },
    { id: "recommend", name: "Product Recommendations", icon: Sparkles, color: "bg-purple-500", active: true, chats: 8, resolved: 94 },
    { id: "orders", name: "Order Management", icon: Box, color: "bg-orange-500", active: true, chats: 12, resolved: 92 },
];

const INTEGRATIONS = [
    { name: "Shopify", status: "connected", icon: "🛍️", orders: 1245 },
    { name: "WooCommerce", status: "connected", icon: "🛒", orders: 892 },
    { name: "Custom API", status: "connected", icon: "⚡", orders: 710 },
];

export default function EcommerceAdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedOrder, setSelectedOrder] = useState<typeof ORDERS[0] | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered": return "bg-green-100 text-green-700";
            case "shipped": return "bg-blue-100 text-blue-700";
            case "processing": return "bg-yellow-100 text-yellow-700";
            case "pending": return "bg-gray-100 text-gray-700";
            case "cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "delivered": return <CheckCircle className="w-3 h-3" />;
            case "shipped": return <Truck className="w-3 h-3" />;
            case "processing": return <RefreshCw className="w-3 h-3" />;
            case "pending": return <Clock className="w-3 h-3" />;
            case "cancelled": return <XCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const navItems = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "orders", label: "Orders", icon: Package, badge: 5 },
        { id: "conversations", label: "Conversations", icon: MessageSquare, badge: 3 },
        { id: "customers", label: "Customers", icon: Users },
        { id: "products", label: "Products", icon: ShoppingCart },
        { id: "ai-modes", label: "AI Modes", icon: Bot },
        { id: "integrations", label: "Integrations", icon: Zap },
        { id: "analytics", label: "Analytics", icon: TrendingUp },
    ];

    const handleNavClick = (tabId: string) => {
        setActiveTab(tabId);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-200 flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 lg:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">ShopAI</h1>
                                <p className="text-xs text-gray-500">E-commerce Dashboard</p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                ? "bg-indigo-50 text-indigo-700"
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
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Hamburger Menu */}
                            <button
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h2 className="text-lg lg:text-2xl font-bold text-gray-900">
                                    {activeTab === "overview" && "Dashboard Overview"}
                                    {activeTab === "orders" && "Order Management"}
                                    {activeTab === "conversations" && "Customer Conversations"}
                                    {activeTab === "customers" && "Customer Directory"}
                                    {activeTab === "products" && "Product Catalog"}
                                    {activeTab === "ai-modes" && "AI Mode Settings"}
                                    {activeTab === "integrations" && "Platform Integrations"}
                                    {activeTab === "analytics" && "Analytics & Reports"}
                                </h2>
                                <p className="text-gray-500 text-xs lg:text-sm hidden sm:block">Manage your AI-powered e-commerce</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-4">
                            <button className="relative p-2 hover:bg-gray-100 rounded-full">
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm lg:text-base">
                                A
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
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

                            {/* AI Modes Overview */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">AI Modes Performance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {AI_MODES.map((mode) => (
                                        <div key={mode.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${mode.color}`}>
                                                        <mode.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{mode.name}</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${mode.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                                    {mode.active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div><p className="text-2xl font-bold text-gray-900">{mode.chats}</p><p className="text-xs text-gray-500">Active Chats</p></div>
                                                <div><p className="text-2xl font-bold text-green-600">{mode.resolved}%</p><p className="text-xs text-gray-500">AI Resolved</p></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Orders & Conversations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                                        <button onClick={() => setActiveTab("orders")} className="text-sm text-indigo-600 hover:underline">View All</button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {ORDERS.slice(0, 3).map((order) => (
                                            <div key={order.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{order.id}</p>
                                                        <p className="text-sm text-gray-500">{order.customer}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">{order.total}</p>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                            {getStatusIcon(order.status)}
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-900">Recent Conversations</h3>
                                        <button onClick={() => setActiveTab("conversations")} className="text-sm text-indigo-600 hover:underline">View All</button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {CONVERSATIONS.slice(0, 3).map((chat) => (
                                            <div key={chat.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {chat.customer.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-gray-900">{chat.customer}</h4>
                                                            <div className="flex items-center gap-2">
                                                                {chat.aiHandled && <Bot className="w-4 h-4 text-purple-500" />}
                                                                <span className="text-xs text-gray-400">{chat.time}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-500 truncate">{chat.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === "orders" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-4 lg:p-6 border-b border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h3 className="text-lg font-bold text-gray-900">All Orders</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1 sm:flex-initial">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" placeholder="Search orders..." className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
                                        </div>
                                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <Filter className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Cards View */}
                            <div className="lg:hidden divide-y divide-gray-100">
                                {ORDERS.map((order) => (
                                    <div key={order.id} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-indigo-600">{order.id}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900">{order.customer}</p>
                                        <p className="text-xs text-gray-500 mb-2">{order.email}</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">{order.items} items</span>
                                            <span className="font-bold text-gray-900">{order.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                            <span className="text-xs text-gray-400">{order.date}</span>
                                            <button className="p-1.5 hover:bg-gray-100 rounded"><Eye className="w-4 h-4 text-gray-600" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {ORDERS.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-indigo-600">{order.id}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{order.customer}</p>
                                                    <p className="text-xs text-gray-500">{order.email}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{order.items} items</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{order.total}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                                                <td className="px-6 py-4">
                                                    <button className="p-1.5 hover:bg-gray-100 rounded"><Eye className="w-4 h-4 text-gray-600" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CONVERSATIONS TAB */}
                    {activeTab === "conversations" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[500px] lg:h-[calc(100vh-200px)]">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <div className="p-4 border-b border-gray-100">
                                    <input type="text" placeholder="Search conversations..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                                    {CONVERSATIONS.map((chat, idx) => (
                                        <div key={chat.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${idx === 0 ? "bg-indigo-50" : ""}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {chat.customer.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-medium text-gray-900">{chat.customer}</h4>
                                                        <span className="text-xs text-gray-400">{chat.time}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{chat.message}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${chat.type === "support" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                                            {chat.type === "support" ? "Support" : "Recommendation"}
                                                        </span>
                                                        {chat.aiHandled && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1"><Bot className="w-3 h-3" />AI</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">E</div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Emma Watson</h4>
                                            <p className="text-xs text-indigo-600 flex items-center gap-1"><Bot className="w-3 h-3" />Handled by AI</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg">Take Over</button>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                                    <div className="flex justify-start"><div className="bg-white rounded-2xl px-4 py-2 max-w-[70%] shadow-sm"><p className="text-sm">When will my order arrive? Tracking shows no updates.</p></div></div>
                                    <div className="flex justify-end"><div className="bg-indigo-600 text-white rounded-2xl px-4 py-2 max-w-[70%]"><p className="text-sm">Hi Emma! Let me check your order ORD-7821 for you. 📦</p><p className="text-xs mt-1 opacity-75">🤖 AI Response</p></div></div>
                                    <div className="flex justify-end"><div className="bg-indigo-600 text-white rounded-2xl px-4 py-2 max-w-[70%]"><p className="text-sm">Your order was shipped and is currently in transit. Expected delivery: Tomorrow by 5 PM.</p><p className="text-xs mt-1 opacity-75">🤖 AI Response</p></div></div>
                                    <div className="flex justify-start"><div className="bg-white rounded-2xl px-4 py-2 max-w-[70%] shadow-sm"><p className="text-sm">Great, thank you!</p></div></div>
                                </div>
                                <div className="p-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-2 border border-gray-200 rounded-xl" />
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Send</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === "products" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {PRODUCTS.map((product) => (
                                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl">
                                        {product.image}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-gray-900 mb-1">{product.name}</h4>
                                        <p className="text-lg font-bold text-indigo-600 mb-3">{product.price}</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`${product.stock < 15 ? "text-red-600" : "text-gray-600"}`}>{product.stock} in stock</span>
                                            <span className="flex items-center gap-1 text-yellow-600"><Star className="w-4 h-4 fill-current" />{product.rating}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">{product.sold} sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI MODES TAB */}
                    {activeTab === "ai-modes" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {AI_MODES.map((mode) => (
                                    <div key={mode.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-xl ${mode.color}`}>
                                                    <mode.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="font-bold text-gray-900">{mode.name}</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={mode.active} className="sr-only peer" readOnly />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between"><span className="text-gray-600">Active Chats</span><span className="font-bold">{mode.chats}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">AI Resolution Rate</span><span className="font-bold text-green-600">{mode.resolved}%</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Escalated</span><span className="font-bold text-orange-600">{100 - mode.resolved}%</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* INTEGRATIONS TAB */}
                    {activeTab === "integrations" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {INTEGRATIONS.map((integration) => (
                                <div key={integration.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-4xl">{integration.icon}</span>
                                            <h3 className="font-bold text-gray-900">{integration.name}</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${integration.status === "connected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                            {integration.status}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between"><span className="text-gray-600">Orders Synced</span><span className="font-bold">{integration.orders.toLocaleString()}</span></div>
                                        <button className="w-full py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2">
                                            <Settings className="w-4 h-4" />Configure
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === "analytics" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Sales by Channel</h3>
                                <div className="space-y-4">
                                    {[{ name: "Shopify", value: 45 }, { name: "WooCommerce", value: 32 }, { name: "Custom API", value: 23 }].map((channel) => (
                                        <div key={channel.name}>
                                            <div className="flex justify-between text-sm mb-1"><span>{channel.name}</span><span className="font-medium">{channel.value}%</span></div>
                                            <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${channel.value}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">AI Performance</h3>
                                <div className="space-y-3">
                                    {[{ metric: "Total Conversations", value: "2,456" }, { metric: "AI Resolved", value: "2,198 (89%)" }, { metric: "Escalated to Human", value: "258 (11%)" }, { metric: "Avg Response Time", value: "< 2 seconds" }].map((item) => (
                                        <div key={item.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600">{item.metric}</span>
                                            <span className="font-bold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CUSTOMERS TAB */}
                    {activeTab === "customers" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Customer Directory</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {ORDERS.map((order) => (
                                    <div key={order.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {order.customer.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{order.customer}</h4>
                                                <p className="text-sm text-gray-500">{order.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600"><Mail className="w-5 h-5" /></button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
