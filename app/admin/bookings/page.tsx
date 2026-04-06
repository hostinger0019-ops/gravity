"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──
type Booking = {
    id: string;
    chatbot_id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    service_name?: string;
    booking_date: string;
    booking_time: string;
    duration_minutes: number;
    status: string;
    notes?: string;
    source: string;
    created_at: string;
};

type BotInfo = {
    id: string;
    name: string;
};

// ── Status badge colors ──
function statusBadge(status: string) {
    const map: Record<string, string> = {
        confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        completed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
        cancelled: "bg-red-500/15 text-red-400 border-red-500/25",
        no_show: "bg-gray-500/15 text-gray-400 border-gray-500/25",
    };
    return map[status] || map.pending;
}

function sourceBadge(source: string) {
    const map: Record<string, { bg: string; label: string }> = {
        chat: { bg: "bg-violet-500/15 text-violet-400", label: "💬 Chat" },
        voice: { bg: "bg-sky-500/15 text-sky-400", label: "🎙️ Voice" },
        manual: { bg: "bg-gray-500/15 text-gray-400", label: "✏️ Manual" },
    };
    return map[source] || map.chat;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bots, setBots] = useState<BotInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [botFilter, setBotFilter] = useState<string>("");
    const [total, setTotal] = useState(0);

    // Fetch bots for the filter dropdown
    useEffect(() => {
        fetch("/api/admin/chatbots")
            .then((r) => r.json())
            .then((d) => setBots(d.chatbots || d || []))
            .catch(() => {});
    }, []);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const params = new URLSearchParams();
            if (botFilter) params.set("botId", botFilter);
            if (statusFilter) params.set("status", statusFilter);
            if (filter === "upcoming") params.set("dateFrom", today);
            if (filter === "past") params.set("dateTo", today);
            params.set("pageSize", "100");

            const res = await fetch(`/api/admin/bookings?${params.toString()}`);
            const data = await res.json();
            setBookings(data.bookings || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        } finally {
            setLoading(false);
        }
    }, [filter, statusFilter, botFilter]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const updateBookingStatus = async (id: string, newStatus: string) => {
        try {
            await fetch(`/api/admin/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchBookings();
        } catch (err) {
            console.error("Failed to update booking:", err);
        }
    };

    const deleteBooking = async (id: string) => {
        if (!confirm("Delete this booking permanently?")) return;
        try {
            await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
            fetchBookings();
        } catch (err) {
            console.error("Failed to delete booking:", err);
        }
    };

    // Stats
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const pendingCount = bookings.filter((b) => b.status === "pending").length;
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = bookings.filter((b) => b.booking_date === todayStr).length;

    const getBotName = (chatbotId: string) => {
        const bot = bots.find((b) => b.id === chatbotId);
        return bot?.name || "Unknown Agent";
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            📅 Bookings
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Appointments booked by your AI agents
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/agents"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all"
                        >
                            ← Back to Agents
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total", value: total, color: "from-violet-500/20 to-violet-600/5", icon: "📊" },
                        { label: "Confirmed", value: confirmedCount, color: "from-emerald-500/20 to-emerald-600/5", icon: "✅" },
                        { label: "Pending", value: pendingCount, color: "from-amber-500/20 to-amber-600/5", icon: "⏳" },
                        { label: "Today", value: todayCount, color: "from-blue-500/20 to-blue-600/5", icon: "📅" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className={`rounded-2xl bg-gradient-to-br ${stat.color} border border-white/[0.06] p-5`}
                        >
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-3xl font-bold text-white">{stat.value}</div>
                            <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    {/* Time filter */}
                    <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-0.5">
                        {(["upcoming", "all", "past"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    filter === f
                                        ? "bg-white/15 text-white"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-white/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                    </select>

                    {/* Bot filter */}
                    <select
                        value={botFilter}
                        onChange={(e) => setBotFilter(e.target.value)}
                        className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-white/20"
                    >
                        <option value="">All Agents</option>
                        {bots.map((bot) => (
                            <option key={bot.id} value={bot.id}>
                                {bot.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 animate-pulse"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10" />
                                    <div className="flex-1">
                                        <div className="h-5 w-40 bg-white/10 rounded mb-2" />
                                        <div className="h-4 w-28 bg-white/10 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && bookings.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-4xl">
                            📅
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            No bookings yet
                        </h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            When your AI agents book appointments, they'll appear here.
                            Enable bookings in your agent settings to get started.
                        </p>
                    </div>
                )}

                {/* Bookings List */}
                {!loading && bookings.length > 0 && (
                    <div className="space-y-3">
                        {bookings.map((booking) => {
                            const dateObj = new Date(booking.booking_date + "T" + booking.booking_time);
                            const dateStr = dateObj.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            });
                            const timeStr = dateObj.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            });
                            const src = sourceBadge(booking.source);

                            return (
                                <div
                                    key={booking.id}
                                    className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 hover:bg-white/[0.04] transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Date/Time */}
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex flex-col items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-violet-300 uppercase">
                                                    {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                                                </span>
                                                <span className="text-lg font-bold text-white leading-none">
                                                    {dateObj.getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{dateStr}</div>
                                                <div className="text-sm text-gray-400">
                                                    🕐 {timeStr} · {booking.duration_minutes}min
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">
                                                {booking.customer_name}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-3 flex-wrap">
                                                {booking.service_name && (
                                                    <span>✂️ {booking.service_name}</span>
                                                )}
                                                {booking.customer_email && (
                                                    <span>📧 {booking.customer_email}</span>
                                                )}
                                                {booking.customer_phone && (
                                                    <span>📱 {booking.customer_phone}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Agent Name */}
                                        <div className="text-sm text-gray-500 hidden lg:block min-w-[120px]">
                                            🤖 {getBotName(booking.chatbot_id)}
                                        </div>

                                        {/* Status + Source */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(booking.status)}`}>
                                                {booking.status.replace("_", " ")}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${src.bg}`}>
                                                {src.label}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {booking.status === "pending" && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                                    className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                                                    title="Confirm"
                                                >
                                                    ✅
                                                </button>
                                            )}
                                            {booking.status === "confirmed" && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, "completed")}
                                                    className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                    title="Mark Complete"
                                                >
                                                    ✔️
                                                </button>
                                            )}
                                            {(booking.status === "pending" || booking.status === "confirmed") && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                    title="Cancel"
                                                >
                                                    ❌
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteBooking(booking.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/50 transition-colors"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {booking.notes && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.05] text-sm text-gray-500">
                                            📝 {booking.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
