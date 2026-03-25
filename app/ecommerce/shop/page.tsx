"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Search,
    User,
    Heart,
    Mic,
    MicOff,
    Send,
    X,
    Plus,
    Minus,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Volume2,
    Star,
    Truck,
    Shield,
    RotateCcw,
    CreditCard,
    MapPin,
    Check,
    Sparkles,
    Bot
} from "lucide-react";

// Mock Product Data
const PRODUCTS = [
    { id: 1, name: "Elegant Evening Gown", price: 299, category: "party", image: "👗", rating: 4.8, reviews: 124, colors: ["Black", "Red", "Navy"] },
    { id: 2, name: "Classic Tuxedo Suit", price: 459, category: "party", image: "🤵", rating: 4.9, reviews: 89, colors: ["Black", "Navy"] },
    { id: 3, name: "Sequin Party Dress", price: 189, category: "party", image: "✨", rating: 4.7, reviews: 256, colors: ["Gold", "Silver", "Rose"] },
    { id: 4, name: "Premium Watch Collection", price: 599, category: "gifts", image: "⌚", rating: 4.9, reviews: 312, colors: ["Gold", "Silver"] },
    { id: 5, name: "Designer Handbag", price: 349, category: "gifts", image: "👜", rating: 4.8, reviews: 198, colors: ["Black", "Brown", "Cream"] },
    { id: 6, name: "Luxury Perfume Set", price: 129, category: "gifts", image: "🧴", rating: 4.6, reviews: 445, colors: [] },
    { id: 7, name: "Wireless Headphones Pro", price: 279, category: "electronics", image: "🎧", rating: 4.9, reviews: 1024, colors: ["Black", "White"] },
    { id: 8, name: "Smart Watch Ultra", price: 449, category: "electronics", image: "⌚", rating: 4.8, reviews: 567, colors: ["Black", "Silver"] },
    { id: 9, name: "Cashmere Sweater", price: 199, category: "casual", image: "🧥", rating: 4.7, reviews: 234, colors: ["Cream", "Gray", "Navy"] },
    { id: 10, name: "Premium Sneakers", price: 159, category: "casual", image: "👟", rating: 4.8, reviews: 789, colors: ["White", "Black"] },
    { id: 11, name: "Silk Scarf Collection", price: 89, category: "gifts", image: "🧣", rating: 4.6, reviews: 167, colors: ["Multi"] },
    { id: 12, name: "Crystal Jewelry Set", price: 249, category: "gifts", image: "💎", rating: 4.9, reviews: 423, colors: ["Silver", "Gold"] },
];

const CATEGORIES = [
    { id: "all", name: "All Products", icon: "🛍️" },
    { id: "party", name: "Party Wear", icon: "🎉" },
    { id: "gifts", name: "Gift Ideas", icon: "🎁" },
    { id: "electronics", name: "Electronics", icon: "📱" },
    { id: "casual", name: "Casual Wear", icon: "👕" },
];

type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

type CartItem = {
    product: typeof PRODUCTS[0];
    quantity: number;
    selectedColor?: string;
};

