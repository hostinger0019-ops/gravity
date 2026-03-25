"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, Bed, Bath, MapPin, Heart, X } from "lucide-react";
import { Property } from "@/components/chat/PropertyCardsCarousel";
import { PropertyDetailCard } from "@/components/chat/PropertyDetailCard";

// Sample properties
const FEATURED_PROPERTIES: Property[] = [
    {
        id: "1",
        title: "Luxury 3BR Condo in Manhattan",
        price: "$2.4M",
        priceValue: 2400000,
        beds: 3,
        baths: 2,
        sqft: 2100,
        location: "Upper West Side, Manhattan",
        area: "Manhattan",
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],
        features: ["Doorman", "Rooftop Access", "Central AC"],
        description: "Stunning 3BR condo with skyline views."
    },
    {
        id: "2",
        title: "Premium 4BR Villa in Beverly Hills",
        price: "$8.5M",
        priceValue: 8500000,
        beds: 4,
        baths: 3,
        sqft: 3500,
        location: "Beverly Hills, Los Angeles",
        area: "Los Angeles",
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop"],
        features: ["Private Pool", "Home Theater", "Wine Cellar"],
        description: "Luxurious villa with world-class amenities."
    },
    {
        id: "3",
        title: "Modern 2BR Flat in Brooklyn",
        price: "$1.2M",
        priceValue: 1200000,
        beds: 2,
        baths: 2,
        sqft: 1400,
        location: "Williamsburg, Brooklyn",
        area: "Brooklyn",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop"],
        features: ["Move-in Ready", "Park Views"],
        description: "Modern living in trendy Williamsburg."
    },
    {
        id: "4",
        title: "Penthouse in Hamptons",
        price: "$12M",
        priceValue: 12000000,
        beds: 5,
        baths: 4,
        sqft: 4500,
        location: "East Hampton, New York",
        area: "Hamptons",
        images: ["https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop"],
        features: ["Ocean Views", "Private Beach Access"],
        description: "Ultra-luxurious beachfront penthouse."
    },
];

const QUICK_SEARCHES = [
    "3BR apartments in Manhattan",
    "Villas under $5 million",
    "Condos in Brooklyn",
    "Luxury homes in Beverly Hills"
];

