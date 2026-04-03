"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  credit_balance: number;
  agent_count: number;
  created_at: string;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchUsers = (p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), page_size: String(pageSize) });
    if (q) params.set("q", q);
    fetch(`/api/super-admin/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, search);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total > 0 ? `${total} total users` : "All registered users"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-[#0a0f1e] border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">User</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Credits</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Agents</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Joined</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-800/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-5 bg-slate-800 rounded animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.name || "—"}</p>
                          <p className="text-slate-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.plan === "free" ? "bg-slate-700 text-slate-300" :
                        user.plan === "starter" ? "bg-blue-500/20 text-blue-300" :
                        user.plan === "pro" ? "bg-purple-500/20 text-purple-300" :
                        user.plan === "lifetime" ? "bg-amber-500/20 text-amber-300" :
                        "bg-green-500/20 text-green-300"
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{user.credit_balance}</td>
                    <td className="px-6 py-4 text-slate-300">{user.agent_count ?? 0}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/super-admin/users/${user.id}`}
                        className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
