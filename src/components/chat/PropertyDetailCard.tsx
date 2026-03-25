"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Bed,
    Bath,
    Maximize,
    MapPin,
    Calendar,
    Phone,
    Share2,
    Heart,
    ExternalLink,
} from "lucide-react";
import { Property } from "./PropertyCardsCarousel";
import { MortgageCalc } from "./MortgageCalc";

interface PropertyDetailCardProps {
    property: Property;
    onClose?: () => void;
    onScheduleVisit?: (propertyId: string) => void;
    onContactAgent?: (propertyId: string) => void;
}

export function PropertyDetailCard({
    property,
    onClose,
    onScheduleVisit,
    onContactAgent,
}: PropertyDetailCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex(
            (prev) => (prev - 1 + property.images.length) % property.images.length
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="my-3 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl max-w-full"
        >
            {/* Header */}
            <div className="relative bg-zinc-950 p-4 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-white font-semibold text-lg line-clamp-1">
                            {property.title}
                        </h2>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.location}
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Image Gallery */}
            <div className="relative h-64 bg-zinc-950 group">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentImageIndex}
                        src={property.images[currentImageIndex] || "/placeholder-property.jpg"}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-property.jpg";
                        }}
                    />
                </AnimatePresence>

                {/* Gallery Navigation */}
                {property.images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                            {currentImageIndex + 1} / {property.images.length}
                        </div>
                    </>
                )}

                {/* Save Button */}
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2.5 rounded-full transition-all"
                >
                    <Heart
                        className={`w-5 h-5 transition-all ${isSaved ? "fill-red-500 text-red-500 scale-110" : "text-white"
                            }`}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Price & Specs */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                            {property.price}
                        </div>
                        <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex items-center gap-1.5">
                                <Bed className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{property.beds} Bedrooms</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Bath className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{property.baths} Bathrooms</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Maximize className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{property.sqft} sqft</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {property.description && (
                    <div>
                        <h3 className="text-white font-semibold mb-2">About This Property</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {property.description}
                        </p>
                    </div>
                )}

                {/* Features */}
                {property.features && property.features.length > 0 && (
                    <div>
                        <h3 className="text-white font-semibold mb-2">✨ Premium Features</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {property.features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm text-gray-300 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mortgage Calculator Toggle */}
                <div className="border-t border-zinc-800 pt-4">
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="w-full flex items-center justify-between text-white hover:text-emerald-400 transition-colors"
                    >
                        <span className="font-semibold">💰 Mortgage Calculator</span>
                        <ChevronRight
                            className={`w-5 h-5 transition-transform ${showCalculator ? "rotate-90" : ""
                                }`}
                        />
                    </button>

                    <AnimatePresence>
                        {showCalculator && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3">
                                    <MortgageCalc priceValue={property.priceValue || 0} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        onClick={() => onScheduleVisit?.(property.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                    >
                        <Calendar className="w-4 h-4" />
                        Schedule Visit
                    </button>
                    <button
                        onClick={() => onContactAgent?.(property.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                    >
                        <Phone className="w-4 h-4" />
                        Call Agent
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-gray-200 rounded-lg font-medium transition-all">
                        <ExternalLink className="w-4 h-4" />
                        Virtual Tour
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-gray-200 rounded-lg font-medium transition-all">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
