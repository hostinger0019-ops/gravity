"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch through Next.js API proxy (server-side) instead of direct GPU call
async function getChatbots() {
  const res = await fetch("/api/admin/chatbots");
  if (!res.ok) throw new Error("Failed to load chatbots");
  return res.json();
}

async function softDeleteChatbot(id: string) {
  const res = await fetch(`/api/admin/chatbots/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete chatbot");
}

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default function ChatbotsListPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: bots, isLoading } = useQuery({ queryKey: ["chatbots"], queryFn: getChatbots });

  // Redirect new users to onboarding wizard
  useEffect(() => {
    if (!isLoading && bots && bots.length === 0 && !localStorage.getItem("onboarding_completed")) {
      router.replace("/admin/onboarding");
    }
  }, [isLoading, bots, router]);

  const del = useMutation({
    mutationFn: softDeleteChatbot,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chatbots"] }),
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <BotIcon />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Agents</h1>
              <p className="text-gray-500">Create and manage your AI assistants</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              ✨ Create with AI
            </a>
            <a
              href="/admin/chatbots/new"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              <PlusIcon />
              Create Manually
            </a>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-5 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-3xl font-bold text-white">{bots?.length || 0}</div>
            <div className="text-sm text-gray-500">Total Agents</div>
          </div>
          <div className="rounded-xl p-5 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-3xl font-bold text-emerald-400">{bots?.filter(b => b.is_public).length || 0}</div>
            <div className="text-sm text-gray-500">Public</div>
          </div>
          <div className="rounded-xl p-5 border border-white/[0.08] bg-white/[0.02]">
            <div className="text-3xl font-bold text-gray-400">{bots?.filter(b => !b.is_public).length || 0}</div>
            <div className="text-sm text-gray-500">Private</div>
          </div>
        </div>

        {/* Chatbots Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-6 border border-white/[0.08] bg-white/[0.02] animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-24 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-white/10 rounded mb-4" />
                <div className="flex gap-2">
                  <div className="h-10 flex-1 bg-white/10 rounded-lg" />
                  <div className="h-10 flex-1 bg-white/10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {bots?.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-400">
              <BotIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No agents yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first AI agent and start engaging with your users instantly.
            </p>
            <a
              href="/admin/chatbots/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-gray-200 transition-all"
            >
              <PlusIcon />
              Create Your First Agent
            </a>
          </div>
        )}

        {/* Chatbot Cards */}
        {!isLoading && bots && bots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((b, idx) => (
              <div
                key={b.id}
                className="rounded-2xl p-6 border border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 group"
                style={{ animation: 'fadeInMsg 0.4s ease-out both', animationDelay: `${idx * 0.08}s` }}
              >
                {/* Bot Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                      {b.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{b.name}</h3>
                      <code className="text-xs text-gray-500 bg-white/[0.06] px-2 py-0.5 rounded">
                        /{b.slug}
                      </code>
                    </div>
                  </div>
                  {b.is_public ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-xs font-medium text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      Private
                    </span>
                  )}
                </div>

                {/* Updated Time */}
                <div className="text-sm text-gray-500 mb-5">
                  Updated {new Date(b.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/chatbots/${b.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all"
                    >
                      <EditIcon />
                      Edit
                    </Link>
                    {/* Leads */}
                    <Link
                      href={`/admin/leads?bot=${b.id}&name=${encodeURIComponent(b.name || 'Chatbot')}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all"
                      title="View captured leads"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Leads
                    </Link>
                    {/* Analytics */}
                    <Link
                      href={`/admin/chatbots/${b.id}/analytics`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] transition-all"
                      title="View Analytics"
                    >
                      📊
                    </Link>
                    {b.is_public && b.slug && (
                      <a
                        href={`/c/${b.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] transition-all"
                        title="Open live chatbot"
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                    {/* Restaurant-only: Orders & Reservations */}
                    {(b as any).theme_template === 'restaurant' && (
                      <>
                        <Link
                          href={`/admin/orders?bot=${b.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] transition-all"
                          title="Manage food orders"
                        >
                          🛒
                        </Link>
                        <Link
                          href={`/admin/reservations?bot=${b.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.06] transition-all"
                          title="Manage reservations"
                        >
                          📅
                        </Link>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this agent?')) {
                        del.mutate(b.id);
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/15 px-3 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/25 transition-all"
                    title="Delete agent"
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Card */}
            <a
              href="/admin/chatbots/new"
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-6 text-gray-500 hover:border-white/30 hover:text-white hover:bg-white/[0.02] transition-all duration-300 min-h-[200px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
                <PlusIcon />
              </div>
              <span className="font-medium">Create New Agent</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
