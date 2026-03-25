"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import Link from "next/link";

function LeadsContent() {
  const params = useSearchParams();
  const botId = params.get("bot") || "";
  const botName = params.get("name") || "Chatbot";

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads", botId],
    queryFn: async () => {
      const res = await fetch(`/api/leads?botId=${encodeURIComponent(botId)}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
    enabled: !!botId,
  });

  const leads = data?.leads || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/chatbots"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:bg-white/[0.06] transition-all text-gray-400 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Captured Leads</h1>
              <p className="text-gray-500 text-sm">{botName} — {leads.length} lead{leads.length !== 1 ? 's' : ''} captured</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {leads.length > 0 && (
              <button
                onClick={() => {
                  const csv = [
                    "Name,Email,Phone,Company,Status,Source,Date",
                    ...leads.map((l: any) =>
                      `"${l.name || ''}","${l.email}","${l.phone || ''}","${l.custom_fields?.company || ''}","${l.status || ''}","${l.source || ''}","${new Date(l.created_at).toLocaleDateString()}"`
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `leads-${botName.replace(/\s+/g, '-')}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl p-4 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-2xl font-bold text-white">{leads.length}</div>
            <div className="text-xs text-gray-500">Total Leads</div>
          </div>
          <div className="rounded-xl p-4 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-2xl font-bold text-emerald-400">{leads.filter((l: any) => l.status === 'new').length}</div>
            <div className="text-xs text-gray-500">New</div>
          </div>
          <div className="rounded-xl p-4 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-2xl font-bold text-blue-400">{leads.filter((l: any) => l.status === 'contacted').length}</div>
            <div className="text-xs text-gray-500">Contacted</div>
          </div>
          <div className="rounded-xl p-4 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-2xl font-bold text-amber-400">{leads.filter((l: any) => l.source === 'chat').length}</div>
            <div className="text-xs text-gray-500">From Chat</div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-5 border border-white/[0.08] bg-white/[0.02] animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-white/10 rounded" />
                  <div className="h-3 w-60 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 text-red-400">
            Failed to load leads. Make sure the GPU backend is running.
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && leads.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No leads yet</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Leads will appear here when visitors interact with your chatbot and share their contact information.
            </p>
          </div>
        )}

        {/* Leads Table */}
        {!isLoading && leads.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any, idx: number) => (
                  <tr
                    key={lead.id || idx}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    style={{ animation: 'fadeInMsg 0.3s ease-out both', animationDelay: `${idx * 0.04}s` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-sm font-medium text-white">
                          {(lead.name || lead.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{lead.name || '—'}</div>
                          <div className="text-xs text-gray-500">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{lead.phone || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{lead.custom_fields?.company || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        lead.status === 'new'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : lead.status === 'contacted'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                          : lead.status === 'qualified'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          : 'bg-white/[0.06] border border-white/10 text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          lead.status === 'new' ? 'bg-emerald-400'
                          : lead.status === 'contacted' ? 'bg-blue-400'
                          : lead.status === 'qualified' ? 'bg-amber-400'
                          : 'bg-gray-500'
                        }`} />
                        {lead.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{lead.source || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LeadsContent />
    </Suspense>
  );
}
