import { NextRequest, NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { config, userId } = body;

        if (!config) {
            return NextResponse.json({ error: "Config required" }, { status: 400 });
        }

        // Owner ID — use provided userId or fallback to dev dummy
        const ownerId = userId || "00000000-0000-0000-0000-000000000000";
        if (!userId) {
            console.log("Using fallback owner_id for development");
        }

        // Generate a unique slug
        const baseSlug = config.slug || config.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bot';
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        // Create the chatbot with AI-generated config via GPU backend
        const chatbotData = {
            owner_id: ownerId,
            name: config.name || "AI Generated Bot",
            slug: uniqueSlug,
            greeting: config.greeting || "Hello! How can I help you?",
            directive: config.directive || "",
            starter_questions: config.starterQuestions || [],
            brand_color: config.brandColor || "#6366F1",
            theme_template: config.theme || "modern",
            bubble_style: "rounded",
            typing_indicator: true,
            knowledge_base: config.initialKnowledge || "",
            is_public: true,
            model: "gpt-4o-mini",
            temperature: 0.7,
        };

        console.log("Creating chatbot with data:", chatbotData);

        const chatbot = await gpu.chatbots.create(chatbotData);

        console.log("Chatbot created:", chatbot);

        // If website URL provided, trigger scraping
        if (config.websiteToScrape) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4010';
                await fetch(`${appUrl}/api/knowledge/scrape`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: ownerId,
                        chatbotId: chatbot.id,
                        url: config.websiteToScrape,
                        depth: 1,
                        maxPages: 10,
                        ingest: true,
                    }),
                });
            } catch (scrapeError) {
                console.error("Scrape error (non-fatal):", scrapeError);
            }
        }

        return NextResponse.json({
            success: true,
            chatbot,
            message: config.websiteToScrape
                ? "Chatbot created! Website is being imported in the background."
                : "Chatbot created successfully!",
        });
    } catch (error: any) {
        console.error("Create from AI error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create chatbot" },
            { status: 500 }
        );
    }
}
