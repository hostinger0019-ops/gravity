"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Order {
    id: string;
    bot_id: string;
    customer_name: string;
    customer_phone: string | null;
    items: Array<{ name: string; quantity: number; notes?: string }>;
    status: string;
    delivery_type: string;
    delivery_address: string | null;
    notes: string | null;
    created_at: string;
    chatbots?: { name: string; slug: string };
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready: "bg-green-100 text-green-800",
    delivered: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
};

const statusOptions = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];

export default function AdminOrdersPage() {
    const searchParams = useSearchParams();
    const botIdFilter = searchParams?.get("bot") ?? null;

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [botName, setBotName] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [botIdFilter]);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/orders");
            const data = await res.json();
            let allOrders = data.orders || [];

            // Filter by bot if specified
            if (botIdFilter) {
                allOrders = allOrders.filter((o: Order) => o.bot_id === botIdFilter);
                if (allOrders.length > 0 && allOrders[0].chatbots) {
                    setBotName(allOrders[0].chatbots.name);
                }
            }

            setOrders(allOrders);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setOrders((prev) =>
                    prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
                );
            }
        } catch (err) {
            console.error("Failed to update order:", err);
        } finally {
            setUpdating(null);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm("Delete this order?")) return;
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
            if (res.ok) {
                setOrders((prev) => prev.filter((o) => o.id !== orderId));
            }
        } catch (err) {
            console.error("Failed to delete order:", err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading orders...</div>
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
                        <h1 className="text-2xl font-bold text-gray-900">🛒 Food Orders</h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        {botName ? `Orders for ${botName}` : "Manage food orders from your restaurant chatbots"}
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    ↻ Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-4">🍽️</div>
                    <h3 className="text-lg font-medium text-gray-700">No orders yet</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        Orders from your restaurant chatbots will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">{order.customer_name}</h3>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100"
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.delivery_type === "delivery"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-green-100 text-green-800"
                                                }`}
                                        >
                                            {order.delivery_type === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}
                                        </span>
                                    </div>

                                    {order.customer_phone && (
                                        <p className="text-sm text-gray-600 mb-1">📞 {order.customer_phone}</p>
                                    )}

                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                                        <ul className="text-sm text-gray-600 pl-4">
                                            {order.items.map((item, idx) => (
                                                <li key={idx}>
                                                    • {item.quantity}x {item.name}
                                                    {item.notes && <span className="text-gray-400"> ({item.notes})</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {order.delivery_address && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            📍 {order.delivery_address}
                                        </p>
                                    )}

                                    {order.notes && (
                                        <p className="text-sm text-gray-500 mt-2 italic">Note: {order.notes}</p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <span>🕐 {formatDate(order.created_at)}</span>
                                        {order.chatbots && <span>🤖 {order.chatbots.name}</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateStatus(order.id, e.target.value)}
                                        disabled={updating === order.id}
                                        className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    >
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => deleteOrder(order.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete order"
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
