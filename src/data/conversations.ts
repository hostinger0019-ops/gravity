"use client";

import { gpu } from "@/lib/gpuBackend";

export async function getConversationsByBot(
  botId: string,
  opts?: { page?: number; pageSize?: number; q?: string }
) {
  return gpu.conversations.listByBot(botId, {
    page: opts?.page,
    pageSize: opts?.pageSize,
    q: opts?.q,
  });
}

export async function getConversationMessages(cid: string) {
  return gpu.messages.list(cid);
}

export async function createConversation(botId: string, title?: string) {
  return gpu.conversations.create(botId, title);
}

export async function renameConversation(cid: string, title: string) {
  return gpu.conversations.rename(cid, title);
}

export async function deleteConversation(cid: string) {
  await gpu.conversations.delete(cid);
}

export async function exportConversationAsJson(cid: string) {
  return gpu.conversations.exportAsJson(cid);
}

export async function getAllConversations(opts?: { page?: number; pageSize?: number; q?: string; botId?: string }) {
  return gpu.conversations.listAll({
    page: opts?.page,
    pageSize: opts?.pageSize,
    q: opts?.q,
    botId: opts?.botId,
  });
}
