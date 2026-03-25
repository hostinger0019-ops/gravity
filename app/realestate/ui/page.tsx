"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Home, MapPin, Bed, Bath, Maximize, Heart, X, ChevronDown, ChevronUp } from "lucide-react";
import { Property } from "@/components/chat/PropertyCardsCarousel";
import { PropertyDetailCard } from "@/components/chat/PropertyDetailCard";

// Sample properties
const ALL_PROPERTIES: Property[] = [
    {
        id: "prop-1",
        title: "Luxury 3BHK Apartment in Greater Kailash",
        price: "₹4.5Cr",
        priceValue: 45000000,
        beds: 3,
        baths: 2,
        sqft: 2100,
        location: "Greater Kailash, South Delhi",
        area: "South Delhi",
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
        ],
        features: ["Modular Kitchen", "Club House", "Swimming Pool", "24/7 Security", "Power Backup", "Lift"],
        description: "This stunning 3BHK apartment offers modern amenities and spacious living in the heart of Greater Kailash."
    },
    {
        id: "prop-2",
        title: "Premium 4BHK Villa in Gurgaon",
        price: "₹8.2Cr",
        priceValue: 82000000,
        beds: 4,
        baths: 3,
        sqft: 3500,
        location: "Golf Course Road, Gurgaon",
        area: "Gurgaon",
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop"],
        features: ["Private Garden", "Servant Quarter", "Gym", "Home Theater"],
        description: "Luxurious villa with world-class amenities."
    },
    {
        id: "prop-3",
        title: "Modern 2BHK in Noida",
        price: "₹1.8Cr",
        priceValue: 18000000,
        beds: 2,
        baths: 2,
        sqft: 1400,
        location: "Sector 62, Noida",
        area: "Noida",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop"],
        features: ["Ready to Move", "Park Facing", "Vastu Compliant"],
        description: "Well-designed 2BHK in prime location."
    },
    {
        id: "prop-4",
        title: "Spacious 3BHK in Dwarka",
        price: "₹2.2Cr",
        priceValue: 22000000,
        beds: 3,
        baths: 2,
        sqft: 1800,
        location: "Dwarka Sector 10, West Delhi",
        area: "West Delhi",
        images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"],
        features: ["Metro Connectivity", "Shopping Complex"],
        description: "Affordable 3BHK with excellent connectivity."
    },
    {
        id: "prop-5",
        title: "Penthouse in Vasant Kunj",
        price: "₹12Cr",
        priceValue: 120000000,
        beds: 5,
        baths: 4,
        sqft: 4500,
        location: "Vasant Kunj, South Delhi",
        area: "South Delhi",
        images: ["https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop"],
        features: ["Private Terrace", "Jacuzzi", "Smart Home"],
        description: "Ultra-luxurious penthouse with stunning views."
    },
];

interface Message {
    role: "user" | "assistant";
    content: string;
    propertyIds?: string[];
    suggestedQuestions?: string[];
}

