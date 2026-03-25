"use client";

import { useState } from "react";

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string;
    onSuccess: (message: string) => void;
}

interface OrderItem {
    name: string;
    quantity: number;
    notes?: string;
}

export default function OrderModal({ isOpen, onClose, slug, onSuccess }: OrderModalProps) {
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [items, setItems] = useState<OrderItem[]>([{ name: "", quantity: 1 }]);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const addItem = () => {
        setItems([...items, { name: "", quantity: 1 }]);
    };

    const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate
        if (!customerName.trim()) {
            setError("Please enter your name");
            return;
        }
        const validItems = items.filter(item => item.name.trim());
        if (validItems.length === 0) {
            setError("Please add at least one item");
            return;
        }
        if (deliveryType === "delivery" && !deliveryAddress.trim()) {
            setError("Please enter delivery address");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/bots/${encodeURIComponent(slug)}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim() || null,
                    items: validItems,
                    deliveryType,
                    deliveryAddress: deliveryType === "delivery" ? deliveryAddress.trim() : null,
                    notes: notes.trim() || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to place order");
            }

            onSuccess(data.message || "Order placed successfully!");
            onClose();
            // Reset form
            setCustomerName("");
            setCustomerPhone("");
            setDeliveryType("pickup");
            setDeliveryAddress("");
            setItems([{ name: "", quantity: 1 }]);
            setNotes("");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            🍽️ Order Food
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Customer Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    {/* Delivery Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Order Type *</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="deliveryType"
                                    value="pickup"
                                    checked={deliveryType === "pickup"}
                                    onChange={() => setDeliveryType("pickup")}
                                    className="text-orange-500 focus:ring-orange-500"
                                />
                                <span>🏪 Pickup</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="deliveryType"
                                    value="delivery"
                                    checked={deliveryType === "delivery"}
                                    onChange={() => setDeliveryType("delivery")}
                                    className="text-orange-500 focus:ring-orange-500"
                                />
                                <span>🚗 Delivery</span>
                            </label>
                        </div>
                    </div>

                    {deliveryType === "delivery" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                            <textarea
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="123 Main St, City, State"
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>
                    )}

                    {/* Order Items */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItem(index, "name", e.target.value)}
                                        placeholder="Item name (e.g., Burger)"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-center"
                                    />
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                            + Add another item
                        </button>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any allergies or special requests..."
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${isSubmitting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg hover:scale-[1.02]"
                            }`}
                    >
                        {isSubmitting ? "Placing Order..." : "🛒 Place Order"}
                    </button>
                </form>
            </div>
        </div>
    );
}
