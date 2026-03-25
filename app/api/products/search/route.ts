/**
 * Product Search API
 * Enables chatbot to search products by query, price, category
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export const runtime = "nodejs";

type SearchParams = {
    chatbotId: string;
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    inStock?: boolean;
    limit?: number;
};

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SearchParams;
        const { chatbotId, query, minPrice, maxPrice, category, inStock, limit = 10 } = body;

        if (!chatbotId) {
            return NextResponse.json({ error: "Missing chatbotId" }, { status: 400 });
        }

        const products = await gpu.products.search(chatbotId, {
            query,
            min_price: minPrice,
            max_price: maxPrice,
            category,
            in_stock: inStock,
            limit,
        });

        const formattedProducts = (products || []).map((p: any, idx: number) => ({
            position: idx + 1,
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            category: p.category,
            description: p.description?.slice(0, 150) + (p.description?.length > 150 ? "..." : ""),
            imageUrl: p.image_url,
            stockStatus: p.stock_status,
            rating: p.rating,
            reviewCount: p.review_count,
            url: p.url,
        }));

        return NextResponse.json({
            ok: true,
            count: formattedProducts.length,
            products: formattedProducts,
        });
    } catch (err: any) {
        console.error("PRODUCT SEARCH ERROR", err);
        return NextResponse.json({ error: err?.message || "Search failed" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const chatbotId = searchParams.get("chatbotId");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");
    const limit = searchParams.get("limit") || "20";

    if (!chatbotId) {
        return NextResponse.json({ error: "Missing chatbotId" }, { status: 400 });
    }

    try {
        const products = await gpu.products.search(chatbotId, {
            max_price: maxPrice ? parseFloat(maxPrice) : undefined,
            category: category || undefined,
            limit: parseInt(limit),
        });

        return NextResponse.json({ products: products || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Search failed" }, { status: 500 });
    }
}
