"use client";

import { useEffect, useState } from "react";

interface Stats {
  total_users: number;
  total_agents: number;
  total_conversations: number;
  total_messages: number;
  total_leads: number;
  total_credits_used: number;
  signups_today: number;
  signups_week: number;
  signups_month: number;
  recent_users: Array<{
    id: string;
    email: string;
    name: string;
    plan: string;
    credit_balance: number;
    created_at: string;
  }>;
}

const KPI_CARDS = [
  { key: "total_users", label: "Total Users", icon: "👥", color: "from-blue-500 to-cyan-500" },
  { key: "total_agents", label: "AI Agents", icon: "🤖", color: "from-purple-500 to-pink-500" },
  { key: "total_conversations", label: "Conversations", icon: "💬", color: "from-green-500 to-emerald-500" },
  { key: "total_messages", label: "Messages", icon: "📨", color: "from-orange-500 to-amber-500" },
  { key: "total_leads", label: "Leads Captured", icon: "🎯", color: "from-rose-500 to-red-500" },
  { key: "total_credits_used", label: "Credits Used", icon: "⚡", color: "from-violet-500 to-indigo-500" },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
        }
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300">
        <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-red-400 mt-2">
          The GPU backend admin API may not be deployed yet. Stats will appear once <code>/api/admin/stats</code> is available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {KPI_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${card.color} text-white font-medium`}>
                {card.label}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">
              {((stats as any)?.[card.key] ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Signup Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm">Signups Today</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats?.signups_today ?? 0}</p>
        </div>
        <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm">This Week</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats?.signups_week ?? 0}</p>
        </div>
        <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm">This Month</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats?.signups_month ?? 0}</p>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Name</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Credits</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent_users || []).map((user) => (
                <tr key={user.id} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-white">{user.email}</td>
                  <td className="px-6 py-4 text-slate-300">{user.name || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.plan === "free" ? "bg-slate-700 text-slate-300" :
                      user.plan === "starter" ? "bg-blue-500/20 text-blue-300" :
                      user.plan === "pro" ? "bg-purple-500/20 text-purple-300" :
                      "bg-green-500/20 text-green-300"
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{user.credit_balance}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {(!stats?.recent_users || stats.recent_users.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users yet — data will appear once the admin API is connected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
