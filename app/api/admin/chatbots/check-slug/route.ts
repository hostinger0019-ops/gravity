import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET /api/admin/chatbots/check-slug?slug=xxx&exclude_id=yyy
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const excludeId = searchParams.get("exclude_id") || undefined;

        if (!slug) {
            return NextResponse.json({ available: true, slug: "" });
        }

        const available = await gpu.chatbots.isSlugAvailable(slug, excludeId);
        return NextResponse.json({ available, slug });
    } catch (err: any) {
        console.error("Check slug error:", err);
        return NextResponse.json({ available: true, slug: "" });
    }
}
