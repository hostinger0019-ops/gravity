"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { InstructionsValues } from "./schemas";
import { suggestGreeting } from "@/lib/suggestGreeting";

// Icons
const MessageIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const SparklesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const LoaderIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

// Preset templates for system prompts
const promptTemplates = [
    {
        id: "support",
        name: "Customer Support",
        emoji: "🎧",
        prompt: `You are a helpful customer support agent. Your role is to:\n- Answer questions politely and professionally\n- Provide accurate information about products/services\n- Escalate complex issues when needed\n- Always maintain a friendly, patient tone\n\nNever provide legal, medical, or financial advice. If asked, suggest consulting a professional.`
    },
    {
        id: "sales",
        name: "Sales Assistant",
        emoji: "💼",
        prompt: `You are a friendly sales assistant. Your role is to:\n- Help customers find the right products\n- Explain features and benefits clearly\n- Answer pricing and availability questions\n- Provide helpful recommendations\n\nBe enthusiastic but not pushy. Focus on understanding customer needs.`
    },
    {
        id: "tutor",
        name: "Educational Tutor",
        emoji: "📚",
        prompt: `You are a patient educational tutor. Your approach is to:\n- Explain concepts clearly and simply\n- Use examples and analogies\n- Encourage questions and curiosity\n- Adapt to the student's level\n\nGuide students to discover answers rather than just providing them directly.`
    },
    {
        id: "custom",
        name: "Custom",
        emoji: "⚙️",
        prompt: ""
    }
];

type Tab = "greeting" | "directive" | "tips";

export function InstructionsForm() {
    const form = useFormContext<InstructionsValues>();
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("greeting");

    const greeting = form.watch("greeting") || "";
    const directive = form.watch("directive") || "";
    const gLen = greeting.length;
    const dLen = directive.length;

    const generateGreeting = async () => {
        setIsGenerating(true);
        try {
            const s = await suggestGreeting();
            form.setValue("greeting", s, { shouldDirty: true, shouldValidate: true });
        } finally {
            setIsGenerating(false);
        }
    };

    const applyTemplate = (template: typeof promptTemplates[0]) => {
        setSelectedTemplate(template.id);
        if (template.prompt) {
            form.setValue("directive", template.prompt, { shouldDirty: true, shouldValidate: true });
        }
    };

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "greeting", label: "Greeting", icon: <span>👋</span> },
        { key: "directive", label: "System Prompt", icon: <DocumentIcon /> },
        { key: "tips", label: "Tips", icon: <span>💡</span> },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <MessageIcon />
                    <h2 className="text-lg font-semibold text-gray-900">Chatbot Instructions</h2>
                </div>
                <p className="text-sm text-gray-500">Define how your chatbot greets users and behaves in conversations.</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Greeting */}
            {activeTab === "greeting" && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">👋</span>
                            <div>
                                <h3 className="font-medium text-gray-900">Greeting Message</h3>
                                <p className="text-sm text-gray-500">First message users see when opening the chat</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={generateGreeting}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition-all duration-200"
                        >
                            {isGenerating ? <LoaderIcon /> : <SparklesIcon />}
                            {isGenerating ? "Generating..." : "Generate with AI"}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                            {...form.register("greeting")}
                            placeholder="How can I help you today?"
                            aria-label="Greeting"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            {gLen}/160
                        </div>
                    </div>

                    {form.formState?.errors?.greeting?.message && (
                        <p className="text-sm text-red-500">{form.formState.errors.greeting.message as any}</p>
                    )}

                    {/* Greeting preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">
                                🤖
                            </div>
                            <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2 shadow-sm border border-gray-100 max-w-xs">
                                <p className="text-sm text-gray-700">{greeting || "How can I help you today?"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: System Prompt */}
            {activeTab === "directive" && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                    <div className="flex items-start gap-2">
                        <DocumentIcon />
                        <div>
                            <h3 className="font-medium text-gray-900">System Prompt (Directive)</h3>
                            <p className="text-sm text-gray-500">Define your chatbot's personality, role, and behavior guidelines</p>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Quick Templates:</p>
                        <div className="flex flex-wrap gap-2">
                            {promptTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => applyTemplate(template)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${selectedTemplate === template.id
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    <span>{template.emoji}</span>
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="relative">
                        <textarea
                            rows={7}
                            className="w-full resize-y border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50"
                            {...form.register("directive")}
                            placeholder={`You are a helpful assistant. Your role is to:\n- Answer questions clearly and accurately\n- Be friendly and professional\n- Provide helpful suggestions\n\nNever share personal opinions or provide harmful advice.`}
                            aria-label="Directive"
                        />
                        <div className="absolute right-3 bottom-3 text-xs text-gray-400 bg-gray-50 px-1">
                            {dLen} characters
                        </div>
                    </div>

                    {form.formState?.errors?.directive?.message && (
                        <p className="text-sm text-red-500">{form.formState.errors.directive.message as any}</p>
                    )}
                </div>
            )}

            {/* Tab: Tips */}
            {activeTab === "tips" && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                    <h4 className="font-medium text-amber-900 mb-3">💡 Writing Effective Instructions</h4>
                    <ul className="text-sm text-amber-800 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Be specific:</strong> Clearly define the chatbot's role and purpose</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Set boundaries:</strong> Specify what the chatbot should NOT do</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Define tone:</strong> Should it be formal, casual, or friendly?</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Add examples:</strong> Include sample responses for common questions</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
