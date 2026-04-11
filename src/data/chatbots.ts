"use client";

import { gpu } from "@/lib/gpuBackend";
import type { ChatbotDraft, ChatbotRecord, ChatbotPatch } from "@/data/types";
import { normalizeChatbotPatch } from "@/data/normalize";

export const DUMMY_OWNER_ID = "00000000-0000-0000-0000-000000000000";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function isSlugAvailable(slug: string, excludeId?: string) {
  try {
    const params = new URLSearchParams({ slug });
    if (excludeId) params.set("exclude_id", excludeId);
    const res = await fetch(`/api/admin/chatbots/check-slug?${params.toString()}`);
    if (!res.ok) return true; // assume available on error
    const data = await res.json();
    return data.available !== false;
  } catch {
    return true; // assume available on network error
  }
}

export async function getChatbots(): Promise<ChatbotRecord[]> {
  // In GPU backend, owner filtering is optional — list all non-deleted
  return (await gpu.chatbots.list()) as ChatbotRecord[];
}

export async function getChatbotById(id: string): Promise<ChatbotRecord | null> {
  return (await gpu.chatbots.getById(id)) as ChatbotRecord | null;
}

export async function getChatbotBySlug(slug: string): Promise<ChatbotRecord | null> {
  return (await gpu.chatbots.getBySlug(slug)) as ChatbotRecord | null;
}

function randomSuffix(len = 4) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createChatbot(payload: Omit<ChatbotDraft, "slug"> & { name: string }): Promise<ChatbotRecord> {
  const base = normalizeChatbotPatch(payload);
  const desired = slugify(payload.name);
  let finalSlug = desired || `bot-${randomSuffix()}`;

  // Check slug availability client-side
  while (!(await isSlugAvailable(finalSlug))) {
    finalSlug = `${desired}-${randomSuffix()}`;
  }

  const insert = {
    owner_id: DUMMY_OWNER_ID,
    slug: finalSlug,
    name: payload.name,
    greeting: base.greeting ?? "How can I help you today?",
    directive: base.directive ?? "You are a helpful assistant. Answer clearly and concisely.",
    knowledge_base: base.knowledge_base ?? "",
    starter_questions: base.starter_questions ?? [
      "What can you do?",
      "Help me write a message",
      "Explain this concept simply",
    ],
    tagline: (payload as any).tagline && String((payload as any).tagline).trim().length > 0
      ? String((payload as any).tagline).trim()
      : "Ask me Anything…",
    rules: base.rules ?? [],
    integrations: base.integrations ?? {
      google_drive: false,
      slack: false,
      notion: false,
    },
    brand_color: base.brand_color ?? "#3B82F6",
    avatar_url: base.avatar_url ?? null,
    bubble_style: base.bubble_style ?? "rounded",
    typing_indicator: base.typing_indicator ?? true,
    model: base.model ?? "gpt-4o-mini",
    temperature: base.temperature ?? 0.6,
    is_public: base.is_public ?? true,
  };

  return (await gpu.chatbots.create(insert)) as ChatbotRecord;
}

export async function updateChatbot(id: string, patch: ChatbotPatch): Promise<ChatbotRecord> {
  const normAll = normalizeChatbotPatch(patch);

  // Slug uniqueness check
  if (typeof (normAll as any).slug === "string") {
    const current = await getChatbotById(id);
    if (current && current.slug === (normAll as any).slug) {
      delete (normAll as any).slug;
    } else {
      const ok = await isSlugAvailable((normAll as any).slug, id);
      if (!ok) throw new Error("SLUG_TAKEN");
    }
  }

  return (await gpu.chatbots.update(id, normAll)) as ChatbotRecord;
}

export async function softDeleteChatbot(id: string): Promise<void> {
  await gpu.chatbots.softDelete(id);
}
