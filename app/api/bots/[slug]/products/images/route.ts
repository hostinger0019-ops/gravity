import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Fetch product images for a chatbot by product name
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const productName = req.nextUrl.searchParams.get("product");

        if (!productName) {
            return NextResponse.json({ error: "Missing product parameter" }, { status: 400 });
        }

        // Get chatbot by slug
        let bot: any;
        try {
            bot = await gpu.chatbots.getBySlug(slug);
        } catch {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }
        if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

        // Search products by name
        const searchTerm = productName.toLowerCase().trim();
        const matchedImages: string[] = [];

        try {
            const products = await gpu.products.search(bot.id, { query: searchTerm, limit: 10 });
            if (Array.isArray(products)) {
                for (const p of products) {
                    if (p.image_url) matchedImages.push(p.image_url);
                }
            }
        } catch { }

        return NextResponse.json({
            product: productName,
            images: matchedImages.slice(0, 3),
        });
    } catch (err: any) {
        console.error("Product images error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
