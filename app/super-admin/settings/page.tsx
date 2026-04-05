"use client";

import { useEffect, useState } from "react";

interface LlmConfig {
  landing_provider: string;
  landing_model: string;
  chatbot_provider: string;
  chatbot_model: string;
}

const PROVIDERS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  groq: {
    label: "Groq (Free, Ultra-fast)",
    models: [
      { value: "moonshotai/kimi-k2-instruct-0905", label: "Kimi K2 (Default)" },
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "qwen-qwq-32b", label: "Qwen QwQ 32B" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
    ],
  },
  openai: {
    label: "OpenAI (Paid)",
    models: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    ],
  },
  claude: {
    label: "Claude (Paid)",
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    ],
  },
};

const DEFAULT_LLM: LlmConfig = {
  landing_provider: "groq",
  landing_model: "moonshotai/kimi-k2-instruct-0905",
  chatbot_provider: "groq",
  chatbot_model: "moonshotai/kimi-k2-instruct-0905",
};

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  credits: string;
  features: string[];
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "500 credits (14 days)",
    features: [
      "1 AI agent",
      "500 credits",
      "Website embed widget",
      "Basic analytics",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/month",
    credits: "5,000 credits/month",
    features: [
      "5 AI agents",
      "5,000 credits/month",
      "Website embed widget",
      "Lead capture",
      "1 voice minute = 10 credits",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149",
    period: "/month",
    credits: "20,000 credits/month",
    features: [
      "Unlimited AI agents",
      "20,000 credits/month",
      "Website + Instagram integration",
      "Voice agent support",
      "Advanced lead capture",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    credits: "Unlimited",
    features: [
      "Unlimited AI agents",
      "Unlimited credits",
      "All integrations",
      "Custom voice agent",
      "Dedicated account manager",
      "Custom AI training",
    ],
  },
];

export default function SuperAdminSettings() {
  const [plans, setPlans] = useState<PricingPlan[]>(DEFAULT_PLANS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  // LLM Config
  const [llm, setLlm] = useState<LlmConfig>(DEFAULT_LLM);
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmSaved, setLlmSaved] = useState(false);

  useEffect(() => {
    // Try to load from backend
    fetch("/api/super-admin/config?key=pricing")
      .then((r) => r.json())
      .then((data) => {
        if (data.value) {
          try {
            setPlans(JSON.parse(data.value));
          } catch {}
        }
      })
      .catch(() => {});

    // Load LLM config
    fetch("/api/super-admin/config?key=llm_config")
      .then((r) => r.json())
      .then((data) => {
        if (data.value) {
          try {
            setLlm({ ...DEFAULT_LLM, ...JSON.parse(data.value) });
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await fetch("/api/super-admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing", value: JSON.stringify(plans) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleSaveLlm = async () => {
    setLlmSaving(true);
    try {
      await fetch("/api/super-admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "llm_config", value: JSON.stringify(llm) }),
      });
      setLlmSaved(true);
      setTimeout(() => setLlmSaved(false), 3000);
    } catch {}
    setLlmSaving(false);
  };

  const handleProviderChange = (target: "landing" | "chatbot", provider: string) => {
    const firstModel = PROVIDERS[provider]?.models[0]?.value || "";
    setLlm((prev) => ({
      ...prev,
      [`${target}_provider`]: provider,
      [`${target}_model`]: firstModel,
    }));
  };

  const updatePlan = (id: string, field: string, value: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const updateFeature = (planId: string, index: number, value: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, features: p.features.map((f, i) => (i === index ? value : f)) }
          : p
      )
    );
  };

  const addFeature = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, features: [...p.features, "New feature"] } : p
      )
    );
  };

  const removeFeature = (planId: string, index: number) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== index) } : p
      )
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Platform configuration and pricing management</p>
      </div>

      {/* Platform Info */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Platform Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Product</span>
            <span className="text-white">Agent Forja</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Company</span>
            <span className="text-white">Tarik Fashion Company</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Server Location</span>
            <span className="text-white">Canada (A6000 GPU)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Payment Processor</span>
            <span className="text-white">Lemon Squeezy (MoR)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">AI Inference</span>
            <span className="text-white">Groq + Self-hosted vLLM</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Database</span>
            <span className="text-white">PostgreSQL (GPU Server)</span>
          </div>
        </div>
      </div>

      {/* LLM Configuration */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">LLM Configuration</h2>
            <p className="text-slate-400 text-xs mt-1">Choose AI provider and model for each chat flow</p>
          </div>
          <div className="flex items-center gap-3">
            {llmSaved && <span className="text-green-400 text-xs">✅ Saved</span>}
            <button
              onClick={handleSaveLlm}
              disabled={llmSaving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {llmSaving ? "Saving..." : "Save LLM Config"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Landing Page (Bot Builder) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">Landing Page (Bot Builder)</h3>
            <p className="text-xs text-slate-500 mb-4">Model used for the AI chatbot builder on the main page</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Provider</label>
                <select
                  value={llm.landing_provider}
                  onChange={(e) => handleProviderChange("landing", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {Object.entries(PROVIDERS).map(([key, p]) => (
                    <option key={key} value={key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Model</label>
                <select
                  value={llm.landing_model}
                  onChange={(e) => setLlm((prev) => ({ ...prev, landing_model: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {PROVIDERS[llm.landing_provider]?.models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Public Chatbot */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">Public Chatbots</h3>
            <p className="text-xs text-slate-500 mb-4">Model used for all user-created chatbots</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Provider</label>
                <select
                  value={llm.chatbot_provider}
                  onChange={(e) => handleProviderChange("chatbot", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {Object.entries(PROVIDERS).map(([key, p]) => (
                    <option key={key} value={key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Model</label>
                <select
                  value={llm.chatbot_model}
                  onChange={(e) => setLlm((prev) => ({ ...prev, chatbot_model: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {PROVIDERS[llm.chatbot_provider]?.models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pricing Plans</h2>
            <p className="text-slate-400 text-xs mt-1">Edit plan names, prices, and features</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-green-400 text-xs">✅ Saved</span>}
            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "Saving..." : "Save All Plans"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <input
                  value={plan.name}
                  onChange={(e) => updatePlan(plan.id, "name", e.target.value)}
                  className="bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {editingPlan === plan.id ? "Done" : "Edit"}
                </button>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <input
                  value={plan.price}
                  onChange={(e) => updatePlan(plan.id, "price", e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white w-24 focus:outline-none border-b border-transparent focus:border-purple-500"
                />
                <input
                  value={plan.period}
                  onChange={(e) => updatePlan(plan.id, "period", e.target.value)}
                  className="bg-transparent text-sm text-slate-400 w-20 focus:outline-none border-b border-transparent focus:border-purple-500"
                />
              </div>

              <input
                value={plan.credits}
                onChange={(e) => updatePlan(plan.id, "credits", e.target.value)}
                className="bg-transparent text-xs text-purple-400 mb-4 w-full focus:outline-none border-b border-transparent focus:border-purple-500"
              />

              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-green-400 text-xs">✓</span>
                    {editingPlan === plan.id ? (
                      <div className="flex-1 flex gap-1">
                        <input
                          value={feature}
                          onChange={(e) => updateFeature(plan.id, i, e.target.value)}
                          className="flex-1 bg-slate-800/50 px-2 py-1 rounded text-xs focus:outline-none focus:border-purple-500 border border-transparent"
                        />
                        <button
                          onClick={() => removeFeature(plan.id, i)}
                          className="text-red-400 hover:text-red-300 text-xs px-1"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span>{feature}</span>
                    )}
                  </li>
                ))}
              </ul>

              {editingPlan === plan.id && (
                <button
                  onClick={() => addFeature(plan.id)}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  + Add Feature
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
