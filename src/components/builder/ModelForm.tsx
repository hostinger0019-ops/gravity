"use client";

import { useFormContext } from "react-hook-form";
import type { ModelValues } from "./schemas";

// Model configuration with details
const models = [
  // OpenAI Models
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective for most tasks",
    speed: "Fast",
    quality: "Good",
    cost: "$",
    recommended: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "High quality responses with vision capabilities",
    speed: "Medium",
    quality: "Excellent",
    cost: "$$",
    recommended: false,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "Latest GPT-4 with 128K context and vision",
    speed: "Medium",
    quality: "Excellent",
    cost: "$$",
    recommended: false,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    description: "Latest mini model with improved reasoning",
    speed: "Fast",
    quality: "Very Good",
    cost: "$",
    recommended: false,
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    description: "Most powerful model for complex reasoning",
    speed: "Slow",
    quality: "Best",
    cost: "$$$",
    recommended: false,
  },

  // DeepSeek Models
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    description: "Open-source alternative with great performance",
    speed: "Fast",
    quality: "Good",
    cost: "$",
    recommended: false,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "DeepSeek",
    description: "Advanced reasoning with chain-of-thought",
    speed: "Medium",
    quality: "Very Good",
    cost: "$$",
    recommended: false,
  },

  // Qwen Models (Local GPU or Cloud)
  {
    id: "qwen2.5:72b",
    name: "Qwen 2.5 72B",
    provider: "Qwen",
    description: "Top-tier open model, multilingual, beats GPT-3.5",
    speed: "Medium",
    quality: "Excellent",
    cost: "Free (GPU)",
    recommended: false,
  },
  {
    id: "qwen2.5:14b",
    name: "Qwen 2.5 14B",
    provider: "Qwen",
    description: "Best GPU balance - excellent quality, very fast (recommended for GPU)",
    speed: "Fast",
    quality: "Very Good",
    cost: "Free (GPU)",
    recommended: false,
  },
  {
    id: "qwen2.5:7b",
    name: "Qwen 2.5 7B",
    provider: "Qwen",
    description: "Ultra-fast, great for voice chat and real-time responses",
    speed: "Very Fast",
    quality: "Good",
    cost: "Free (GPU)",
    recommended: false,
  },

  // Groq Models (Ultra-fast Cloud API)
  {
    id: "groq/llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "Groq",
    description: "Blazing fast inference (~100ms), excellent quality",
    speed: "Ultra Fast",
    quality: "Excellent",
    cost: "$",
    recommended: false,
  },
  {
    id: "groq/llama-3.1-8b-instant",
    name: "Llama 3.1 8B (Groq)",
    provider: "Groq",
    description: "Instant responses, perfect for voice chat",
    speed: "Ultra Fast",
    quality: "Good",
    cost: "$",
    recommended: false,
  },
  {
    id: "groq/mixtral-8x7b-32768",
    name: "Mixtral 8x7B (Groq)",
    provider: "Groq",
    description: "Fast MoE model with 32K context",
    speed: "Ultra Fast",
    quality: "Very Good",
    cost: "$",
    recommended: false,
  },
];

// Icons
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export function ModelForm() {
  const form = useFormContext<ModelValues>();
  const selectedModel = form.watch("model") || "gpt-4o-mini";
  const temperature = Number(form.watch("temperature")) || 0.7;

  // Temperature label based on value
  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.3) return { label: "Precise", desc: "More focused and deterministic responses", color: "text-blue-400" };
    if (temp <= 0.7) return { label: "Balanced", desc: "Good mix of creativity and accuracy", color: "text-green-400" };
    return { label: "Creative", desc: "More varied and imaginative responses", color: "text-orange-400" };
  };

  const tempInfo = getTemperatureLabel(temperature);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon />
          <h2 className="text-lg font-semibold text-gray-900">AI Model Configuration</h2>
        </div>
        <p className="text-sm text-gray-500">Choose the AI model and adjust settings for your chatbot's responses.</p>
      </div>

      {/* Model Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Select Model</h3>

        <div className="grid gap-3">
          {models.map((model) => (
            <label
              key={model.id}
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModel === model.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <input
                type="radio"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={(e) => form.setValue("model", e.target.value as any, { shouldDirty: true })}
                className="sr-only"
              />

              {/* Selection indicator */}
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${selectedModel === model.id
                ? "border-indigo-500 bg-indigo-500"
                : "border-gray-300"
                }`}>
                {selectedModel === model.id && (
                  <CheckIcon />
                )}
              </div>

              {/* Model info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{model.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{model.provider}</span>
                  {model.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{model.description}</p>

                {/* Model stats */}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <BoltIcon />
                    <span className="text-gray-600">Speed:</span>
                    <span className={`font-medium ${model.speed === "Fast" ? "text-green-600" :
                      model.speed === "Medium" ? "text-yellow-600" : "text-red-600"
                      }`}>{model.speed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-medium text-gray-900">{model.quality}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium text-indigo-600">{model.cost}</span>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Temperature Setting */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Response Style</h3>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium text-gray-900">Temperature</div>
              <p className="text-sm text-gray-500 mt-0.5">Controls randomness in responses</p>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${tempInfo.color}`}>{temperature.toFixed(2)}</div>
              <div className={`text-sm font-medium ${tempInfo.color}`}>{tempInfo.label}</div>
            </div>
          </div>

          {/* Custom slider */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={temperature}
              onChange={(e) => form.setValue("temperature", parseFloat(e.target.value), { shouldDirty: true })}
              className="w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  #60a5fa 0%, 
                  #34d399 50%, 
                  #fb923c 100%)`
              }}
            />
            {/* Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Precise (0.0)</span>
              <span>Balanced (0.5)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{tempInfo.desc}</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <h4 className="font-medium text-indigo-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• For customer support, use lower temperature (0.2-0.4) for consistent answers</li>
          <li>• For creative tasks, use higher temperature (0.7-0.9) for varied responses</li>
          <li>• GPT-4o Mini is recommended for most use cases - fast and affordable</li>
        </ul>
      </div>
    </div>
  );
}
