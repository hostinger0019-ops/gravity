"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Plan definitions (client-side mirror)
const PLANS: Record<string, {
    name: string; category: string; priceCents: number;
    messageLimit: number; chatbotLimit: number; voiceIncluded: boolean;
    features: string[];
}> = {
    free: { name: "Free", category: "free", priceCents: 0, messageLimit: 50, chatbotLimit: 1, voiceIncluded: false, features: ["1 chatbot", "50 messages/month", "Embed widget"] },
    starter: { name: "Starter", category: "monthly", priceCents: 4900, messageLimit: 5000, chatbotLimit: 5, voiceIncluded: false, features: ["5 chatbots", "5,000 messages/month", "Embed widget", "Lead capture", "Email support"] },
    pro: { name: "Pro", category: "monthly", priceCents: 14900, messageLimit: 20000, chatbotLimit: 0, voiceIncluded: true, features: ["Unlimited chatbots", "20,000 messages/month", "Voice bot included", "Instagram DM", "Advanced lead capture", "Priority support"] },
    enterprise: { name: "Enterprise", category: "monthly", priceCents: 0, messageLimit: 0, chatbotLimit: 0, voiceIncluded: true, features: ["Unlimited everything", "Custom voice", "SLA guarantee", "Dedicated support"] },
    ltd_starter: { name: "LTD Starter", category: "lifetime", priceCents: 9900, messageLimit: 2000, chatbotLimit: 3, voiceIncluded: false, features: ["3 chatbots", "2,000 messages/month", "White-label", "7 themes", "Lead capture"] },
    ltd_reseller_pro: { name: "LTD Reseller Pro", category: "lifetime", priceCents: 19900, messageLimit: 5000, chatbotLimit: 15, voiceIncluded: false, features: ["15 chatbots", "5,000 messages/month", "Instagram", "Smarter AI", "Priority support"] },
    ltd_agency_elite: { name: "LTD Agency Elite", category: "lifetime", priceCents: 39900, messageLimit: 15000, chatbotLimit: 30, voiceIncluded: true, features: ["30 chatbots", "15,000 messages/month", "Voice bot included", "Bring own API key", "Dedicated support"] },
};

function formatPrice(cents: number) {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
}

