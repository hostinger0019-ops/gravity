import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Connect a new Instagram account
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chatbotId, instagramAccountId, instagramUsername, facebookPageId, pageAccessToken } = body;

        if (!chatbotId || !instagramAccountId || !facebookPageId || !pageAccessToken) {
            return NextResponse.json(
                { error: "Missing required fields: chatbotId, instagramAccountId, facebookPageId, pageAccessToken" },
                { status: 400 }
            );
        }

        // Check if chatbot exists
        try {
            const chatbot = await gpu.chatbots.getById(chatbotId);
            if (!chatbot) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
        } catch {
            return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
        }

        const connection = await gpu.instagram.connect({
            chatbot_id: chatbotId,
            instagram_account_id: instagramAccountId,
            instagram_username: instagramUsername || null,
            facebook_page_id: facebookPageId,
            page_access_token: pageAccessToken,
            is_active: true,
        });

        return NextResponse.json({ connection, message: "Instagram connected successfully" });
    } catch (error) {
        console.error("Instagram connect error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
