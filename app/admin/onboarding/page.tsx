"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { industryTemplates } from "@/data/industry-templates";

const STEPS = ["Business Info", "Choose Industry", "Creating Agent"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  // If already completed onboarding, redirect
  useEffect(() => {
    if (localStorage.getItem("onboarding_completed")) {
      router.replace("/admin/chatbots");
    }
  }, [router]);

  // Progress animation during creation
  useEffect(() => {
    if (!creating) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 15));
    }, 500);
    return () => clearInterval(interval);
  }, [creating]);

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    setStep(2);
    setError("");
    setProgress(10);

    const template = industryTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    const agentName = businessName.trim()
      ? `${businessName.trim()} Assistant`
      : `${template.name} Agent`;

    const slug = (businessName.trim() || template.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const config = {
      name: agentName,
      slug,
      greeting: template.suggestedGreeting,
      directive: template.suggestedDirective,
      starterQuestions: template.suggestedQuestions,
      brandColor: template.suggestedColor,
      theme: template.suggestedTheme,
      websiteToScrape: websiteUrl.trim() || undefined,
    };

    try {
      const res = await fetch("/api/ai-generator/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to create agent. Please try again.");
        setStep(1);
        setCreating(false);
        return;
      }

      setProgress(100);
      localStorage.setItem("onboarding_completed", "true");

      // Show success for a moment, then redirect
      setTimeout(() => {
        router.replace("/admin/chatbots");
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
      setStep(1);
      setCreating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.replace("/admin/chatbots");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-8 pt-8 pb-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                  ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/[0.06] text-gray-500 border border-white/10"
              }`}
            >
              {i < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                i <= step ? "text-white" : "text-gray-600"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-px ml-2 transition-colors duration-300 ${i < step ? "bg-emerald-500/50" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        {/* Step 1: Business Info */}
        {step === 0 && (
          <div className="w-full max-w-xl animate-[fadeInUp_0.4s_ease-out]">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 mb-6">
                <span className="text-4xl">🚀</span>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Welcome to Agent Forja!
              </h1>
              <p className="text-lg text-gray-400">
                Let&apos;s create your first AI agent in 60 seconds
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What&apos;s your business name?
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && businessName.trim() && setStep(1)}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3.5 text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
                    placeholder="e.g. BookWorld, NYC Pizza, Dr. Smith Clinic"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your website <span className="text-gray-600">(optional — we&apos;ll import your content)</span>
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && businessName.trim() && setStep(1)}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3.5 text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!businessName.trim()}
                className="w-full mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3.5 font-semibold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                Next →
              </button>
            </div>

            <button
              onClick={handleSkip}
              className="block mx-auto mt-6 text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip, I&apos;ll set up manually
            </button>
          </div>
        )}

        {/* Step 2: Choose Industry */}
        {step === 1 && (
          <div className="w-full max-w-3xl animate-[fadeInUp_0.4s_ease-out]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">What does your business do?</h2>
              <p className="text-gray-400">Pick the closest match — we&apos;ll customize your agent</p>
              {error && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {industryTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`relative group rounded-2xl p-5 text-left transition-all duration-200 border ${
                    selectedTemplate === t.id
                      ? "border-blue-500/50 bg-blue-500/[0.08] ring-1 ring-blue-500/25 shadow-lg shadow-blue-500/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <div className="font-semibold text-sm text-white mb-1">{t.name}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{t.description}</div>
                  {selectedTemplate === t.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Preview */}
            {selectedTemplate && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 mb-6 animate-[fadeInUp_0.3s_ease-out]">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Agent Preview</div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: industryTemplates.find((t) => t.id === selectedTemplate)?.suggestedColor }}
                  >
                    {businessName.trim() ? businessName.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">
                      {businessName.trim() ? `${businessName.trim()} Assistant` : `${industryTemplates.find((t) => t.id === selectedTemplate)?.name} Agent`}
                    </div>
                    <div className="text-sm text-gray-400">
                      {industryTemplates.find((t) => t.id === selectedTemplate)?.suggestedGreeting}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedTemplate || creating}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3.5 font-semibold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                Create My Agent →
              </button>
            </div>

            <button
              onClick={handleSkip}
              className="block mx-auto mt-5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip, I&apos;ll set up manually
            </button>
          </div>
        )}

        {/* Step 3: Creating */}
        {step === 2 && (
          <div className="w-full max-w-md text-center animate-[fadeInUp_0.4s_ease-out]">
            <div className="mb-8">
              {progress >= 100 ? (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-500/20 mb-6 animate-[scaleIn_0.3s_ease-out]">
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 mb-6">
                  <div className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
              <h2 className="text-3xl font-bold mb-2">
                {progress >= 100 ? "Your agent is live! 🎉" : "Creating your agent..."}
              </h2>
              <p className="text-gray-400">
                {progress >= 100
                  ? "Redirecting to your dashboard..."
                  : progress > 50
                  ? "Almost there — configuring your agent..."
                  : "Setting up your AI agent with industry best practices..."}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  progress >= 100
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-violet-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 mt-3">{Math.round(progress)}%</div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
