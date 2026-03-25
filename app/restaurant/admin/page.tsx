"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UtensilsCrossed,
    ShoppingBag,
    Calendar,
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
    Clock,
    CheckCircle,
    XCircle,
    ChefHat,
    Flame,
    Timer,
    DollarSign,
    Star,
    MessageSquare,
    Bot,
    MapPin,
    Plus,
    Edit,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Coffee,
    Pizza,
    Soup,
    IceCream,
    Wine,
    Menu,
    X,
    UserCheck,
    Table2
} from "lucide-react";

// Mock Data
const STATS = [
    { label: "Today's Orders", value: "127", change: "+23%", up: true, icon: ShoppingBag, color: "bg-orange-500" },
    { label: "Revenue", value: "$4,850", change: "+18%", up: true, icon: DollarSign, color: "bg-emerald-500" },
    { label: "Reservations", value: "24", change: "+12%", up: true, icon: Calendar, color: "bg-blue-500" },
    { label: "AI Chats", value: "89", change: "+45%", up: true, icon: MessageSquare, color: "bg-purple-500" },
];

const LIVE_ORDERS = [
    { id: "ORD-401", table: "Table 5", items: ["Margherita Pizza", "Caesar Salad", "Tiramisu"], status: "preparing", time: "12 min", total: "$67.50", waiter: "John" },
    { id: "ORD-400", table: "Table 12", items: ["Grilled Salmon", "Wine"], status: "ready", time: "18 min", total: "$89.00", waiter: "Sarah" },
    { id: "ORD-399", table: "Takeaway", items: ["Pasta Carbonara x2", "Garlic Bread"], status: "new", time: "2 min", total: "$42.00", waiter: "Mike" },
    { id: "ORD-398", table: "Table 3", items: ["Steak Medium Rare", "Mashed Potatoes"], status: "served", time: "25 min", total: "$78.50", waiter: "Emma" },
    { id: "ORD-397", table: "Delivery", items: ["Family Combo", "Drinks x4"], status: "preparing", time: "8 min", total: "$124.00", waiter: "AI Bot" },
];

const RESERVATIONS = [
    { id: 1, name: "James Wilson", guests: 4, date: "Today", time: "7:00 PM", table: "Table 8", phone: "+1 555-1234", status: "confirmed", notes: "Anniversary dinner" },
    { id: 2, name: "Emily Thompson", guests: 2, date: "Today", time: "8:30 PM", table: "Table 3", phone: "+1 555-5678", status: "confirmed", notes: "" },
    { id: 3, name: "Michael Brown", guests: 6, date: "Tomorrow", time: "6:00 PM", table: "Private Room", phone: "+1 555-9012", status: "pending", notes: "Birthday party" },
    { id: 4, name: "Sarah Davis", guests: 3, date: "Tomorrow", time: "7:30 PM", table: "Patio", phone: "+1 555-3456", status: "confirmed", notes: "Vegetarian options" },
];

const MENU_ITEMS = [
    { id: 1, name: "Margherita Pizza", category: "Pizza", price: 18.99, available: true, popular: true, image: "🍕" },
    { id: 2, name: "Grilled Salmon", category: "Mains", price: 32.99, available: true, popular: true, image: "🐟" },
    { id: 3, name: "Caesar Salad", category: "Starters", price: 12.99, available: true, popular: false, image: "🥗" },
    { id: 4, name: "Tiramisu", category: "Desserts", price: 9.99, available: true, popular: true, image: "🍰" },
    { id: 5, name: "Pasta Carbonara", category: "Pasta", price: 19.99, available: true, popular: false, image: "🍝" },
    { id: 6, name: "House Wine", category: "Drinks", price: 8.99, available: true, popular: false, image: "🍷" },
    { id: 7, name: "Beef Steak", category: "Mains", price: 38.99, available: false, popular: true, image: "🥩" },
    { id: 8, name: "Chocolate Lava Cake", category: "Desserts", price: 11.99, available: true, popular: false, image: "🍫" },
];

const AI_CONVERSATIONS = [
    { id: 1, customer: "New Customer", message: "What's your best dish for vegetarians?", time: "2 min ago", resolved: true, type: "recommendation" },
    { id: 2, customer: "John M.", message: "I'd like to book a table for 4 tomorrow at 7pm", time: "5 min ago", resolved: true, type: "reservation" },
    { id: 3, customer: "Sarah K.", message: "Is the patio available for a birthday party?", time: "12 min ago", resolved: false, type: "inquiry" },
    { id: 4, customer: "Walk-in", message: "How long is the wait for a table?", time: "18 min ago", resolved: true, type: "inquiry" },
];

