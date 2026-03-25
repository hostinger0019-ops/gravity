"use client";

import { motion } from "framer-motion";
import { MapPin, TrendingUp, Home } from "lucide-react";

export interface AreaLocation {
    name: string;
    propertyCount: number;
    priceRange: {
        min: string;
        max: string;
    };
    avgPrice?: string;
    description?: string;
    highlights?: string[];
    trending?: boolean;
}

interface AreaLocationCardsProps {
    areas: AreaLocation[];
    onSelectArea?: (areaName: string) => void;
    onViewMap?: (areaName: string) => void;
}

export function AreaLocationCards({
    areas,
    onSelectArea,
    onViewMap,
}: AreaLocationCardsProps) {
    if (!areas || areas.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400 bg-zinc-900/50 rounded-lg border border-zinc-800">
                No areas found
            </div>
        );
    }

    return (
        <div className="my-3 space-y-2 max-w-full">
            {areas.map((area, index) => (
                <motion.div
                    key={area.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-xl border border-zinc-700/50 overflow-hidden hover:border-zinc-600 transition-all cursor-pointer"
                    onClick={() => onSelectArea?.(area.name)}
                >
                    {/* Trending Badge */}
                    {area.trending && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                            <TrendingUp className="w-3 h-3" />
                            Hot
                        </div>
                    )}

                    <div className="p-4">
                        {/* Area Name & Count */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-white font-semibold text-lg">
                                        {area.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                    <Home className="w-4 h-4" />
                                    <span>
                                        {area.propertyCount} {area.propertyCount === 1 ? "property" : "properties"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Price Range</div>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-semibold">
                                    {area.priceRange.min}
                                </span>
                                <span className="text-gray-600">—</span>
                                <span className="text-emerald-400 font-semibold">
                                    {area.priceRange.max}
                                </span>
                            </div>
                            {area.avgPrice && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Avg: <span className="text-gray-400">{area.avgPrice}</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {area.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                {area.description}
                            </p>
                        )}

                        {/* Highlights */}
                        {area.highlights && area.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {area.highlights.slice(0, 3).map((highlight, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-gray-300"
                                    >
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectArea?.(area.name);
                                }}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Show Properties
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewMap?.(area.name);
                                }}
                                className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-gray-200 rounded-lg text-sm font-medium transition-all"
                            >
                                📍 Map
                            </button>
                        </div>
                    </div>

                    {/* Hover Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all pointer-events-none" />
                </motion.div>
            ))}

            {/* Summary Footer */}
            <div className="mt-3 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800 text-center">
                <p className="text-sm text-gray-400">
                    💡 Total{" "}
                    <span className="text-white font-semibold">
                        {areas.reduce((sum, area) => sum + area.propertyCount, 0)}
                    </span>{" "}
                    properties across{" "}
                    <span className="text-white font-semibold">{areas.length}</span> locations
                </p>
            </div>
        </div>
    );
}
