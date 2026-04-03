"use client";

import { useEffect, useState } from "react";

interface Agent {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string | null;
  conversation_count: number;
  lead_count: number;
  is_public: boolean;
  model: string;
  created_at: string;
}

export default function SuperAdminAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchAgents = (p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), page_size: String(pageSize) });
    if (q) params.set("q", q);
    fetch(`/api/super-admin/agents?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.agents || []);
        setTotal(data.total || 0);
      })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAgents(page, search); }, [page]);

  const handleSearch = () => { setPage(1); fetchAgents(1, search); };
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <p className="text-slate-400 text-sm mt-1">
          {total > 0 ? `${total} total agents across all users` : "All AI agents on the platform"}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by agent name, slug, or owner email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-[#0a0f1e] border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button onClick={handleSearch} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Agent</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Owner</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Conversations</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Leads</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Model</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-800/50">
                    <td colSpan={7} className="px-6 py-4"><div className="h-5 bg-slate-800 rounded animate-pulse w-3/4" /></td>
                  </tr>
                ))
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No agents found</td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{agent.name}</p>
                        <p className="text-slate-500 text-xs font-mono">/{agent.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300 text-xs">{agent.owner_email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{agent.conversation_count}</td>
                    <td className="px-6 py-4 text-slate-300">{agent.lead_count}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">{agent.model}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        agent.is_public ? "bg-green-500/20 text-green-300" : "bg-slate-700 text-slate-400"
                      }`}>
                        {agent.is_public ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
