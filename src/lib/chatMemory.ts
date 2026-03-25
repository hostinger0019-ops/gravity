/**
 * Chat Memory — GPU Backend version.
 * Replaces OpenAI embeddings + Supabase RPC with GPU backend endpoints.
 * The GPU backend handles embedding generation and FAISS vector search internally.
 */

import { gpu } from "@/lib/gpuBackend";

export type MemoryRow = {
  id: string;
  role: "user" | "assistant" | "system";
  message: string;
  similarity?: number;
  created_at?: string;
};

/**
 * Embed text using the GPU backend embedder.
 * This replaces the OpenAI text-embedding-3-small call.
 * Note: Most callers won't need this directly since save/search handle embedding internally.
 */
export async function embedText(text: string): Promise<number[]> {
  return gpu.embed.text(text);
}

/**
 * Save a message to chat memory.
 * The GPU backend generates the embedding on-GPU and stores it in FAISS automatically.
 * No OpenAI API call needed.
 */
export async function saveMemory(params: {
  role: "user" | "assistant" | "system";
  message: string;
  userId: string;
  chatbotId: string;
  conversationId?: string | null;
  openai?: any; // Kept for API compat but ignored — GPU backend handles embedding
}) {
  const { role, message, userId, chatbotId, conversationId } = params;

  await gpu.memory.save({
    chatbot_id: chatbotId,
    user_id: userId,
    conversation_id: conversationId || undefined,
    role,
    message,
  });
}

/**
 * Find the most similar past messages using GPU-accelerated vector search.
 * Replaces the Supabase match_chat_memory RPC + OpenAI embedding call.
 */
export async function topSimilar(params: {
  query: string;
  userId: string;
  chatbotId: string;
  conversationId?: string | null;
  limit?: number;
  openai?: any; // Kept for API compat but ignored — GPU backend handles embedding
}): Promise<MemoryRow[]> {
  const { query, userId, chatbotId, conversationId, limit = 5 } = params;

  const results = await gpu.memory.search({
    query,
    user_id: userId,
    chatbot_id: chatbotId,
    conversation_id: conversationId || undefined,
    limit,
  });

  return results as MemoryRow[];
}