export default function BillingPage() {
    const { data: session } = useSession();
    const [chatbotCount, setChatbotCount] = useState(0);
    const [usage, setUsage] = useState({ message_count: 0, voice_minutes: 0 });
    const [loading, setLoading] = useState(true);

    const userPlan = (session?.user as any)?.plan || "free";
    const creditBalance = (session?.user as any)?.credit_balance ?? 0;
    const plan = PLANS[userPlan] || PLANS.free;

    useEffect(() => {
        async function loadData() {
            try {
                // Fetch chatbot count
                const botsRes = await fetch("/api/admin/chatbots");
                if (botsRes.ok) {
                    const bots = await botsRes.json();
                    setChatbotCount(Array.isArray(bots) ? bots.length : 0);
                }

                // Fetch usage from GPU backend
                const gpuId = (session?.user as any)?.gpu_id;
                if (gpuId) {
                    const usageRes = await fetch(`/api/usage?userId=${gpuId}`);
                    if (usageRes.ok) {
                        const data = await usageRes.json();
                        setUsage(data);
                    }
                }
            } catch (e) {
                console.error("Failed to load billing data:", e);
            } finally {
                setLoading(false);
            }
        }
        if (session?.user) loadData();
        else setLoading(false);
    }, [session]);

    const msgPercent = plan.messageLimit > 0 ? Math.min(100, Math.round((usage.message_count / plan.messageLimit) * 100)) : 0;
    const botPercent = plan.chatbotLimit > 0 ? Math.min(100, Math.round((chatbotCount / plan.chatbotLimit) * 100)) : 0;

    return (
        <div style={{
            minHeight: "100vh", background: "#0a0a0a", color: "#fff",
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* Header */}
            <div style={{
                maxWidth: 960, margin: "0 auto", padding: "40px 24px",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Billing & Usage</h1>
                        <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>Manage your subscription and monitor usage</p>
                    </div>
                    <Link href="/admin/chatbots" style={{
                        fontSize: 13, color: "#818cf8", textDecoration: "none",
                        padding: "8px 16px", border: "1px solid rgba(129,140,248,0.3)",
                        borderRadius: 8, transition: "all 0.2s",
                    }}>← My Bots</Link>
                </div>

                {/* Current Plan Card */}
                <div style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 16, padding: "28px 28px 24px", marginBottom: 24,
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>CURRENT PLAN</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                                <span style={{
                                    fontSize: 28, fontWeight: 700,
                                    background: plan.category === "lifetime"
                                        ? "linear-gradient(135deg, #F59E0B, #EF4444)"
                                        : "linear-gradient(135deg, #818cf8, #a78bfa)",
                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                }}>{plan.name}</span>
                                <span style={{
                                    fontSize: 12, padding: "2px 8px", borderRadius: 4,
                                    background: plan.category === "lifetime" ? "rgba(245,158,11,0.15)" : "rgba(99,102,241,0.15)",
                                    color: plan.category === "lifetime" ? "#F59E0B" : "#818cf8",
                                    fontWeight: 600,
                                }}>{plan.category === "lifetime" ? "LIFETIME" : plan.category === "monthly" ? "MONTHLY" : "FREE"}</span>
                            </div>
                            {plan.priceCents > 0 && (
                                <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
                                    {formatPrice(plan.priceCents)}{plan.category === "monthly" ? "/month" : " one-time"}
                                </div>
                            )}
                        </div>
                        <Link href="/pricing" style={{
                            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                            color: "#fff", padding: "10px 24px", borderRadius: 10,
                            textDecoration: "none", fontWeight: 600, fontSize: 14,
                            transition: "all 0.2s", boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                        }}>Upgrade Plan</Link>
                    </div>
                </div>

                {/* Usage + Credits Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
                    {/* Messages Usage */}
                    <div style={{
                        background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: 24,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Messages This Month</span>
                            <span style={{ fontSize: 13, color: msgPercent > 80 ? "#ef4444" : "#4ade80", fontWeight: 600 }}>{msgPercent}%</span>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                            {loading ? "—" : usage.message_count.toLocaleString()}
                            <span style={{ fontSize: 14, color: "#666", fontWeight: 400 }}> / {plan.messageLimit === 0 ? "∞" : plan.messageLimit.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 3, transition: "width 0.5s ease",
                                width: `${msgPercent}%`,
                                background: msgPercent > 80 ? "linear-gradient(90deg, #ef4444, #f97316)" : "linear-gradient(90deg, #4ade80, #22d3ee)",
                            }} />
                        </div>
                    </div>

                    {/* Chatbots Usage */}
                    <div style={{
                        background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: 24,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Active Chatbots</span>
                            <span style={{ fontSize: 13, color: botPercent > 80 ? "#ef4444" : "#4ade80", fontWeight: 600 }}>
                                {plan.chatbotLimit === 0 ? "Unlimited" : `${botPercent}%`}
                            </span>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                            {loading ? "—" : chatbotCount}
                            <span style={{ fontSize: 14, color: "#666", fontWeight: 400 }}> / {plan.chatbotLimit === 0 ? "∞" : plan.chatbotLimit}</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 3, transition: "width 0.5s ease",
                                width: plan.chatbotLimit === 0 ? "0%" : `${botPercent}%`,
                                background: botPercent > 80 ? "linear-gradient(90deg, #ef4444, #f97316)" : "linear-gradient(90deg, #818cf8, #a78bfa)",
                            }} />
                        </div>
                    </div>

                    {/* Credits */}
                    <div style={{
                        background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: 24,
                    }}>
                        <div style={{ fontSize: 13, color: "#888", fontWeight: 500, marginBottom: 12 }}>Credit Balance</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>
                            {loading ? "—" : creditBalance}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>Credits are consumed per AI interaction</div>
                    </div>
                </div>

                {/* Plan Features */}
                <div style={{
                    background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, padding: 24, marginBottom: 24,
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Plan Features</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                        {plan.features.map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ccc" }}>
                                <span style={{ color: "#4ade80", fontSize: 14 }}>✓</span>
                                {f}
                            </div>
                        ))}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.voiceIncluded ? "#ccc" : "#555" }}>
                            <span style={{ color: plan.voiceIncluded ? "#4ade80" : "#ef4444", fontSize: 14 }}>{plan.voiceIncluded ? "✓" : "✕"}</span>
                            Voice Bot {plan.voiceIncluded ? "(included)" : "(add-on: $29/mo)"}
                        </div>
                    </div>
                </div>

                {/* Add-ons */}
                {!plan.voiceIncluded && (
                    <div style={{
                        background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: 24, marginBottom: 24,
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Available Add-ons</h3>
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "16px 20px", background: "rgba(255,255,255,0.03)",
                            borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
                        }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>🎙️ Voice Bot</div>
                                <div style={{ fontSize: 12, color: "#888" }}>Add voice interaction to your chatbots</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: "#818cf8" }}>$29<span style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>/mo</span></span>
                                <button style={{
                                    background: "rgba(99,102,241,0.15)", color: "#818cf8",
                                    border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8,
                                    padding: "8px 16px", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                }}>Add</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Plans Comparison */}
                <div style={{
                    background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, padding: 24,
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>All Plans</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontWeight: 500 }}>Plan</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", color: "#888", fontWeight: 500 }}>Price</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", color: "#888", fontWeight: 500 }}>Chatbots</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", color: "#888", fontWeight: 500 }}>Messages/mo</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", color: "#888", fontWeight: 500 }}>Voice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(PLANS).map(([id, p]) => (
                                    <tr key={id} style={{
                                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                                        background: id === userPlan ? "rgba(99,102,241,0.08)" : "transparent",
                                    }}>
                                        <td style={{ padding: "12px", fontWeight: id === userPlan ? 700 : 400 }}>
                                            {p.name} {id === userPlan && <span style={{ color: "#818cf8", fontSize: 11 }}>← Current</span>}
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px" }}>
                                            {p.priceCents === 0 ? (id === "enterprise" ? "Custom" : "Free") : `$${(p.priceCents / 100).toFixed(0)}`}
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px" }}>{p.chatbotLimit === 0 ? "∞" : p.chatbotLimit}</td>
                                        <td style={{ textAlign: "center", padding: "12px" }}>{p.messageLimit === 0 ? "∞" : p.messageLimit.toLocaleString()}</td>
                                        <td style={{ textAlign: "center", padding: "12px" }}>{p.voiceIncluded ? "✅" : "Add-on"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Account Info */}
                <div style={{
                    marginTop: 24, padding: "16px 20px",
                    background: "#141414", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
                }}>
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                        <div style={{
                            width: 40, height: 40, borderRadius: "50%",
                            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, fontWeight: 700,
                        }}>{(session?.user?.name || "U")[0].toUpperCase()}</div>
                    )}
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{session?.user?.name || "User"}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{session?.user?.email}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
