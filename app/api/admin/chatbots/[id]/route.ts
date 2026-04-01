import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gpu } from "@/lib/gpuBackend";

// GET chatbot by ID (owner must match)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const data = await gpu.chatbots.getById(id);
        if (!data) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

        // Ownership check for admin routes
        const session = await getServerSession(authOptions);
        const gpuId = (session?.user as any)?.gpu_id;
        if (gpuId && data.owner_id && data.owner_id !== gpuId && data.owner_id !== "00000000-0000-0000-0000-000000000000") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }
}

// PATCH - Update chatbot (only owner can update)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Verify ownership
        const session = await getServerSession(authOptions);
        const gpuId = (session?.user as any)?.gpu_id;
        if (gpuId) {
            const bot = await gpu.chatbots.getById(id);
            if (bot && bot.owner_id !== gpuId && bot.owner_id !== "00000000-0000-0000-0000-000000000000") {
                return NextResponse.json({ error: "Not authorized" }, { status: 403 });
            }
        }

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
        if (updates.placeholder !== undefined) dbUpdates.placeholder_message = updates.placeholder;

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

// DELETE - Soft delete chatbot (only owner can delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Verify ownership
        const session = await getServerSession(authOptions);
        const gpuId = (session?.user as any)?.gpu_id;
        if (gpuId) {
            const bot = await gpu.chatbots.getById(id);
            if (bot && bot.owner_id !== gpuId && bot.owner_id !== "00000000-0000-0000-0000-000000000000") {
                return NextResponse.json({ error: "Not authorized" }, { status: 403 });
            }
        }

        await gpu.chatbots.softDelete(id);
        return NextResponse.json({ message: "Chatbot deleted" });
    } catch (error) {
        console.error("DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete chatbot" }, { status: 500 });
    }
}
