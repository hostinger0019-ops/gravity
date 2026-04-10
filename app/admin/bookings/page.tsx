"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

function statusDot(status: string) {
    const map: Record<string, string> = {
        confirmed: "bg-emerald-400",
        pending: "bg-amber-400",
        completed: "bg-blue-400",
        cancelled: "bg-red-400",
        no_show: "bg-gray-400",
    };
    return map[status] || "bg-gray-400";
}

function sourceBadge(source: string) {
    const map: Record<string, { bg: string; label: string }> = {
        chat: { bg: "bg-violet-500/15 text-violet-400", label: "💬 Chat" },
        voice: { bg: "bg-sky-500/15 text-sky-400", label: "🎙️ Voice" },
        manual: { bg: "bg-gray-500/15 text-gray-400", label: "✏️ Manual" },
    };
    return map[source] || map.chat;
}

// ── Calendar Helpers ──
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

function formatMonth(year: number, month: number): string {
    return new Date(year, month).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bots, setBots] = useState<BotInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [botFilter, setBotFilter] = useState<string>("");
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

    // Calendar state
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [allMonthBookings, setAllMonthBookings] = useState<Booking[]>([]);

    // Fetch bots for the filter dropdown
    useEffect(() => {
        fetch("/api/admin/chatbots")
            .then((r) => r.json())
            .then((d) => setBots(d.chatbots || d || []))
            .catch(() => {});
    }, []);

    // Fetch bookings for list view
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const todayStr = new Date().toISOString().split("T")[0];
            const params = new URLSearchParams();
            if (botFilter) params.set("botId", botFilter);
            if (statusFilter) params.set("status", statusFilter);
            if (filter === "upcoming") params.set("dateFrom", todayStr);
            if (filter === "past") params.set("dateTo", todayStr);
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

    // Fetch bookings for calendar month
    const fetchMonthBookings = useCallback(async () => {
        try {
            const dateFrom = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
            const lastDay = getDaysInMonth(calYear, calMonth);
            const dateTo = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
            const params = new URLSearchParams();
            params.set("dateFrom", dateFrom);
            params.set("dateTo", dateTo);
            params.set("pageSize", "200");
            if (botFilter) params.set("botId", botFilter);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/bookings?${params.toString()}`);
            const data = await res.json();
            setAllMonthBookings(data.bookings || []);
        } catch {
            setAllMonthBookings([]);
        }
    }, [calYear, calMonth, botFilter, statusFilter]);

    useEffect(() => {
        if (viewMode === "calendar") fetchMonthBookings();
    }, [viewMode, fetchMonthBookings]);

    // Group bookings by date for calendar
    const bookingsByDate = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        for (const b of allMonthBookings) {
            const key = b.booking_date;
            if (!map[key]) map[key] = [];
            map[key].push(b);
        }
        return map;
    }, [allMonthBookings]);

    // Selected day bookings
    const selectedDayBookings = useMemo(() => {
        if (!selectedDate) return [];
        return (bookingsByDate[selectedDate] || []).sort((a, b) =>
            a.booking_time.localeCompare(b.booking_time)
        );
    }, [selectedDate, bookingsByDate]);

    const updateBookingStatus = async (id: string, newStatus: string) => {
        try {
            await fetch(`/api/admin/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchBookings();
            fetchMonthBookings();
        } catch (err) {
            console.error("Failed to update booking:", err);
        }
    };

    const deleteBooking = async (id: string) => {
        if (!confirm("Delete this booking permanently?")) return;
        try {
            await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
            fetchBookings();
            fetchMonthBookings();
        } catch (err) {
            console.error("Failed to delete booking:", err);
        }
    };

    // Stats
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const pendingCount = bookings.filter((b) => b.status === "pending").length;
    const todayStr = toDateKey(today);
    const todayCount = bookings.filter((b) => b.booking_date === todayStr).length;

    const getBotName = (chatbotId: string) => {
        const bot = bots.find((b) => b.id === chatbotId);
        return bot?.name || "Unknown Agent";
    };

    // Calendar month navigation
    const prevMonth = () => {
        if (calMonth === 0) {
            setCalMonth(11);
            setCalYear(calYear - 1);
        } else {
            setCalMonth(calMonth - 1);
        }
        setSelectedDate(null);
    };
    const nextMonth = () => {
        if (calMonth === 11) {
            setCalMonth(0);
            setCalYear(calYear + 1);
        } else {
            setCalMonth(calMonth + 1);
        }
        setSelectedDate(null);
    };
    const goToday = () => {
        setCalYear(today.getFullYear());
        setCalMonth(today.getMonth());
        setSelectedDate(toDateKey(today));
    };

    // Build calendar grid
    const calendarGrid = useMemo(() => {
        const daysInMonth = getDaysInMonth(calYear, calMonth);
        const firstDay = getFirstDayOfWeek(calYear, calMonth);
        const cells: Array<{ day: number | null; dateKey: string }> = [];

        // Leading empty cells
        for (let i = 0; i < firstDay; i++) {
            cells.push({ day: null, dateKey: "" });
        }
        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({ day: d, dateKey });
        }
        // Trailing empty cells
        while (cells.length % 7 !== 0) {
            cells.push({ day: null, dateKey: "" });
        }
        return cells;
    }, [calYear, calMonth]);

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
                        {/* View Toggle */}
                        <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-0.5">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                    viewMode === "list"
                                        ? "bg-white/15 text-white"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                ☰ List
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                    viewMode === "calendar"
                                        ? "bg-white/15 text-white"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                📅 Calendar
                            </button>
                        </div>
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

                {/* ═══════════════════════════════════════════════ */}
                {/* CALENDAR VIEW                                  */}
                {/* ═══════════════════════════════════════════════ */}
                {viewMode === "calendar" && (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Calendar Grid */}
                        <div className="flex-1">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-5">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-gray-300 hover:text-white"
                                >
                                    ←
                                </button>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white">
                                        {formatMonth(calYear, calMonth)}
                                    </h2>
                                    <button
                                        onClick={goToday}
                                        className="px-3 py-1 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition-all border border-violet-500/20"
                                    >
                                        Today
                                    </button>
                                </div>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-gray-300 hover:text-white"
                                >
                                    →
                                </button>
                            </div>

                            {/* Filters for calendar */}
                            <div className="flex flex-wrap items-center gap-3 mb-5">
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

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {WEEKDAYS.map((d) => (
                                    <div
                                        key={d}
                                        className="text-center text-xs font-semibold text-gray-500 py-2"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar cells */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarGrid.map((cell, idx) => {
                                    if (cell.day === null) {
                                        return (
                                            <div
                                                key={`empty-${idx}`}
                                                className="aspect-square rounded-xl bg-white/[0.01]"
                                            />
                                        );
                                    }

                                    const dayBookings = bookingsByDate[cell.dateKey] || [];
                                    const count = dayBookings.length;
                                    const isToday = cell.dateKey === todayStr;
                                    const isSelected = cell.dateKey === selectedDate;
                                    const isPast = new Date(cell.dateKey) < new Date(todayStr);
                                    const hasConfirmed = dayBookings.some((b) => b.status === "confirmed");
                                    const hasPending = dayBookings.some((b) => b.status === "pending");

                                    return (
                                        <button
                                            key={cell.dateKey}
                                            onClick={() =>
                                                setSelectedDate(
                                                    selectedDate === cell.dateKey ? null : cell.dateKey
                                                )
                                            }
                                            className={`
                                                aspect-square rounded-xl border transition-all relative flex flex-col items-center justify-center gap-1 group
                                                ${isSelected
                                                    ? "bg-violet-500/20 border-violet-500/40 ring-1 ring-violet-500/30"
                                                    : isToday
                                                    ? "bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20"
                                                    : count > 0
                                                    ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]"
                                                    : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.04]"
                                                }
                                                ${isPast && !isToday ? "opacity-50" : ""}
                                            `}
                                        >
                                            {/* Day number */}
                                            <span
                                                className={`text-sm font-semibold ${
                                                    isToday
                                                        ? "text-blue-400"
                                                        : isSelected
                                                        ? "text-violet-300"
                                                        : "text-gray-300"
                                                }`}
                                            >
                                                {cell.day}
                                            </span>

                                            {/* Booking dots */}
                                            {count > 0 && (
                                                <div className="flex items-center gap-0.5">
                                                    {hasConfirmed && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    )}
                                                    {hasPending && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                    )}
                                                    {count > 2 && (
                                                        <span className="text-[10px] text-gray-400 ml-0.5">
                                                            +{count}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Booking count badge */}
                                            {count > 0 && (
                                                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-violet-500/30 text-violet-300 text-[10px] font-bold flex items-center justify-center">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmed
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" /> Today
                                </span>
                            </div>
                        </div>

                        {/* Day Detail Panel */}
                        <div className="lg:w-[380px] flex-shrink-0">
                            {selectedDate ? (
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                                    {/* Panel Header */}
                                    <div className="p-5 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-b border-white/[0.06]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">
                                                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                                                        weekday: "long",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-0.5">
                                                    {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bookings List */}
                                    {selectedDayBookings.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="text-3xl mb-2">📭</div>
                                            <p className="text-gray-500 text-sm">No bookings on this day</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
                                            {selectedDayBookings.map((booking) => {
                                                const timeStr = booking.booking_time;
                                                const [h, m] = timeStr.split(":").map(Number);
                                                const ampm = h >= 12 ? "PM" : "AM";
                                                const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                const displayTime = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
                                                const src = sourceBadge(booking.source);

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        className="p-4 hover:bg-white/[0.02] transition-colors group"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Time column */}
                                                            <div className="flex-shrink-0 w-16 text-center">
                                                                <div className="text-sm font-bold text-white">
                                                                    {displayTime}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500">
                                                                    {booking.duration_minutes}min
                                                                </div>
                                                            </div>

                                                            {/* Timeline line */}
                                                            <div className="flex flex-col items-center mt-1">
                                                                <div className={`w-2.5 h-2.5 rounded-full ${statusDot(booking.status)}`} />
                                                                <div className="w-px h-full bg-white/[0.08] mt-1" />
                                                            </div>

                                                            {/* Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium text-white text-sm truncate">
                                                                        {booking.customer_name}
                                                                    </span>
                                                                    <span
                                                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge(booking.status)}`}
                                                                    >
                                                                        {booking.status}
                                                                    </span>
                                                                </div>

                                                                {booking.service_name && (
                                                                    <div className="text-xs text-gray-400 mb-1">
                                                                        ✂️ {booking.service_name}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                    <span className="truncate">
                                                                        🤖 {getBotName(booking.chatbot_id)}
                                                                    </span>
                                                                    <span className={`rounded px-1 py-0.5 ${src.bg}`}>
                                                                        {src.label}
                                                                    </span>
                                                                </div>

                                                                {booking.customer_email && (
                                                                    <div className="text-[10px] text-gray-500 mt-1 truncate">
                                                                        📧 {booking.customer_email}
                                                                    </div>
                                                                )}

                                                                {booking.notes && (
                                                                    <div className="text-[10px] text-gray-500 mt-1 italic">
                                                                        📝 {booking.notes}
                                                                    </div>
                                                                )}

                                                                {/* Actions */}
                                                                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {booking.status === "pending" && (
                                                                        <button
                                                                            onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                                                            className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                        >
                                                                            ✅ Confirm
                                                                        </button>
                                                                    )}
                                                                    {booking.status === "confirmed" && (
                                                                        <button
                                                                            onClick={() => updateBookingStatus(booking.id, "completed")}
                                                                            className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                                        >
                                                                            ✔️ Complete
                                                                        </button>
                                                                    )}
                                                                    {(booking.status === "pending" || booking.status === "confirmed") && (
                                                                        <button
                                                                            onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                                                            className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                                        >
                                                                            ❌ Cancel
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => deleteBooking(booking.id)}
                                                                        className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400/50 hover:bg-red-500/20 transition-colors"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 text-center">
                                    <div className="text-4xl mb-3">👆</div>
                                    <p className="text-gray-400 text-sm">
                                        Click a date to view bookings
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1">
                                        Days with bookings show colored dots
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* LIST VIEW                                      */}
                {/* ═══════════════════════════════════════════════ */}
                {viewMode === "list" && (
                    <>
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
                                    When your AI agents book appointments, they&apos;ll appear here.
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
                    </>
                )}
            </div>
        </div>
    );
}