export default function AIShoppingExperience() {
    // UI State
    const [currentCategory, setCurrentCategory] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(1);

    // AI Widget State
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: "assistant", content: "Hi! I'm your shopping assistant. Ask me anything - try 'Show me party wear' or 'Gift ideas for a friend's birthday'!", timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Visible products based on category
    const visibleProducts = currentCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter(p => p.category === currentCategory);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mock LLM Command Processing
    const processUserMessage = (message: string) => {
        const lowerMessage = message.toLowerCase();
        let response = "";
        let command: any = null;

        // Gift-related queries
        if (lowerMessage.includes("gift") || lowerMessage.includes("birthday") || lowerMessage.includes("present")) {
            setCurrentCategory("gifts");
            setSelectedProduct(null);
            response = "Great choice! Here are some perfect gift ideas. I've selected our most popular items. Would you like me to show you something specific?";
            command = { action: "SHOW_PRODUCTS", category: "gifts" };
        }
        // Party wear queries
        else if (lowerMessage.includes("party") || lowerMessage.includes("evening") || lowerMessage.includes("formal")) {
            setCurrentCategory("party");
            setSelectedProduct(null);
            response = "Looking fabulous for a party? Here's our stunning party wear collection! Which one catches your eye?";
            command = { action: "SHOW_PRODUCTS", category: "party" };
        }
        // Electronics
        else if (lowerMessage.includes("electronic") || lowerMessage.includes("tech") || lowerMessage.includes("gadget")) {
            setCurrentCategory("electronics");
            setSelectedProduct(null);
            response = "Here are our top electronics! Great for gifts or personal use.";
            command = { action: "SHOW_PRODUCTS", category: "electronics" };
        }
        // Open specific product by position
        else if (lowerMessage.includes("open") || lowerMessage.includes("show me") || lowerMessage.includes("see")) {
            const positions = ["first", "second", "third", "fourth", "fifth", "sixth"];
            const numbers = ["1", "2", "3", "4", "5", "6"];
            let productIndex = -1;

            positions.forEach((pos, idx) => {
                if (lowerMessage.includes(pos)) productIndex = idx;
            });
            numbers.forEach((num, idx) => {
                if (lowerMessage.includes(num)) productIndex = idx;
            });

            if (productIndex >= 0 && productIndex < visibleProducts.length) {
                const product = visibleProducts[productIndex];
                setSelectedProduct(product);
                response = `Here's the ${product.name}! It's priced at $${product.price} with a ${product.rating} star rating. Would you like to add it to your cart?`;
                command = { action: "OPEN_PRODUCT", productId: product.id };
            } else {
                response = "Which product would you like to see? You can say 'open the first one' or 'show me the third product'.";
            }
        }
        // Add to cart
        else if (lowerMessage.includes("add to cart") || lowerMessage.includes("buy") || lowerMessage.includes("add this")) {
            if (selectedProduct) {
                addToCart(selectedProduct);
                response = `Added ${selectedProduct.name} to your cart! Would you like to continue shopping or proceed to checkout?`;
                command = { action: "ADD_TO_CART", productId: selectedProduct.id };
            } else {
                response = "Please select a product first. Try saying 'open the first one' to view a product.";
            }
        }
        // Show cart
        else if (lowerMessage.includes("cart") || lowerMessage.includes("basket")) {
            setShowCart(true);
            response = `You have ${cart.length} item(s) in your cart. Would you like to checkout?`;
            command = { action: "SHOW_CART" };
        }
        // Checkout
        else if (lowerMessage.includes("checkout") || lowerMessage.includes("pay") || lowerMessage.includes("purchase")) {
            if (cart.length > 0) {
                setShowCart(false);
                setShowCheckout(true);
                response = "Let's complete your order! Please enter your shipping address or tell me where to deliver.";
                command = { action: "START_CHECKOUT" };
            } else {
                response = "Your cart is empty! Let me help you find something. What are you looking for?";
            }
        }
        // Default response
        else {
            response = "I can help you shop! Try asking me: 'Show me party wear', 'Gift ideas for a birthday', or 'What's trending?'";
        }

        // Add assistant response
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: "assistant",
            content: response,
            timestamp: new Date()
        }]);

        // Simulate TTS
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 2000);
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        // Add user message
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: "user",
            content: inputValue,
            timestamp: new Date()
        }]);

        // Process after short delay
        const message = inputValue;
        setInputValue("");
        setTimeout(() => processUserMessage(message), 500);
    };

    const handleVoiceInput = () => {
        setIsListening(!isListening);
        if (!isListening) {
            // Simulate voice recognition
            setTimeout(() => {
                setIsListening(false);
                const mockVoiceInputs = [
                    "Show me party wear",
                    "Gift ideas for my friend's birthday",
                    "Open the first one",
                    "Add this to cart"
                ];
                const randomInput = mockVoiceInputs[Math.floor(Math.random() * mockVoiceInputs.length)];
                setInputValue(randomInput);
            }, 2000);
        }
    };

    const addToCart = (product: typeof PRODUCTS[0], color?: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1, selectedColor: color || product.colors[0] }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                                LuxeShop
                            </span>
                        </div>

                        <div className="hidden md:flex flex-1 max-w-lg mx-8">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-full">
                                <Heart className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={() => setShowCart(true)}
                                className="p-2 hover:bg-gray-100 rounded-full relative"
                            >
                                <ShoppingBag className="w-5 h-5 text-gray-600" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full">
                                <User className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">Shop with AI Assistant</h1>
                    <p className="text-lg md:text-xl opacity-90 mb-6">Just ask! "Show me party wear" or "Gift ideas for a birthday"</p>
                    <button
                        onClick={() => setChatOpen(true)}
                        className="px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 mx-auto"
                    >
                        <Mic className="w-5 h-5" />
                        Start Voice Shopping
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setCurrentCategory(cat.id);
                                setSelectedProduct(null);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${currentCategory === cat.id
                                    ? "bg-purple-600 text-white"
                                    : "bg-white border border-gray-200 hover:border-purple-300"
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span className="font-medium">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-32">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {visibleProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedProduct(product)}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl relative">
                                {product.image}
                                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                    #{index + 1}
                                </div>
                                <button className="absolute top-2 right-2 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Heart className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                                <div className="flex items-center gap-1 mb-2">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-gray-600">{product.rating} ({product.reviews})</span>
                                </div>
                                <p className="text-lg font-bold text-purple-600">${product.price}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="relative">
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-9xl">
                                    {selectedProduct.image}
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium">{selectedProduct.rating}</span>
                                            </div>
                                            <span className="text-gray-400">|</span>
                                            <span className="text-gray-600">{selectedProduct.reviews} reviews</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-purple-600">${selectedProduct.price}</p>
                                </div>

                                {selectedProduct.colors.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-sm text-gray-600 mb-2">Colors</p>
                                        <div className="flex gap-2">
                                            {selectedProduct.colors.map(color => (
                                                <button key={color} className="px-4 py-2 border border-gray-200 rounded-lg hover:border-purple-500 text-sm">
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mb-6">
                                    <button
                                        onClick={() => {
                                            addToCart(selectedProduct);
                                            setSelectedProduct(null);
                                        }}
                                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                                    >
                                        Add to Cart
                                    </button>
                                    <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                                        <Heart className="w-6 h-6 text-gray-600" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <Truck className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                                        <p className="text-gray-600">Free Shipping</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <RotateCcw className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                                        <p className="text-gray-600">30-Day Returns</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <Shield className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                                        <p className="text-gray-600">Secure Payment</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Sidebar */}
            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setShowCart(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col"
                        >
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="text-xl font-bold">Your Cart ({cart.length})</h2>
                                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Your cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.product.id} className="flex gap-4 bg-gray-50 p-3 rounded-xl">
                                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl">
                                                {item.product.image}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                                <p className="text-purple-600 font-bold">${item.product.price}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 bg-white rounded border">
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 bg-white rounded border">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-gray-400 hover:text-red-500">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            {cart.length > 0 && (
                                <div className="p-4 border-t">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-xl font-bold">${cartTotal}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCart(false);
                                            setShowCheckout(true);
                                        }}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Checkout Modal */}
            <AnimatePresence>
                {showCheckout && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold">Checkout</h2>
                                    <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Progress */}
                                <div className="flex items-center gap-2 mb-8">
                                    {[1, 2, 3].map(step => (
                                        <div key={step} className="flex items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step <= checkoutStep ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
                                                }`}>
                                                {step < checkoutStep ? <Check className="w-4 h-4" /> : step}
                                            </div>
                                            {step < 3 && <div className={`flex-1 h-1 mx-2 ${step < checkoutStep ? "bg-purple-600" : "bg-gray-200"}`} />}
                                        </div>
                                    ))}
                                </div>

                                {checkoutStep === 1 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-5 h-5" /> Shipping Address</h3>
                                        <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-xl" />
                                        <input type="text" placeholder="Address" className="w-full p-3 border rounded-xl" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="City" className="p-3 border rounded-xl" />
                                            <input type="text" placeholder="ZIP Code" className="p-3 border rounded-xl" />
                                        </div>
                                        <button onClick={() => setCheckoutStep(2)} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold">
                                            Continue to Payment
                                        </button>
                                    </div>
                                )}

                                {checkoutStep === 2 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Method</h3>
                                        <input type="text" placeholder="Card Number" className="w-full p-3 border rounded-xl" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="MM/YY" className="p-3 border rounded-xl" />
                                            <input type="text" placeholder="CVV" className="p-3 border rounded-xl" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setCheckoutStep(1)} className="flex-1 py-3 border rounded-xl">Back</button>
                                            <button onClick={() => setCheckoutStep(3)} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold">
                                                Place Order
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {checkoutStep === 3 && (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h3>
                                        <p className="text-gray-600 mb-6">Thank you for shopping with us. Your order will arrive in 3-5 business days.</p>
                                        <button
                                            onClick={() => {
                                                setShowCheckout(false);
                                                setCheckoutStep(1);
                                                setCart([]);
                                            }}
                                            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
                                        >
                                            Continue Shopping
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Chat Widget */}
            <div className="fixed bottom-4 right-4 z-50">
                <AnimatePresence>
                    {chatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Chat Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Bot className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Shopping Assistant</h3>
                                            <p className="text-xs opacity-90">
                                                {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Online"}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === "user"
                                                ? "bg-purple-600 text-white"
                                                : "bg-white shadow-sm"
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t bg-white">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleVoiceInput}
                                        className={`p-3 rounded-full transition-all ${isListening
                                                ? "bg-red-500 text-white animate-pulse"
                                                : "bg-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                                        placeholder="Type or speak..."
                                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Toggle Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${chatOpen
                            ? "bg-gray-800 text-white"
                            : "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                        }`}
                >
                    {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </motion.button>
            </div>
        </div>
    );
}
