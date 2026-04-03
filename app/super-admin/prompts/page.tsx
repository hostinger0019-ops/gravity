"use client";

import { useEffect, useState } from "react";

interface PromptConfig {
  landing_prompt: string;
  chat_prompt: string;
  voice_prompt: string;
}

const PROMPT_SECTIONS = [
  {
    key: "landing_prompt",
    label: "Landing Page Chat Prompt",
    description: "System prompt for the AI assistant on the main landing page (agentforja.com). Controls how the landing chatbot greets and assists visitors.",
    rows: 12,
  },
  {
    key: "chat_prompt",
    label: "AI Agent Builder — Chat Prompt",
    description: "System prompt for the AI builder chat. This controls how the AI guides users to create chatbots through conversation.",
    rows: 16,
  },
  {
    key: "voice_prompt",
    label: "AI Agent Builder — Voice Prompt",
    description: "System prompt for the voice-based AI builder. Controls how the AI responds in voice mode.",
    rows: 12,
  },
];

export default function SuperAdminPrompts() {
  const [prompts, setPrompts] = useState<PromptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/prompts")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPrompts(data);
        }
      })
      .catch(() => setError("Failed to load prompts"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    if (!prompts) return;
    setSaving(key);
    try {
      const res = await fetch("/api/super-admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: (prompts as any)[key] }),
      });
      if (res.ok) {
        setSaved(key);
        setTimeout(() => setSaved(null), 3000);
      }
    } catch {
      setError("Failed to save");
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-60 bg-slate-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error && !prompts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Prompts</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system prompts for all AI interactions</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-amber-300">
          <h2 className="text-lg font-semibold mb-2">Backend Not Connected</h2>
          <p className="text-sm">
            The admin config API is not available yet. Once <code>GET /api/admin/config</code> is deployed on the GPU backend, prompts will be editable here.
          </p>
          <p className="text-xs text-amber-400 mt-3">
            Current prompts are hardcoded in:
          </p>
          <ul className="text-xs text-amber-400 mt-1 list-disc list-inside space-y-1">
            <li><code>app/page.tsx</code> — landing page prompt</li>
            <li><code>app/api/ai-generator/chat/route.ts</code> — chat builder prompt</li>
            <li><code>app/api/ai-generator/voice/route.ts</code> — voice builder prompt</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Prompts</h1>
        <p className="text-slate-400 text-sm mt-1">
          Edit system prompts that control AI behavior across the platform
        </p>
      </div>

      {PROMPT_SECTIONS.map((section) => (
        <div key={section.key} className="bg-[#0a0f1e] border border-slate-800 rounded-xl">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold">{section.label}</h2>
            <p className="text-slate-400 text-xs mt-1">{section.description}</p>
          </div>
          <div className="p-6">
            <textarea
              value={(prompts as any)?.[section.key] || ""}
              onChange={(e) =>
                setPrompts((prev) => prev ? { ...prev, [section.key]: e.target.value } : prev)
              }
              rows={section.rows}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white font-mono leading-relaxed placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-y transition-colors"
              placeholder="Enter system prompt..."
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-500">
                {((prompts as any)?.[section.key] || "").length} characters
              </p>
              <div className="flex items-center gap-3">
                {saved === section.key && (
                  <span className="text-green-400 text-xs">✅ Saved</span>
                )}
                <button
                  onClick={() => handleSave(section.key)}
                  disabled={saving === section.key}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving === section.key ? "Saving..." : "Save Prompt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
