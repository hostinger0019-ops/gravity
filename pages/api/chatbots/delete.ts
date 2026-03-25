import type { NextApiRequest, NextApiResponse } from "next";
import { gpu } from "@/lib/gpuBackend";

// Legacy Pages Router endpoint for chatbot soft-delete — migrated to GPU backend
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { id } = body || {};

    if (!id) return res.status(400).json({ error: "Missing id" });

    await gpu.chatbots.delete(id);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}
