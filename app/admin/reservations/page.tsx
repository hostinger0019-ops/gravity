"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Reservation {
    id: string;
    bot_id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    party_size: number;
    reservation_date: string;
    reservation_time: string;
    status: string;
    special_requests: string | null;
    created_at: string;
    chatbots?: { name: string; slug: string };
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
};

const statusOptions = ["pending", "confirmed", "cancelled", "completed"];

export default function AdminReservationsPage() {
    const searchParams = useSearchParams();
    const botIdFilter = searchParams?.get("bot") ?? null;

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [botName, setBotName] = useState<string | null>(null);

    useEffect(() => {
        fetchReservations();
    }, [botIdFilter]);

    const fetchReservations = async () => {
        try {
            const res = await fetch("/api/admin/reservations");
            const data = await res.json();
            let allReservations = data.reservations || [];

            // Filter by bot if specified
            if (botIdFilter) {
                allReservations = allReservations.filter((r: Reservation) => r.bot_id === botIdFilter);
                if (allReservations.length > 0 && allReservations[0].chatbots) {
                    setBotName(allReservations[0].chatbots.name);
                }
            }

            setReservations(allReservations);
        } catch (err) {
            console.error("Failed to fetch reservations:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (reservationId: string, newStatus: string) => {
        setUpdating(reservationId);
        try {
            const res = await fetch(`/api/admin/reservations/${reservationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setReservations((prev) =>
                    prev.map((r) => (r.id === reservationId ? { ...r, status: newStatus } : r))
                );
            }
        } catch (err) {
            console.error("Failed to update reservation:", err);
        } finally {
            setUpdating(null);
        }
    };

    const deleteReservation = async (reservationId: string) => {
        if (!confirm("Delete this reservation?")) return;
        try {
            const res = await fetch(`/api/admin/reservations/${reservationId}`, { method: "DELETE" });
            if (res.ok) {
                setReservations((prev) => prev.filter((r) => r.id !== reservationId));
            }
        } catch (err) {
            console.error("Failed to delete reservation:", err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading reservations...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        {botIdFilter && (
                            <Link
                                href="/admin/chatbots"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ← Back
                            </Link>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900">📅 Reservations</h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        {botName ? `Reservations for ${botName}` : "Manage table reservations from your restaurant chatbots"}
                    </p>
                </div>
                <button
                    onClick={fetchReservations}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    ↻ Refresh
                </button>
            </div>

            {reservations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-700">No reservations yet</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        Reservations from your restaurant chatbots will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reservations.map((res) => (
                        <div
                            key={res.id}
                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">{res.customer_name}</h3>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[res.status] || "bg-gray-100"
                                                }`}
                                        >
                                            {res.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-700 mb-2">
                                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
                                            📅 {formatDate(res.reservation_date)}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                            🕐 {formatTime(res.reservation_time)}
                                        </span>
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                                            👥 {res.party_size} {res.party_size === 1 ? "person" : "people"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        {res.customer_phone && <span>📞 {res.customer_phone}</span>}
                                        {res.customer_email && <span>✉️ {res.customer_email}</span>}
                                    </div>

                                    {res.special_requests && (
                                        <p className="text-sm text-gray-500 mt-2 italic">
                                            Note: {res.special_requests}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <span>Created: {new Date(res.created_at).toLocaleDateString()}</span>
                                        {res.chatbots && <span>🤖 {res.chatbots.name}</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <select
                                        value={res.status}
                                        onChange={(e) => updateStatus(res.id, e.target.value)}
                                        disabled={updating === res.id}
                                        className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    >
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => deleteReservation(res.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete reservation"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
