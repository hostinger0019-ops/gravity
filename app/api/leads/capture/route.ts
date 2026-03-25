import { NextRequest, NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export async function POST(req: NextRequest) {
    try {
        const {
            chatbotId,
            conversationId,
            email,
            name,
            phone,
            company,
            customFields,
            trigger_type
        } = await req.json();

        if (!chatbotId || !email) {
            return NextResponse.json({ error: "Chatbot ID and email required" }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        const userAgent = req.headers.get("user-agent") || undefined;
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
        const referrer = req.headers.get("referer") || undefined;

        // Check if lead already exists
        let isNewLead = true;
        try {
            const existing = await gpu.leads.list(chatbotId);
            if (Array.isArray(existing)) {
                isNewLead = !existing.some((l: any) => l.email === email.toLowerCase().trim());
            }
        } catch { }

        // Upsert lead via GPU backend
        const lead = await gpu.leads.create({
            chatbot_id: chatbotId,
            conversation_id: conversationId || null,
            email: email.toLowerCase().trim(),
            name: name?.trim() || null,
            phone: phone?.trim() || null,
            custom_fields: {
                company: company?.trim() || null,
                trigger_type: trigger_type || "manual",
                ...customFields,
            },
            user_agent: userAgent,
            ip_address: ip,
            referrer: referrer,
            source: "chat",
            status: "new",
        });

        // Notification for new leads
        if (isNewLead) {
            try {
                await notifyBusinessOwner(chatbotId, lead);
            } catch (notifyError) {
                console.error("Failed to notify owner:", notifyError);
            }
        }

        return NextResponse.json({
            success: true,
            leadId: lead.id,
            isNew: isNewLead,
        });
    } catch (error: any) {
        console.error("Lead capture error:", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}

async function notifyBusinessOwner(chatbotId: string, lead: any) {
    try {
        const chatbot = await gpu.chatbots.getById(chatbotId);
        if (!chatbot) return;

        // Log notification (email sending via Resend is TODO)
        console.log(`📧 New lead: ${lead.email} from ${chatbot.name}`);
        console.log(`   Name: ${lead.name || "N/A"}`);
        console.log(`   Phone: ${lead.phone || "N/A"}`);
    } catch { }
}