export default function ConversationalRealEstateUI() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm your AI property agent. 🏡 What kind of home are you looking for?",
            suggestedQuestions: [
                "Show me 3BHK apartments",
                "Properties in South Delhi",
                "What's available under 5 crores?",
                "Show me luxury penthouses"
            ]
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [displayedProperties, setDisplayedProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setIsLoading(true);

        setMessages(prev => [...prev, { role: "user", content: userMessage }]);

        setTimeout(() => {
            let response = "";
            let propertyIds: string[] = [];
            let suggestedQuestions: string[] = [];

            const lowerQuery = userMessage.toLowerCase();

            if (lowerQuery.includes("3bhk") || lowerQuery.includes("3 bhk")) {
                const filtered = ALL_PROPERTIES.filter(p => p.beds === 3);
                propertyIds = filtered.map(p => p.id);
                setDisplayedProperties(filtered);
                response = `I found ${filtered.length} amazing 3BHK properties for you! Take a look at these options:`;
                suggestedQuestions = ["Tell me about the first one", "Show luxury options", "Any with pool?"];
            } else if (lowerQuery.includes("south delhi")) {
                const filtered = ALL_PROPERTIES.filter(p => p.area === "South Delhi");
                propertyIds = filtered.map(p => p.id);
                setDisplayedProperties(filtered);
                response = `Here are ${filtered.length} premium properties in South Delhi:`;
                suggestedQuestions = ["Filter by 3BHK", "Show only penthouses", "What's the cheapest?"];
            } else if (lowerQuery.includes("under") || lowerQuery.includes("below")) {
                const filtered = ALL_PROPERTIES.filter(p => p.priceValue < 50000000);
                propertyIds = filtered.map(p => p.id);
                setDisplayedProperties(filtered);
                response = `I found ${filtered.length} properties under ₹5Cr:`;
                suggestedQuestions = ["Show in Noida", "Which has best value?", "Any ready to move?"];
            } else if (lowerQuery.includes("penthouse") || lowerQuery.includes("luxury")) {
                const filtered = ALL_PROPERTIES.filter(p => p.priceValue > 70000000 || p.beds >= 4);
                propertyIds = filtered.map(p => p.id);
                setDisplayedProperties(filtered);
                response = `Here are our luxury properties:`;
                suggestedQuestions = ["Tell me about amenities", "Schedule viewing", "Any with terrace?"];
            } else {
                setDisplayedProperties(ALL_PROPERTIES);
                propertyIds = ALL_PROPERTIES.map(p => p.id);
                response = `I found ${ALL_PROPERTIES.length} great properties! Let me know if you'd like to filter by area, budget, or bedrooms.`;
                suggestedQuestions = ["Show 3BHK only", "South Delhi properties", "Under 5 crores"];
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: response,
                propertyIds,
                suggestedQuestions
            }]);
            setIsLoading(false);

            if (window.innerWidth < 1024) {
                setIsMobileDrawerOpen(false);
            }
        }, 1000);
    };

    const handleVoiceClick = () => {
        setIsRecording(!isRecording);
        setTimeout(() => {
            setIsRecording(false);
            setInput("Show me 3BHK apartments in South Delhi");
            if (window.innerWidth < 1024) {
                setIsMobileDrawerOpen(true);
            }
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
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Chat Sidebar - Desktop & Tablet */}
            <div className="hidden lg:flex lg:w-[35%] xl:w-[30%] flex-col bg-white border-r border-gray-200 shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Home className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">DreamHomes AI</h1>
                            <p className="text-sm text-white/80">Your Voice Property Agent</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                                            : "bg-gray-100 text-gray-900"
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </motion.div>

                            {msg.role === "assistant" && msg.suggestedQuestions && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {msg.suggestedQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setInput(q);
                                                inputRef.current?.focus();
                                            }}
                                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-emerald-500 transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                            <span className="text-sm">Finding properties...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleVoiceClick}
                            className={`p-3 rounded-full transition-all ${isRecording
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg"
                                }`}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Ask about properties..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Properties Display */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                {displayedProperties.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md"
                        >
                            <Home className="w-20 h-20 mx-auto mb-6 text-emerald-600" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Your Property Search</h2>
                            <p className="text-gray-600 mb-8">
                                Ask me anything about properties using voice or text. I'll help you find your dream home!
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => { setInput("Show me 3BHK apartments"); inputRef.current?.focus(); }}
                                    className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                                >
                                    💡 Show me 3BHK apartments
                                </button>
                                <button
                                    onClick={() => { setInput("Properties in South Delhi"); inputRef.current?.focus(); }}
                                    className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                                >
                                    📍 Properties in South Delhi
                                </button>
                                <button
                                    onClick={() => { setInput("Show luxury penthouses"); inputRef.current?.focus(); }}
                                    className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                                >
                                    ✨ Show luxury penthouses
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {displayedProperties.length} {displayedProperties.length === 1 ? "Property" : "Properties"} Found
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayedProperties.map((property, idx) => (
                                <motion.div
                                    key={property.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={property.images[0]}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSave(property.id); }}
                                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                                        >
                                            <Heart className={`w-5 h-5 ${savedProperties.has(property.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                                        </button>
                                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-emerald-600 font-bold">
                                            {property.price}
                                        </div>
                                    </div>

                                    <div className="p-5" onClick={() => setSelectedProperty(property)}>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4 flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {property.location}
                                        </p>
                                        <div className="flex items-center gap-4 text-gray-700 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Bed className="w-4 h-4" />
                                                <span className="text-sm">{property.beds}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Bath className="w-4 h-4" />
                                                <span className="text-sm">{property.baths}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Maximize className="w-4 h-4" />
                                                <span className="text-sm">{property.sqft} sqft</span>
                                            </div>
                                        </div>
                                        <button className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                                            View Details
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Drawer */}
            <div className="lg:hidden">
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <div
                        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between cursor-pointer shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <Home className="w-6 h-6" />
                            <div>
                                <p className="font-bold">AI Property Agent</p>
                                <p className="text-xs text-white/80">Tap to chat or use voice</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleVoiceClick(); }}
                                className={`p-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-white/20"}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            {isMobileDrawerOpen ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
                        </div>
                    </div>

                    <AnimatePresence>
                        {isMobileDrawerOpen && (
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25 }}
                                className="fixed inset-0 bg-white z-40 flex flex-col"
                                style={{ top: "20%" }}
                            >
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg, idx) => (
                                        <div key={idx}>
                                            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                                                            : "bg-gray-100 text-gray-900"
                                                        }`}
                                                >
                                                    <p className="text-sm">{msg.content}</p>
                                                </div>
                                            </div>
                                            {msg.role === "assistant" && msg.suggestedQuestions && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.suggestedQuestions.map((q, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setInput(q)}
                                                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full"
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                            placeholder="Ask about properties..."
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl disabled:opacity-50"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Property Detail Modal */}
            <AnimatePresence>
                {selectedProperty && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedProperty(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
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