const TABLES = [
    { id: 1, name: "Table 1", seats: 2, status: "available" },
    { id: 2, name: "Table 2", seats: 2, status: "available" },
    { id: 3, name: "Table 3", seats: 4, status: "occupied" },
    { id: 4, name: "Table 4", seats: 4, status: "occupied" },
    { id: 5, name: "Table 5", seats: 4, status: "occupied" },
    { id: 6, name: "Table 6", seats: 6, status: "reserved" },
    { id: 7, name: "Table 7", seats: 6, status: "available" },
    { id: 8, name: "Table 8", seats: 8, status: "reserved" },
    { id: 9, name: "Patio 1", seats: 4, status: "available" },
    { id: 10, name: "Patio 2", seats: 6, status: "occupied" },
    { id: 11, name: "Private Room", seats: 12, status: "reserved" },
    { id: 12, name: "Bar", seats: 8, status: "available" },
];

export default function RestaurantAdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getOrderStatusColor = (status: string) => {
        switch (status) {
            case "new": return "bg-blue-100 text-blue-700";
            case "preparing": return "bg-yellow-100 text-yellow-700";
            case "ready": return "bg-green-100 text-green-700";
            case "served": return "bg-gray-100 text-gray-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getTableStatusColor = (status: string) => {
        switch (status) {
            case "available": return "bg-green-500";
            case "occupied": return "bg-red-500";
            case "reserved": return "bg-yellow-500";
            default: return "bg-gray-500";
        }
    };

    const navItems = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "orders", label: "Live Orders", icon: ShoppingBag, badge: 5 },
        { id: "reservations", label: "Reservations", icon: Calendar, badge: 3 },
        { id: "menu", label: "Menu", icon: UtensilsCrossed },
        { id: "tables", label: "Tables", icon: Table2 },
        { id: "ai-chats", label: "AI Chats", icon: Bot },
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
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
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
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Bella Italia</h1>
                                <p className="text-xs text-gray-500">Restaurant Dashboard</p>
                            </div>
                        </div>
                        <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(false)}>
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
                                ? "bg-orange-50 text-orange-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{item.badge}</span>
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
                            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h2 className="text-lg lg:text-2xl font-bold text-gray-900">
                                    {activeTab === "overview" && "Dashboard Overview"}
                                    {activeTab === "orders" && "Live Orders"}
                                    {activeTab === "reservations" && "Reservations"}
                                    {activeTab === "menu" && "Menu Management"}
                                    {activeTab === "tables" && "Table Layout"}
                                    {activeTab === "ai-chats" && "AI Conversations"}
                                    {activeTab === "analytics" && "Analytics"}
                                </h2>
                                <p className="text-gray-500 text-xs lg:text-sm hidden sm:block">Manage your restaurant</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-4">
                            <button className="relative p-2 hover:bg-gray-100 rounded-full">
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                M
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                                {STATS.map((stat, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100"
                                    >
                                        <div className="flex items-start justify-between mb-3 lg:mb-4">
                                            <div className={`p-2 lg:p-3 rounded-xl ${stat.color}`}>
                                                <stat.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs lg:text-sm font-medium ${stat.up ? "text-green-600" : "text-red-600"}`}>
                                                {stat.up ? <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" /> : <ArrowDownRight className="w-3 h-3 lg:w-4 lg:h-4" />}
                                                {stat.change}
                                            </div>
                                        </div>
                                        <h3 className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                        <p className="text-gray-500 text-xs lg:text-sm">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Live Orders & Recent Reservations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <div className="p-4 lg:p-6 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-5 h-5 text-orange-500" />
                                            <h3 className="text-lg font-bold text-gray-900">Live Orders</h3>
                                        </div>
                                        <button onClick={() => setActiveTab("orders")} className="text-sm text-orange-600 hover:underline">View All</button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {LIVE_ORDERS.slice(0, 3).map((order) => (
                                            <div key={order.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{order.id}</span>
                                                        <span className="text-gray-500">•</span>
                                                        <span className="text-gray-600">{order.table}</span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">{order.items.join(", ")}</p>
                                                <div className="flex items-center justify-between mt-2 text-sm">
                                                    <span className="text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3" />{order.time}</span>
                                                    <span className="font-bold text-gray-900">{order.total}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <div className="p-4 lg:p-6 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-500" />
                                            <h3 className="text-lg font-bold text-gray-900">Today's Reservations</h3>
                                        </div>
                                        <button onClick={() => setActiveTab("reservations")} className="text-sm text-orange-600 hover:underline">View All</button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {RESERVATIONS.filter(r => r.date === "Today").map((res) => (
                                            <div key={res.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-gray-900">{res.name}</h4>
                                                    <span className="text-orange-600 font-medium">{res.time}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{res.guests} guests</span>
                                                    <span>{res.table}</span>
                                                </div>
                                                {res.notes && <p className="text-xs text-gray-500 mt-1 italic">"{res.notes}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* LIVE ORDERS TAB */}
                    {activeTab === "orders" && (
                        <div className="space-y-4">
                            {LIVE_ORDERS.map((order) => (
                                <div key={order.id} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-bold text-gray-900">{order.id}</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                <span className="text-gray-500 flex items-center gap-1"><Timer className="w-4 h-4" />{order.time}</span>
                                            </div>
                                            <p className="text-gray-600 mb-2"><strong>{order.table}</strong> • Waiter: {order.waiter}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-gray-900">{order.total}</span>
                                            <div className="flex gap-2">
                                                {order.status === "new" && (
                                                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium">Start Preparing</button>
                                                )}
                                                {order.status === "preparing" && (
                                                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">Mark Ready</button>
                                                )}
                                                {order.status === "ready" && (
                                                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">Mark Served</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* RESERVATIONS TAB */}
                    {activeTab === "reservations" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">All Reservations</h3>
                                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2">
                                    <Plus className="w-4 h-4" />Add Reservation
                                </button>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {RESERVATIONS.map((res) => (
                                        <div key={res.id} className="p-4 lg:p-6 hover:bg-gray-50">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-gray-900">{res.name}</h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${res.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                            }`}>
                                                            {res.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{res.date} at {res.time}</span>
                                                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{res.guests} guests</span>
                                                        <span className="flex items-center gap-1"><Table2 className="w-4 h-4" />{res.table}</span>
                                                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{res.phone}</span>
                                                    </div>
                                                    {res.notes && <p className="text-sm text-gray-500 mt-2">Note: {res.notes}</p>}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone className="w-5 h-5 text-gray-600" /></button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-5 h-5 text-gray-600" /></button>
                                                    <button className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5 text-red-600" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MENU TAB */}
                    {activeTab === "menu" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Menu Items</h3>
                                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2">
                                    <Plus className="w-4 h-4" />Add Item
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {MENU_ITEMS.map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="h-24 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center text-5xl">
                                            {item.image}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                {item.popular && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-orange-600">${item.price}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                    }`}>
                                                    {item.available ? "Available" : "Out of Stock"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TABLES TAB */}
                    {activeTab === "tables" && (
                        <div>
                            <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500" /><span className="text-sm">Available</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500" /><span className="text-sm">Occupied</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500" /><span className="text-sm">Reserved</span></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {TABLES.map((table) => (
                                    <div key={table.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow cursor-pointer">
                                        <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white ${getTableStatusColor(table.status)}`}>
                                            <Table2 className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-gray-900">{table.name}</h4>
                                        <p className="text-sm text-gray-500">{table.seats} seats</p>
                                        <p className="text-sm font-medium mt-2 capitalize">{table.status}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI CHATS TAB */}
                    {activeTab === "ai-chats" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900">Recent Conversations</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {AI_CONVERSATIONS.map((chat) => (
                                        <div key={chat.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900">{chat.customer}</span>
                                                <span className="text-xs text-gray-400">{chat.time}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">{chat.message}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${chat.type === "reservation" ? "bg-blue-100 text-blue-700" :
                                                        chat.type === "recommendation" ? "bg-purple-100 text-purple-700" :
                                                            "bg-gray-100 text-gray-700"
                                                    }`}>{chat.type}</span>
                                                {chat.resolved && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Resolved</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">AI Performance</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-orange-50 rounded-xl text-center">
                                        <p className="text-3xl font-bold text-orange-600">89</p>
                                        <p className="text-sm text-gray-600">Chats Today</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-xl text-center">
                                        <p className="text-3xl font-bold text-green-600">92%</p>
                                        <p className="text-sm text-gray-600">Resolved by AI</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                                        <p className="text-3xl font-bold text-blue-600">12</p>
                                        <p className="text-sm text-gray-600">Reservations Made</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl text-center">
                                        <p className="text-3xl font-bold text-purple-600">2.3s</p>
                                        <p className="text-sm text-gray-600">Avg Response Time</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === "analytics" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Dishes</h3>
                                <div className="space-y-3">
                                    {[{ name: "Margherita Pizza", orders: 145, trend: "+12%" }, { name: "Grilled Salmon", orders: 98, trend: "+8%" }, { name: "Tiramisu", orders: 87, trend: "+15%" }].map((dish, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">{idx + 1}</span>
                                                <span className="font-medium">{dish.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{dish.orders} orders</p>
                                                <p className="text-xs text-green-600">{dish.trend}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Category</h3>
                                <div className="space-y-4">
                                    {[{ cat: "Mains", pct: 45 }, { cat: "Drinks", pct: 25 }, { cat: "Desserts", pct: 18 }, { cat: "Starters", pct: 12 }].map((item) => (
                                        <div key={item.cat}>
                                            <div className="flex justify-between text-sm mb-1"><span>{item.cat}</span><span className="font-medium">{item.pct}%</span></div>
                                            <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${item.pct}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
