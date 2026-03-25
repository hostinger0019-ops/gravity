"use client";

import { useState } from "react";

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string;
    onSuccess: (message: string) => void;
}

export default function ReservationModal({ isOpen, onClose, slug, onSuccess }: ReservationModalProps) {
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [partySize, setPartySize] = useState(2);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Get tomorrow's date as minimum
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split("T")[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate
        if (!customerName.trim()) {
            setError("Please enter your name");
            return;
        }
        if (!date) {
            setError("Please select a date");
            return;
        }
        if (!time) {
            setError("Please select a time");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/bots/${encodeURIComponent(slug)}/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim() || null,
                    customerEmail: customerEmail.trim() || null,
                    partySize,
                    date,
                    time,
                    specialRequests: specialRequests.trim() || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to make reservation");
            }

            onSuccess(data.message || "Reservation request submitted!");
            onClose();
            // Reset form
            setCustomerName("");
            setCustomerPhone("");
            setCustomerEmail("");
            setPartySize(2);
            setDate("");
            setTime("");
            setSpecialRequests("");
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
                            📅 Make a Reservation
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="you@email.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Party Size */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Size *</label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                                className="w-10 h-10 rounded-full border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-50 transition-colors"
                            >
                                -
                            </button>
                            <span className="text-2xl font-semibold text-gray-800 w-12 text-center">
                                {partySize}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPartySize(Math.min(20, partySize + 1))}
                                className="w-10 h-10 rounded-full border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-50 transition-colors"
                            >
                                +
                            </button>
                            <span className="text-sm text-gray-500 ml-2">
                                {partySize === 1 ? "person" : "people"}
                            </span>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={minDate}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                        <textarea
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            placeholder="Birthday celebration, window seat, high chair needed..."
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
                        {isSubmitting ? "Submitting..." : "📅 Request Reservation"}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        We'll confirm your reservation shortly via phone or email.
                    </p>
                </form>
            </div>
        </div>
    );
}
