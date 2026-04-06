"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const devNoAuth = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

const navItems = [
    { href: "/admin/agents", label: "My Agents", icon: "🤖" },
    { href: "/admin/ai", label: "AI Generator", icon: "✨" },
];

export default function AdminNav() {
    const pathname = usePathname();
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        if (devNoAuth) {
            setEmail("dev@localhost");
            return;
        }
        try {
            const stored = localStorage.getItem("user_email");
            if (stored) setEmail(stored);
        } catch { }
    }, []);

    const handleSignOut = async () => {
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_avatar");
        const { signOut } = await import("next-auth/react");
        await signOut({ callbackUrl: "/login" });
    };

    return (
        <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Logo/Brand */}
                    <Link href="/admin/agents" className="flex items-center gap-2 font-bold text-lg">
                        <span className="text-2xl">🤖</span>
                        <span className="hidden sm:inline">Agent Forja</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname?.startsWith(item.href)
                                    ? "bg-white/20 text-white"
                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <span className="mr-1.5">{item.icon}</span>
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        {email && (
                            <span className="text-sm text-gray-400 hidden sm:inline">{email}</span>
                        )}
                        <button
                            onClick={handleSignOut}
                            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
