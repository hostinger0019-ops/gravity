"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { LogicValues } from "./schemas";

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
      <div className="flex-1 pr-4">
        <div className="font-medium text-gray-900">{label}</div>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
      </button>
    </div>
  );
}

export function LogicForm() {
  const form = useFormContext<LogicValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "rules.kv" as any });

  const autoSuggest = form.watch("rules.settings.auto_suggest") ?? true;
  const allowImageText = form.watch("rules.settings.allow_image_plus_text") ?? true;
  const waitForReply = form.watch("rules.settings.wait_for_reply") ?? false;
  const fallbackMode = form.watch("rules.settings.knowledge_fallback_mode") ?? "ai";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Chatbot Behavior</h2>
        <p className="text-sm text-gray-500 mt-1">Configure how your chatbot responds and interacts with users.</p>
      </div>

      {/* Response Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Response Settings</h3>

        <ToggleSwitch
          checked={autoSuggest}
          onChange={(val) => form.setValue("rules.settings.auto_suggest", val, { shouldDirty: true })}
          label="Auto-suggested replies"
          description="Show quick reply suggestions to help users ask questions"
        />

        <ToggleSwitch
          checked={allowImageText}
          onChange={(val) => form.setValue("rules.settings.allow_image_plus_text", val, { shouldDirty: true })}
          label="Allow images with text"
          description="Let users send images along with their messages"
        />

        <ToggleSwitch
          checked={waitForReply}
          onChange={(val) => form.setValue("rules.settings.wait_for_reply", val, { shouldDirty: true })}
          label="Wait for response"
          description="Prevent users from sending another message until the chatbot replies"
        />
      </div>

      {/* Fallback Behavior */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">When No Knowledge is Found</h3>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                <input
                  type="radio"
                  name="fallback_mode"
                  checked={fallbackMode === "ai"}
                  onChange={() => form.setValue("rules.settings.knowledge_fallback_mode", "ai", { shouldDirty: true })}
                  className="w-4 h-4 text-indigo-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Generate AI response</div>
                  <div className="text-sm text-gray-500">Let the AI create a response without knowledge sources</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                <input
                  type="radio"
                  name="fallback_mode"
                  checked={fallbackMode === "message"}
                  onChange={() => form.setValue("rules.settings.knowledge_fallback_mode", "message", { shouldDirty: true })}
                  className="w-4 h-4 text-indigo-600 mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Show custom message</div>
                  <div className="text-sm text-gray-500">Display a specific message you define</div>
                </div>
              </label>
            </div>

            {fallbackMode === "message" && (
              <div className="mt-4 pl-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your custom message</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  rows={3}
                  placeholder="e.g., I don't have information about that topic. Please contact support for help."
                  {...form.register("rules.settings.knowledge_fallback_message" as const)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Custom Rules</h3>
            <p className="text-sm text-gray-500 mt-1">Add key-value pairs for additional chatbot behavior</p>
          </div>
          <button
            type="button"
            onClick={() => append({ key: "", value: "" } as any)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Rule
          </button>
        </div>

        {fields.length > 0 ? (
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="flex gap-3 items-start p-4 bg-white border border-gray-200 rounded-xl">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Key</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="e.g., response_style"
                      {...form.register(`rules.kv.${i}.key` as const)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="e.g., friendly"
                      {...form.register(`rules.kv.${i}.value` as const)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove rule"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-sm">No custom rules yet</p>
            <p className="text-gray-400 text-xs mt-1">Click "Add Rule" to create custom behavior rules</p>
          </div>
        )}
      </div>
    </div>
  );
}
