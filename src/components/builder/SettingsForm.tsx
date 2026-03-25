"use client";

import { useFormContext } from "react-hook-form";
import type { SettingsValues } from "./schemas";
import { useEffect, useRef, useState } from "react";
import { isSlugAvailable, slugify } from "@/data/chatbots";
import { useRouter } from "next/navigation";

// Icons
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const CheckCircle = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircle = () => (
  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function SettingsForm({ botId }: { botId?: string }) {
  const form = useFormContext<SettingsValues>();
  const id = botId;
  const [name, slug] = form.watch(["name", "slug"]);

  useEffect(() => {
    const derived = slugify(name || "");
    if (!slug || slug === derived) {
      form.setValue("slug", derived, { shouldDirty: true });
    }
  }, [name]);

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<any>(null);
  useEffect(() => {
    const s = form.getValues("slug");
    if (!s) { setSlugAvailable(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const ok = await isSlugAvailable(s, id);
        setSlugAvailable(ok);
        if (!ok) {
          form.setError('slug' as any, { type: 'manual', message: 'Slug is taken' } as any);
        } else {
          form.clearErrors('slug' as any);
        }
      } catch {
        setSlugAvailable(null);
      }
    }, 400);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [form.watch("slug"), id]);

  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon />
        <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
      </div>

      {/* Bot Info Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{name || "Untitled"}</div>
            <div className="text-xs text-gray-500">ID: {id || 'Draft'}</div>
          </div>
        </div>
        <button
          onClick={() => id && router.push(`/admin/chatbots/${id}/conversations`)}
          disabled={!id}
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${id ? 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          View History
        </button>
      </div>

      {/* Compact 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...form.register("name")}
            placeholder="My Chatbot"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...form.register("tagline")}
            placeholder="Ask your AI..."
          />
        </div>
      </div>

      {/* Slug - full width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">/chat/</span>
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...form.register("slug")}
            placeholder="my-chatbot"
          />
          {slug && slugAvailable !== null && (slugAvailable ? <CheckCircle /> : <XCircle />)}
        </div>
        {slug && slugAvailable === false && (
          <span className="text-xs text-red-500 mt-1">This slug is taken</span>
        )}
      </div>

      {/* Public toggle - compact row */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
        <div>
          <div className="font-medium text-gray-900 text-sm">Public Visibility</div>
          <p className="text-xs text-gray-500">Anyone with the link can access</p>
        </div>
        <label className="cursor-pointer">
          <input type="checkbox" {...form.register("is_public")} className="sr-only" />
          <div className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${form.watch("is_public") ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.watch("is_public") ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </label>
      </div>
    </div>
  );
}