export default function GoogleStylePropertySearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [searchResults, setSearchResults] = useState<Property[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        // Simple mock search
        const lowerQuery = searchQuery.toLowerCase();
        let filtered = FEATURED_PROPERTIES;

        if (lowerQuery.includes("3br") || lowerQuery.includes("3 br") || lowerQuery.includes("3 bed")) {
            filtered = FEATURED_PROPERTIES.filter(p => p.beds === 3);
        } else if (lowerQuery.includes("manhattan") || lowerQuery.includes("new york")) {
            filtered = FEATURED_PROPERTIES.filter(p => p.area === "Manhattan" || p.area === "Hamptons");
        } else if (lowerQuery.includes("villa") || lowerQuery.includes("beverly")) {
            filtered = FEATURED_PROPERTIES.filter(p => p.title.toLowerCase().includes("villa") || p.area === "Los Angeles");
        } else if (lowerQuery.includes("brooklyn")) {
            filtered = FEATURED_PROPERTIES.filter(p => p.area === "Brooklyn");
        }

        setSearchResults(filtered);
        setShowResults(true);
    };

    const handleVoice = () => {
        setIsRecording(true);
        setTimeout(() => {
            setIsRecording(false);
            setSearchQuery("3BR apartments in Manhattan");
        }, 2000);
    };

    const toggleSave = (id: string) => {
        setSavedProperties(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg" />
                        <span className="text-xl font-bold text-gray-900">DreamHomes</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                        <button className="hover:text-emerald-600">Sign In</button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!showResults ? (
                    /* Google-Style Homepage */
                    <motion.div
                        key="homepage"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="flex flex-col items-center pt-8 px-4"
                    >
                        {/* Logo */}
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
                        >
                            Find Your Dream Home
                        </motion.h1>

                        {/* Search Bar - Option 4 Style with Blue Glow */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="w-full max-w-2xl"
                        >
                            <div className="relative group">
                                {/* Blue glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-full px-6 py-4 shadow-xl hover:shadow-2xl hover:border-teal-300 transition-all">
                                    <Search className="w-6 h-6 text-teal-500 mr-3" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                        placeholder="Ask me anything... 3BR in Manhattan, villas with pool, luxury homes..."
                                        className="flex-1 text-lg outline-none text-gray-900 placeholder:text-gray-400"
                                    />
                                    <button
                                        onClick={handleVoice}
                                        className={`ml-3 p-2 rounded-full transition-all ${isRecording
                                            ? "bg-red-500 text-white animate-pulse"
                                            : "hover:bg-teal-50 text-teal-600"
                                            }`}
                                    >
                                        <Mic className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Buy / Rent Toggle */}
                            <div className="flex items-center justify-center gap-3 mt-3">
                                <button className="px-6 py-2 bg-white border-2 border-gray-200 rounded-full hover:border-teal-500 hover:bg-teal-50 transition-all text-gray-700 font-semibold shadow-sm text-sm">
                                    Buy
                                </button>
                                <button className="px-6 py-2 bg-white border-2 border-gray-200 rounded-full hover:border-teal-500 hover:bg-teal-50 transition-all text-gray-700 font-semibold shadow-sm text-sm">
                                    Rent
                                </button>
                            </div>
                        </motion.div>

                        {/* Quick Searches - Inline */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-4 flex flex-wrap justify-center gap-2"
                        >
                            {QUICK_SEARCHES.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSearchQuery(search);
                                        handleSearch();
                                    }}
                                    className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full hover:border-teal-500 hover:bg-teal-50 transition-all text-xs text-gray-600"
                                >
                                    {search}
                                </button>
                            ))}
                        </motion.div>

                        {/* Featured Properties */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 w-full max-w-6xl px-4"
                        >
                            <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Featured Properties</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {FEATURED_PROPERTIES.map((property, idx) => (
                                    <motion.div
                                        key={property.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                                        onClick={() => setSelectedProperty(property)}
                                    >
                                        <div className="relative h-40 overflow-hidden">
                                            <img
                                                src={property.images[0]}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSave(property.id); }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
                                            >
                                                <Heart className={`w-4 h-4 ${savedProperties.has(property.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-emerald-600 font-bold text-xs">
                                                {property.price}
                                            </div>
                                        </div>

                                        <div className="p-3">
                                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{property.title}</h3>
                                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 line-clamp-1">
                                                <MapPin className="w-3 h-3" />
                                                {property.location}
                                            </p>
                                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                                                <span className="flex items-center gap-0.5">
                                                    <Bed className="w-3 h-3" />
                                                    {property.beds}
                                                </span>
                                                <span className="flex items-center gap-0.5">
                                                    <Bath className="w-3 h-3" />
                                                    {property.baths}
                                                </span>
                                                <span>{property.sqft} sqft</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    /* Search Results */
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-7xl mx-auto px-6 py-8"
                    >
                        {/* Compact Search Bar */}
                        <div className="mb-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowResults(false)}
                                    className="text-2xl font-bold text-gray-900 hover:text-emerald-600"
                                >
                                    DreamHomes
                                </button>
                                <div className="flex-1 max-w-2xl">
                                    <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 hover:shadow-md transition-all">
                                        <Search className="w-5 h-5 text-gray-400 mr-2" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                            className="flex-1 outline-none text-gray-900"
                                        />
                                        <button onClick={handleVoice} className="ml-2 p-1 hover:bg-gray-100 rounded-full">
                                            <Mic className={`w-5 h-5 ${isRecording ? "text-red-500" : "text-gray-600"}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Count */}
                        <p className="text-sm text-gray-600 mb-6">
                            About {searchResults.length} results
                        </p>

                        {/* Property Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {searchResults.map((property, idx) => (
                                <motion.div
                                    key={property.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={property.images[0]}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSave(property.id); }}
                                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
                                        >
                                            <Heart className={`w-4 h-4 ${savedProperties.has(property.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                                        </button>
                                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-emerald-600 font-bold text-sm">
                                            {property.price}
                                        </div>
                                    </div>

                                    <div className="p-4" onClick={() => setSelectedProperty(property)}>
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{property.title}</h3>
                                        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {property.location}
                                        </p>
                                        <div className="flex items-center gap-3 text-gray-600 text-xs">
                                            <span className="flex items-center gap-1">
                                                <Bed className="w-3 h-3" />
                                                {property.beds}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Bath className="w-3 h-3" />
                                                {property.baths}
                                            </span>
                                            <span>{property.sqft} sqft</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Property Detail Modal */}
            <AnimatePresence>
                {selectedProperty && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProperty(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold">{selectedProperty.title}</h2>
                                <button onClick={() => setSelectedProperty(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <PropertyDetailCard
                                    property={selectedProperty}
                                    onScheduleVisit={() => alert("Schedule visit")}
                                    onContactAgent={() => alert("Contact agent")}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
