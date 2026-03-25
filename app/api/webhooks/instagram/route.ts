import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Meta sends this to verify the webhook
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
        console.log("[Instagram Webhook] Verification successful");
        return new Response(challenge, { status: 200 });
    }

    console.log("[Instagram Webhook] Verification failed", { mode, token, verifyToken });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Meta sends incoming messages here
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("[Instagram Webhook] Received:", JSON.stringify(body, null, 2));

        // Instagram messaging webhook structure
        if (body.object !== "instagram") {
            return NextResponse.json({ received: true });
        }

        const entries = body.entry || [];
        for (const entry of entries) {
            const messaging = entry.messaging || [];
            for (const event of messaging) {
                await handleInstagramMessage(event);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Instagram Webhook] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

async function handleInstagramMessage(event: any) {
    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id; // This is the Instagram Business Account ID
    const message = event.message;

    if (!senderId || !recipientId || !message?.text) {
        console.log("[Instagram] Skipping non-text message or missing IDs");
        return;
    }

    // Find the connection by Instagram Account ID via GPU backend
    let connection: any = null;
    try {
        const connections = await gpu.instagram.connections.list();
        connection = connections.find(
            (c: any) => c.instagram_account_id === recipientId && c.is_active
        );
    } catch (err) {
        console.error("[Instagram] Failed to fetch connections:", err);
        return;
    }

    if (!connection) {
        console.log("[Instagram] No active connection found for:", recipientId);
        return;
    }

    // Get the chatbot for this connection
    let chatbot: any = null;
    try {
        chatbot = await gpu.chatbots.getById(connection.chatbot_id);
    } catch {
        console.log("[Instagram] No chatbot found for connection:", connection.id);
        return;
    }

    if (!chatbot) {
        console.log("[Instagram] No chatbot found for connection:", connection.id);
        return;
    }

    // Get or create conversation via GPU backend
    let conversation: any = null;
    try {
        const conversations = await gpu.instagram.conversations.list(connection.id);
        conversation = conversations.find((c: any) => c.ig_user_id === senderId);
    } catch { }

    if (!conversation) {
        try {
            conversation = await gpu.instagram.conversations.create({
                connection_id: connection.id,
                ig_user_id: senderId,
                message_history: [],
            });
        } catch (convErr) {
            console.error("[Instagram] Failed to create conversation:", convErr);
            return;
        }
    }

    // Store inbound message
    await gpu.instagram.messages.create({
        conversation_id: conversation.id,
        direction: "inbound",
        content: message.text,
        ig_message_id: message.mid,
    });

    // Build message history for AI context
    const messageHistory = (conversation.message_history || []) as Array<{ role: string; content: string }>;
    messageHistory.push({ role: "user", content: message.text });

    // Call our AI chat logic
    const aiReply = await generateAIReply(chatbot, messageHistory);

    // Update conversation history
    messageHistory.push({ role: "assistant", content: aiReply });
    await gpu.instagram.conversations.update(conversation.id, {
        message_history: messageHistory.slice(-20), // Keep last 20 messages
        updated_at: new Date().toISOString(),
    });

    // Store outbound message
    await gpu.instagram.messages.create({
        conversation_id: conversation.id,
        direction: "outbound",
        content: aiReply,
    });

    // Send reply via Instagram API
    await sendInstagramReply(connection.page_access_token, senderId, aiReply);
}

async function generateAIReply(
    chatbot: any,
    messages: Array<{ role: string; content: string }>
): Promise<string> {
    try {
        // Use OpenAI directly (same as chat endpoint)
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are ${chatbot.name}. ${chatbot.directive || "Be helpful and friendly."}
Answer concisely. Keep responses under 1000 characters for Instagram.`;

        const response = await openai.chat.completions.create({
            model: chatbot.model || "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            ],
            max_tokens: 500,
            temperature: chatbot.temperature || 0.7,
        });

        return response.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";
    } catch (error) {
        console.error("[Instagram AI] Error:", error);
        return "I'm having trouble processing your message. Please try again.";
    }
}

async function sendInstagramReply(accessToken: string, recipientId: string, message: string) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient: { id: recipientId },
                    message: { text: message },
                }),
            }
        );

        const result = await response.json();
        if (!response.ok) {
            console.error("[Instagram] Send failed:", result);
        } else {
            console.log("[Instagram] Reply sent successfully");
        }
    } catch (error) {
        console.error("[Instagram] Send error:", error);
    }
}
