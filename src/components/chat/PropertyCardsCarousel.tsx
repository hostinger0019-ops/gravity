"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Phone, Eye, Share2, Bed, Bath, Maximize } from "lucide-react";

export interface Property {
    id: string;
    title: string;
    price: string;
    priceValue?: number;
    beds: number;
    baths: number;
    sqft: number;
    location: string;
    area?: string;
    images: string[];
    features?: string[];
    description?: string;
}

interface PropertyCardsCarouselProps {
    properties: Property[];
    onViewDetails?: (propertyId: string) => void;
    onScheduleVisit?: (propertyId: string) => void;
    onContactAgent?: (propertyId: string) => void;
}

export function PropertyCardsCarousel({
    properties,
    onViewDetails,
    onScheduleVisit,
    onContactAgent,
}: PropertyCardsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
    const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});

    const currentProperty = properties[currentIndex];

    const nextProperty = () => {
        setCurrentIndex((prev) => (prev + 1) % properties.length);
    };

    const prevProperty = () => {
        setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length);
    };

    const toggleSave = (propertyId: string) => {
        setSavedProperties((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(propertyId)) {
                newSet.delete(propertyId);
            } else {
                newSet.add(propertyId);
            }
            return newSet;
        });
    };

    const nextImage = (propertyId: string, imagesCount: number) => {
        setCurrentImageIndex((prev) => ({
            ...prev,
            [propertyId]: ((prev[propertyId] || 0) + 1) % imagesCount,
        }));
    };

    const prevImage = (propertyId: string, imagesCount: number) => {
        setCurrentImageIndex((prev) => ({
            ...prev,
            [propertyId]: ((prev[propertyId] || 0) - 1 + imagesCount) % imagesCount,
        }));
    };

    if (!properties || properties.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400 bg-zinc-900/50 rounded-lg border border-zinc-800">
                No properties found
            </div>
        );
    }

    const imageIndex = currentImageIndex[currentProperty.id] || 0;

    return (
        <div className="my-3 max-w-full">
            {/* Property Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl backdrop-blur-sm"
            >
                {/* Image Gallery */}
                <div className="relative h-56 bg-zinc-950 overflow-hidden group">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={`${currentProperty.id}-${imageIndex}`}
                            src={currentProperty.images[imageIndex] || "/placeholder-property.jpg"}
                            alt={currentProperty.title}
                            className="w-full h-full object-cover"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-property.jpg";
                            }}
                        />
                    </AnimatePresence>

                    {/* Image Navigation */}
                    {currentProperty.images.length > 1 && (
                        <>
                            <button
                                onClick={() => prevImage(currentProperty.id, currentProperty.images.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => nextImage(currentProperty.id, currentProperty.images.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Image Indicators */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {currentProperty.images.slice(0, 5).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all ${idx === imageIndex
                                                ? "w-6 bg-white"
                                                : "w-1.5 bg-white/40"
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Save Heart */}
                    <button
                        onClick={() => toggleSave(currentProperty.id)}
                        className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full transition-all"
                    >
                        <Heart
                            className={`w-5 h-5 transition-all ${savedProperties.has(currentProperty.id)
                                    ? "fill-red-500 text-red-500 scale-110"
                                    : "text-white"
                                }`}
                        />
                    </button>

                    {/* Property Count Badge */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                        {currentIndex + 1} / {properties.length}
                    </div>
                </div>

                {/* Property Details */}
                <div className="p-5">
                    {/* Price */}
                    <div className="mb-3">
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            {currentProperty.price}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                        {currentProperty.title}
                    </h3>

                    {/* Location */}
                    <p className="text-gray-400 text-sm mb-4 flex items-center gap-1">
                        📍 {currentProperty.location}
                        {currentProperty.area && (
                            <span className="text-gray-500"> • {currentProperty.area}</span>
                        )}
                    </p>

                    {/* Specs */}
                    <div className="flex items-center gap-4 mb-4 text-gray-300">
                        <div className="flex items-center gap-1.5">
                            <Bed className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{currentProperty.beds} Bed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Bath className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{currentProperty.baths} Bath</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Maximize className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{currentProperty.sqft} sqft</span>
                        </div>
                    </div>

                    {/* Features */}
                    {currentProperty.features && currentProperty.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {currentProperty.features.slice(0, 3).map((feature, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-1 bg-zinc-800/50 border border-zinc-700 rounded-full text-xs text-gray-300"
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onViewDetails?.(currentProperty.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Eye className="w-4 h-4" />
                            View Tour
                        </button>
                        <button
                            onClick={() => onScheduleVisit?.(currentProperty.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95"
                        >
                            📅 Schedule
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                            onClick={() => onContactAgent?.(currentProperty.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-gray-200 rounded-lg font-medium transition-all"
                        >
                            <Phone className="w-4 h-4" />
                            Call Agent
                        </button>
                        <button
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-gray-200 rounded-lg font-medium transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Navigation */}
            {properties.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                        onClick={prevProperty}
                        disabled={properties.length === 1}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-sm text-gray-400">
                        Swipe for {properties.length - currentIndex - 1} more{" "}
                        {properties.length - currentIndex - 1 === 1 ? "property" : "properties"}
                    </div>

                    <button
                        onClick={nextProperty}
                        disabled={properties.length === 1}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
