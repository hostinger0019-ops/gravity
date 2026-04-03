"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  credit_balance: number;
  created_at: string;
  agents: Array<{
    id: string;
    name: string;
    slug: string;
    conversation_count: number;
    lead_count: number;
    created_at: string;
  }>;
  credit_history: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: string;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [newPlan, setNewPlan] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    fetch(`/api/super-admin/users/${userId}/details`)
      .then((r) => r.json())
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAddCredits = async () => {
    const amount = parseInt(creditsToAdd);
    if (!amount || isNaN(amount)) return;
    const res = await fetch(`/api/super-admin/users/${userId}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      setActionMsg(`Added ${amount} credits`);
      setCreditsToAdd("");
      // Refresh
      const data = await fetch(`/api/super-admin/users/${userId}/details`).then((r) => r.json());
      setUser(data);
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleChangePlan = async () => {
    if (!newPlan) return;
    const res = await fetch(`/api/super-admin/users/${userId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    if (res.ok) {
      setActionMsg(`Plan changed to ${newPlan}`);
      setNewPlan("");
      const data = await fetch(`/api/super-admin/users/${userId}/details`).then((r) => r.json());
      setUser(data);
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="h-40 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-slate-500">User not found or backend unavailable.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/users" className="text-slate-400 hover:text-white transition-colors">
          ← Back to Users
        </Link>
      </div>

      {actionMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm">
          ✅ {actionMsg}
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
        <div className="flex items-start gap-6">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.name || user.email}</h1>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.plan === "free" ? "bg-slate-700 text-slate-300" :
                user.plan === "starter" ? "bg-blue-500/20 text-blue-300" :
                user.plan === "pro" ? "bg-purple-500/20 text-purple-300" :
                "bg-amber-500/20 text-amber-300"
              }`}>
                {user.plan} plan
              </span>
              <span className="text-sm text-slate-400">
                ⚡ {user.credit_balance} credits
              </span>
              <span className="text-sm text-slate-400">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Add Credits</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleAddCredits}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Change Plan</h3>
          <div className="flex gap-2">
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select plan</option>
              <option value="free">Free</option>
              <option value="starter">Starter ($49)</option>
              <option value="pro">Pro ($149)</option>
              <option value="lifetime">Lifetime</option>
            </select>
            <button
              onClick={handleChangePlan}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* User's Agents */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold">AI Agents ({user.agents?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Name</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Slug</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Conversations</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Leads</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(user.agents || []).map((agent) => (
                <tr key={agent.id} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{agent.name}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{agent.slug}</td>
                  <td className="px-6 py-4 text-slate-300">{agent.conversation_count}</td>
                  <td className="px-6 py-4 text-slate-300">{agent.lead_count}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!user.agents || user.agents.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-slate-500">No agents created</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit History */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Credit History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Amount</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Type</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Description</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(user.credit_history || []).map((tx) => (
                <tr key={tx.id} className="border-t border-slate-800/50">
                  <td className={`px-6 py-3 font-medium ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-xs">{tx.type}</td>
                  <td className="px-6 py-3 text-slate-300 text-xs">{tx.description || "—"}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!user.credit_history || user.credit_history.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-slate-500">No transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
