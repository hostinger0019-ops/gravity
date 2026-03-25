import { NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;

    // Fetch all conversations for this chatbot (get enough pages)
    let allConversations: any[] = [];
    let page = 1;
    const pageSize = 100;
    while (true) {
      const batch = await gpu.conversations.listByBot(botId, { page, pageSize });
      allConversations = allConversations.concat(batch);
      if (batch.length < pageSize) break;
      page++;
      if (page > 10) break; // safety cap at 1000 conversations
    }

    // Fetch messages for each conversation (limit to recent 50 for performance)
    const recentConvos = allConversations
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 50);

    const convoDetails = await Promise.all(
      recentConvos.map(async (c) => {
        try {
          const msgs = await gpu.messages.list(c.id);
          const voiceCount = msgs.filter((m: any) => m.content?.includes("![product]") || m.role === "user" && m.content?.startsWith("🎤")).length;
          return {
            id: c.id,
            title: c.title || "Untitled",
            message_count: msgs.length,
            voice_count: voiceCount,
            text_count: msgs.length - voiceCount,
            type: voiceCount > 0 ? (voiceCount === msgs.length ? "voice" : "mixed") : "text" as "text" | "voice" | "mixed",
            created_at: c.created_at || c.updated_at,
            updated_at: c.updated_at,
            messages: msgs, // for daily chart aggregation
          };
        } catch {
          return {
            id: c.id,
            title: c.title || "Untitled",
            message_count: 0,
            voice_count: 0,
            text_count: 0,
            type: "text" as const,
            created_at: c.created_at || c.updated_at,
            updated_at: c.updated_at,
            messages: [],
          };
        }
      })
    );

    // Aggregate stats
    const totalMessages = convoDetails.reduce((sum, c) => sum + c.message_count, 0);
    const totalVoice = convoDetails.reduce((sum, c) => sum + c.voice_count, 0);
    const totalText = totalMessages - totalVoice;
    const avgPerConvo = allConversations.length > 0 ? Math.round((totalMessages / Math.min(allConversations.length, 50)) * 10) / 10 : 0;

    // Last active
    const lastActive = allConversations.length > 0
      ? allConversations.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
      : null;

    // Daily messages chart (last 30 days)
    const dailyMap: Record<string, { text: number; voice: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { text: 0, voice: 0 };
    }

    for (const c of convoDetails) {
      for (const m of c.messages) {
        const day = m.created_at?.slice(0, 10);
        if (day && dailyMap[day] !== undefined) {
          const isVoice = m.role === "user" && m.content?.startsWith("🎤");
          if (isVoice) dailyMap[day].voice++;
          else dailyMap[day].text++;
        }
      }
    }

    const dailyMessages = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      text: counts.text,
      voice: counts.voice,
    }));

    // Strip messages from response (too large)
    const conversationsForResponse = convoDetails.map(({ messages, ...rest }) => rest);

    return NextResponse.json({
      total_conversations: allConversations.length,
      total_messages: totalMessages,
      voice_messages: totalVoice,
      text_messages: totalText,
      avg_messages_per_conversation: avgPerConvo,
      last_active: lastActive,
      daily_messages: dailyMessages,
      conversations: conversationsForResponse,
    });
  } catch (e: any) {
    console.error("[Analytics API]", e);
    return NextResponse.json({ error: e.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
