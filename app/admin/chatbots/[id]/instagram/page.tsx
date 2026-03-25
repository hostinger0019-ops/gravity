"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";

interface InstagramConnection {
    id: string;
    instagram_account_id: string;
    instagram_username: string | null;
    facebook_page_id: string;
    is_active: boolean;
    created_at: string;
    token_expires_at: string | null;
}

export default function InstagramSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: botId } = use(params);
    const qc = useQueryClient();
    const searchParams = useSearchParams();

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Check URL params for OAuth result
    useEffect(() => {
        const successParam = searchParams.get("success");
        const errorParam = searchParams.get("error");

        if (successParam === "connected") {
            setSuccess("🎉 Instagram connected successfully!");
            qc.invalidateQueries({ queryKey: ["instagram-connection", botId] });
        } else if (errorParam) {
            const errorMessages: Record<string, string> = {
                oauth_denied: "You denied the Instagram permissions request.",
                missing_code: "Authorization code was not received.",
                invalid_state: "Invalid state parameter.",
                token_exchange_failed: "Failed to exchange authorization code.",
                no_pages: "No Facebook Pages found. You need a Facebook Page linked to Instagram.",
                no_instagram: "No Instagram Business Account found linked to your Facebook Page.",
                db_error: "Database error while saving connection.",
                unknown: "An unknown error occurred.",
            };
            setError(errorMessages[errorParam] || `Error: ${errorParam}`);
        }
    }, [searchParams, botId, qc]);

    // Fetch chatbot details
    const { data: chatbot, isLoading: loadingBot } = useQuery({
        queryKey: ["chatbot", botId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/chatbots/${botId}`);
            if (!res.ok) throw new Error("Failed to fetch chatbot");
            return res.json();
        },
    });

    // Fetch existing connection
    const { data: connection, isLoading: loadingConnection } = useQuery({
        queryKey: ["instagram-connection", botId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/instagram/connections?botId=${botId}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.connection as InstagramConnection | null;
        },
    });

    const handleConnectOAuth = () => {
        // Redirect to OAuth start endpoint
        window.location.href = `/api/auth/instagram?chatbotId=${botId}`;
    };

    const handleDisconnect = async () => {
        if (!connection) return;
        if (!confirm("Are you sure you want to disconnect Instagram?")) return;

        try {
            const res = await fetch(`/api/admin/instagram/${connection.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                qc.invalidateQueries({ queryKey: ["instagram-connection", botId] });
                setSuccess("Instagram disconnected");
                setError("");
            }
        } catch {
            setError("Failed to disconnect");
        }
    };

    const webhookUrl = typeof window !== "undefined"
        ? `${window.location.origin}/api/webhooks/instagram`
        : "/api/webhooks/instagram";

    if (loadingBot || loadingConnection) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                        <div className="h-64 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/chatbots" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">
                        ← Back to Chatbots
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="text-3xl">📷</span>
                        Instagram Automation
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Connect Instagram to <span className="font-medium">{chatbot?.name || "this chatbot"}</span>
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                        <span>❌</span>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
                        <span>✅</span>
                        {success}
                    </div>
                )}

                {/* Current Connection */}
                {connection && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg">
                                    📷
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-lg">
                                        @{connection.instagram_username || "Connected Account"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        ID: {connection.instagram_account_id}
                                    </div>
                                    {connection.token_expires_at && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            Token expires: {new Date(connection.token_expires_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${connection.is_active
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}>
                                    {connection.is_active ? "✓ Active" : "Inactive"}
                                </span>
                                <button
                                    onClick={handleDisconnect}
                                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>

                        {/* Connection Status */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-green-600">
                                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-sm font-medium">Bot is receiving DMs and will auto-reply</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Connect Button (if not connected) */}
                {!connection && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl">
                            📷
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Instagram</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Click below to login with Facebook and grant permissions for Instagram DM automation.
                        </p>

                        <button
                            onClick={handleConnectOAuth}
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 transition-all shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                            Connect with Instagram
                        </button>

                        <p className="text-xs text-gray-400 mt-4">
                            You'll be redirected to Facebook to grant permissions
                        </p>
                    </div>
                )}

                {/* Webhook Info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🔗</span> Webhook Configuration
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Add this webhook URL to your Meta App Dashboard:
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Callback URL</label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-xl font-mono text-sm break-all border border-gray-200">
                                {webhookUrl}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Subscribed Fields</label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-xl text-sm border border-gray-200">
                                <code>messages</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <span>📖</span> How it works
                    </h3>
                    <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li>Click <strong>"Connect with Instagram"</strong> above</li>
                        <li>Login to Facebook and grant permissions</li>
                        <li>Your Instagram Business Account will be connected</li>
                        <li>When someone DMs your Instagram, the AI chatbot will auto-reply!</li>
                    </ol>

                    <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-xs text-blue-700">
                            <strong>Requirements:</strong> Instagram Business or Creator account linked to a Facebook Page
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
