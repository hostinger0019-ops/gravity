import { gpu } from "@/lib/gpuBackend";
import type { ChatbotRecord } from "@/data/types";

// Single source of truth for public-bot lookup.
// DEV (NEXT_PUBLIC_DEV_NO_AUTH=true): ignore is_public/is_deleted filters.
// PROD: the GPU backend returns the bot and the caller checks is_public.
export async function getBotForPublic(slug: string) {
  const dev = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

  try {
    const bot = await gpu.chatbots.getBySlug(slug);
    if (!bot) return null;

    // In production, only return public, non-deleted bots
    if (!dev) {
      if (bot.is_deleted || !bot.is_public) return null;
    }

    return bot as ChatbotRecord;
  } catch (e) {
    console.warn("getBotForPublic error:", e);
    return null;
  }
}

// Back-compat for API route already using this name
export async function getPublicBotBySlug(slug: string): Promise<ChatbotRecord | null> {
  return (await getBotForPublic(slug)) as ChatbotRecord | null;
}
