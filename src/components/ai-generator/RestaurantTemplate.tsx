"use client";

import { useState } from "react";

interface RestaurantTemplateProps {
    onComplete: (config: RestaurantConfig) => void;
    onBack: () => void;
}

export interface RestaurantConfig {
    restaurantName: string;
    cuisineType: string;
    features: string[];
    hasReservations: boolean;
    hasDelivery: boolean;
    hasTakeout: boolean;
    websiteUrl?: string;
    specialNote?: string;
}

const cuisineTypes = [
    { id: "indian", label: "Indian", emoji: "🍛" },
    { id: "chinese", label: "Chinese", emoji: "🥡" },
    { id: "italian", label: "Italian", emoji: "🍝" },
    { id: "mexican", label: "Mexican", emoji: "🌮" },
    { id: "japanese", label: "Japanese", emoji: "🍣" },
    { id: "american", label: "American", emoji: "🍔" },
    { id: "thai", label: "Thai", emoji: "🍜" },
    { id: "mediterranean", label: "Mediterranean", emoji: "🥙" },
    { id: "cafe", label: "Café & Bakery", emoji: "☕" },
    { id: "other", label: "Other", emoji: "🍽️" },
];

const featureOptions = [
    { id: "reservations", label: "Table Reservations", icon: "📅" },
    { id: "menu", label: "Menu Information", icon: "📋" },
    { id: "hours", label: "Operating Hours", icon: "🕐" },
    { id: "delivery", label: "Home Delivery", icon: "🚗" },
    { id: "takeout", label: "Takeout Orders", icon: "🥡" },
    { id: "specials", label: "Daily Specials", icon: "⭐" },
    { id: "events", label: "Events & Parties", icon: "🎉" },
    { id: "dietary", label: "Dietary Options", icon: "🥗" },
];

export function RestaurantTemplate({ onComplete, onBack }: RestaurantTemplateProps) {
    const [restaurantName, setRestaurantName] = useState("");
    const [cuisineType, setCuisineType] = useState("");
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["reservations", "menu", "hours"]);
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [specialNote, setSpecialNote] = useState("");
    const [step, setStep] = useState(1);

    const toggleFeature = (featureId: string) => {
        setSelectedFeatures(prev =>
            prev.includes(featureId)
                ? prev.filter(f => f !== featureId)
                : [...prev, featureId]
        );
    };

    const handleComplete = () => {
        onComplete({
            restaurantName,
            cuisineType,
            features: selectedFeatures,
            hasReservations: selectedFeatures.includes("reservations"),
            hasDelivery: selectedFeatures.includes("delivery"),
            hasTakeout: selectedFeatures.includes("takeout"),
            websiteUrl: websiteUrl || undefined,
            specialNote: specialNote || undefined,
        });
    };

    const canProceed = step === 1 ? restaurantName.trim().length > 0 : cuisineType.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                        🍽️
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Restaurant & Booking</h2>
                        <p className="text-orange-100">Create your perfect restaurant assistant</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 mt-6">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-2 rounded-full ${s <= step ? "bg-white" : "bg-white/30"
                                }`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-sm text-orange-100">
                    <span>Basic Info</span>
                    <span>Cuisine</span>
                    <span>Features</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What's your restaurant called? *
                            </label>
                            <input
                                type="text"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                placeholder="e.g., Spice Garden, The Italian Kitchen"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Website URL (optional)
                            </label>
                            <input
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://yourrestaurant.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                We'll import your menu and info automatically
                            </p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            What type of cuisine do you serve? *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {cuisineTypes.map((cuisine) => (
                                <button
                                    key={cuisine.id}
                                    type="button"
                                    onClick={() => setCuisineType(cuisine.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${cuisineType === cuisine.id
                                            ? "border-orange-500 bg-orange-50 shadow-md"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <span className="text-2xl">{cuisine.emoji}</span>
                                    <div className="font-medium text-gray-900 mt-1">{cuisine.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                What should your chatbot help with?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {featureOptions.map((feature) => (
                                    <button
                                        key={feature.id}
                                        type="button"
                                        onClick={() => toggleFeature(feature.id)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedFeatures.includes(feature.id)
                                                ? "border-orange-500 bg-orange-50"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <span className="text-xl">{feature.icon}</span>
                                        <span className="font-medium text-gray-900 text-sm">{feature.label}</span>
                                        {selectedFeatures.includes(feature.id) && (
                                            <span className="ml-auto text-orange-500">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Any special instructions? (optional)
                            </label>
                            <textarea
                                value={specialNote}
                                onChange={(e) => setSpecialNote(e.target.value)}
                                placeholder="e.g., We're known for our weekend brunch specials..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                    type="button"
                    onClick={step === 1 ? onBack : () => setStep(step - 1)}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
                >
                    ← Back
                </button>

                {step < 3 ? (
                    <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        disabled={!canProceed}
                        className={`px-8 py-2.5 rounded-xl font-semibold transition-all ${canProceed
                                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleComplete}
                        className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                        🚀 Create My Chatbot
                    </button>
                )}
            </div>
        </div>
    );
}
