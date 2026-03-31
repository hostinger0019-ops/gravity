import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { gpu } from "@/lib/gpuBackend";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { config, userId } = body;

        if (!config) {
            return NextResponse.json({ error: "Config required" }, { status: 400 });
        }

        // Get the real user from NextAuth session (server-side, tamper-proof)
        const session = await getServerSession();
        const sessionGpuId = (session?.user as any)?.gpu_id;

        // Priority: server-side session gpu_id > client-sent userId > dev fallback
        const devNoAuth = process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";
        const ownerId = sessionGpuId || userId || (devNoAuth ? "00000000-0000-0000-0000-000000000000" : null);

        if (!ownerId) {
            return NextResponse.json(
                { error: "Please log in first to create a chatbot." },
                { status: 401 }
            );
        }

        console.log("Creating chatbot with ownerId:", ownerId, "source:", sessionGpuId ? "session" : "client");

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
        let scrapeJobId: string | null = null;
        if (config.websiteToScrape) {
            try {
                const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || '';
                if (GPU_URL) {
                    // Use GPU scraper directly (returns job_id for progress tracking)
                    const scrapeRes = await fetch(`${GPU_URL}/api/scrape/start`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chatbot_id: chatbot.id,
                            url: config.websiteToScrape,
                            max_pages: 5000,
                        }),
                        signal: AbortSignal.timeout(10000),
                    });
                    if (scrapeRes.ok) {
                        const scrapeData = await scrapeRes.json();
                        scrapeJobId = scrapeData.job_id || null;
                    }
                }
            } catch (scrapeError) {
                console.error("Scrape error (non-fatal):", scrapeError);
            }
        }

        return NextResponse.json({
            success: true,
            chatbot,
            job_id: scrapeJobId,
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
