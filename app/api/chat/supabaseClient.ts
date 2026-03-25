/**
 * Legacy Supabase chatbot client — replaced by GPU backend.
 * All CRUD operations now go through gpu.chatbots.* from "@/lib/gpuBackend".
 *
 * This file is kept as a thin compatibility wrapper. Any code still importing
 * from here will work, but new code should import { gpu } from "@/lib/gpuBackend"
 * directly.
 */

import { gpu } from "@/lib/gpuBackend";

export interface Chatbot {
  id?: number | string;
  name: string;
  logic: string;
  instructions: string;
}

export const createChatbot = async (name: string, logic: string, instructions: string): Promise<Chatbot[]> => {
  const result = await gpu.chatbots.create({
    name,
    directive: logic,
    knowledge_base: instructions,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bot",
  });
  return [{ id: result.id, name: result.name, logic: (result as any).directive || "", instructions: (result as any).knowledge_base || "" }];
};

export const getChatbotById = async (id: number | string): Promise<Chatbot | null> => {
  try {
    const bot = await gpu.chatbots.getById(String(id));
    if (!bot) return null;
    return { id: bot.id, name: bot.name, logic: (bot as any).directive || "", instructions: (bot as any).knowledge_base || "" };
  } catch {
    return null;
  }
};

export const getChatbots = async (): Promise<Chatbot[]> => {
  const bots = await gpu.chatbots.list();
  return bots.map((b: any) => ({ id: b.id, name: b.name, logic: b.directive || "", instructions: b.knowledge_base || "" }));
};

export const updateChatbot = async (id: number | string, updates: Partial<Chatbot>): Promise<Chatbot[]> => {
  const patch: Record<string, any> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.logic !== undefined) patch.directive = updates.logic;
  if (updates.instructions !== undefined) patch.knowledge_base = updates.instructions;
  const result = await gpu.chatbots.update(String(id), patch);
  return [{ id: result.id, name: result.name, logic: (result as any).directive || "", instructions: (result as any).knowledge_base || "" }];
};

export const deleteChatbot = async (id: number | string): Promise<Chatbot[]> => {
  const bot = await gpu.chatbots.getById(String(id));
  await gpu.chatbots.hardDelete(String(id));
  if (!bot) return [];
  return [{ id: bot.id, name: bot.name, logic: (bot as any).directive || "", instructions: (bot as any).knowledge_base || "" }];
};
