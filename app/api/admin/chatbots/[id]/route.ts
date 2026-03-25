import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET chatbot by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const data = await gpu.chatbots.getById(id);
        if (!data) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }
}

// PATCH - Update chatbot
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const updates = await req.json();

        // Map frontend field names to database column names
        const dbUpdates: Record<string, any> = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.greeting !== undefined) dbUpdates.greeting = updates.greeting;
        if (updates.directive !== undefined) dbUpdates.directive = updates.directive;
        if (updates.starterQuestions !== undefined) dbUpdates.starter_questions = updates.starterQuestions;
        if (updates.brandColor !== undefined) dbUpdates.brand_color = updates.brandColor;
        if (updates.theme !== undefined) dbUpdates.theme_template = updates.theme;
        if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
        if (updates.placeholder !== undefined) dbUpdates.placeholder = updates.placeholder;

        if (Object.keys(dbUpdates).length === 0) {
            return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
        }

        const data = await gpu.chatbots.update(id, dbUpdates);
        return NextResponse.json({ chatbot: data, message: "Chatbot updated successfully" });
    } catch (error) {
        console.error("PATCH error:", error);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
