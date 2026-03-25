/**
 * Intent Extractor for E-commerce Chatbot
 * =========================================
 * Regex-based keyword extraction — zero latency, zero cost.
 * Converts natural language into structured query parameters.
 * 
 * Examples:
 *   "show dresses under $50"      → { maxPrice: 50, category: "dress" }
 *   "best rated shoes"            → { category: "shoes", sort: "rating" }
 *   "gift for friend"             → { intent: "recommendation", sort: "rating" }
 *   "what's in stock?"            → { inStock: true }
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface ProductQueryParams {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    brand?: string;
    inStock?: boolean;
    sort?: "price_asc" | "price_desc" | "rating";
    limit?: number;
    query?: string;
}

export interface ExtractedIntent {
    /** Whether structured product data should be queried */
    needsProductSearch: boolean;
    /** SQL-compatible product filters */
    productParams: ProductQueryParams;
    /** Whether this is a recommendation/suggestion request */
    isRecommendation: boolean;
    /** Original query (always do knowledge search too) */
    originalQuery: string;
}

// ─── Price extraction ───────────────────────────────────────────────

const PRICE_PATTERNS = [
    // "under $50", "below $100", "less than $200", "within $80"
    /(?:under|below|less than|at most|max|within|upto|up to|no more than)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,
    // "$50 or less", "$100 max"
    /\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:or less|or below|max|maximum)/i,
    // "above $50", "over $100", "more than $200", "starting from $80"
    /(?:above|over|more than|at least|min|minimum|starting from|from)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,
    // "between $20 and $80", "$50 to $100", "$50-$100"
    /(?:between\s*)?\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:to|and|-|–)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,
];

function extractPrice(text: string): { minPrice?: number; maxPrice?: number } {
    const lower = text.toLowerCase();

    // "between X and Y" or "X to Y"
    const rangeMatch = lower.match(PRICE_PATTERNS[3]);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
        const a = parseFloat(rangeMatch[1]);
        const b = parseFloat(rangeMatch[2]);
        if (!isNaN(a) && !isNaN(b)) {
            return { minPrice: Math.min(a, b), maxPrice: Math.max(a, b) };
        }
    }

    // "under/below X"
    const underMatch = lower.match(PRICE_PATTERNS[0]);
    if (underMatch && underMatch[1]) {
        const v = parseFloat(underMatch[1]);
        if (!isNaN(v)) return { maxPrice: v };
    }

    // "$X or less"
    const orLessMatch = lower.match(PRICE_PATTERNS[1]);
    if (orLessMatch && orLessMatch[1]) {
        const v = parseFloat(orLessMatch[1]);
        if (!isNaN(v)) return { maxPrice: v };
    }

    // "above/over X"
    const overMatch = lower.match(PRICE_PATTERNS[2]);
    if (overMatch && overMatch[1]) {
        const v = parseFloat(overMatch[1]);
        if (!isNaN(v)) return { minPrice: v };
    }

    return {};
}

// ─── Category extraction ────────────────────────────────────────────

const CATEGORY_PATTERNS = [
    // "show me dresses", "find shoes", "looking for jackets"
    /(?:show|find|search|looking for|browse|display|list|get|want|need)\s+(?:me\s+)?(?:some\s+)?(?:all\s+)?(\w+)/i,
    // "dress for friend", "shoes under $50"
    /^(\w+)\s+(?:for|under|below|above|over|between)/i,
];

// Common e-commerce categories to match against
const KNOWN_CATEGORIES = [
    "dress", "dresses", "shirt", "shirts", "shoe", "shoes", "sneaker", "sneakers",
    "jacket", "jackets", "pant", "pants", "jeans", "top", "tops", "bag", "bags",
    "watch", "watches", "jewelry", "ring", "rings", "necklace", "bracelet",
    "hat", "hats", "sock", "socks", "boot", "boots", "sandal", "sandals",
    "coat", "coats", "sweater", "sweaters", "hoodie", "hoodies",
    "electronics", "phone", "laptop", "tablet", "headphone", "headphones",
    "furniture", "chair", "table", "sofa", "bed", "desk",
    "toy", "toys", "game", "games", "book", "books",
    "cosmetic", "cosmetics", "makeup", "skincare", "perfume",
    "food", "snack", "snacks", "drink", "drinks", "grocery",
];

function extractCategory(text: string): string | undefined {
    const lower = text.toLowerCase();

    // Check if any known category word appears in the text
    for (const cat of KNOWN_CATEGORIES) {
        const regex = new RegExp(`\\b${cat}\\b`, "i");
        if (regex.test(lower)) {
            // Return singular form
            return cat.endsWith("es") && KNOWN_CATEGORIES.includes(cat.slice(0, -2))
                ? cat.slice(0, -2)
                : cat.endsWith("s") && KNOWN_CATEGORIES.includes(cat.slice(0, -1))
                    ? cat.slice(0, -1)
                    : cat;
        }
    }

    return undefined;
}

// ─── Brand extraction ───────────────────────────────────────────────

function extractBrand(text: string): string | undefined {
    const brandMatch = text.match(/\b(?:by|from|brand)\s+(\w+)/i);
    if (brandMatch) return brandMatch[1];
    return undefined;
}

// ─── Sort extraction ────────────────────────────────────────────────

function extractSort(text: string): "price_asc" | "price_desc" | "rating" | undefined {
    const lower = text.toLowerCase();
    if (/cheapest|lowest price|budget|affordable|cheap/i.test(lower)) return "price_asc";
    if (/most expensive|highest price|premium|luxury/i.test(lower)) return "price_desc";
    if (/best rated|top rated|highest rated|popular|best|recommended/i.test(lower)) return "rating";
    return undefined;
}

// ─── Stock extraction ───────────────────────────────────────────────

function extractStock(text: string): boolean | undefined {
    const lower = text.toLowerCase();
    if (/in stock|available|in-stock/i.test(lower)) return true;
    return undefined;
}

// ─── Recommendation detection ───────────────────────────────────────

function isRecommendation(text: string): boolean {
    return /recommend|suggest|which one|help me choose|what should|confused|gift|best for|good for|suitable|perfect for|ideal for/i.test(text);
}

// ─── Product query detection ────────────────────────────────────────

function isProductQuery(text: string): boolean {
    return /\$\s*\d|price|under|below|above|over|cheapest|expensive|buy|purchase|order|shop|product|item|stock|available|show me|find me|looking for|browse|category|brand/i.test(text);
}

// ─── Main extractor ─────────────────────────────────────────────────

export function extractIntent(message: string): ExtractedIntent {
    const text = message.trim();

    const priceParams = extractPrice(text);
    const category = extractCategory(text);
    const brand = extractBrand(text);
    const sort = extractSort(text);
    const inStock = extractStock(text);
    const recommendation = isRecommendation(text);
    const productQuery = isProductQuery(text);

    const hasStructuredParams = !!(
        priceParams.minPrice !== undefined ||
        priceParams.maxPrice !== undefined ||
        category ||
        brand ||
        inStock ||
        sort
    );

    const needsProductSearch = hasStructuredParams || productQuery || recommendation;

    const productParams: ProductQueryParams = {};
    if (priceParams.minPrice !== undefined) productParams.minPrice = priceParams.minPrice;
    if (priceParams.maxPrice !== undefined) productParams.maxPrice = priceParams.maxPrice;
    if (category) productParams.category = category;
    if (brand) productParams.query = brand; // brand goes into text search
    if (inStock) productParams.inStock = inStock;
    if (sort === "price_asc" || sort === "price_desc") productParams.sort = sort;
    if (recommendation && !sort) productParams.sort = "rating"; // recommend = sort by rating
    productParams.limit = 10;

    return {
        needsProductSearch,
        productParams,
        isRecommendation: recommendation,
        originalQuery: text,
    };
}

// ─── Format products for LLM context ────────────────────────────────

export function formatProductsForLLM(products: any[]): string {
    if (!products.length) return "";

    const lines = products.map((p: any, i: number) => {
        const parts = [`${i + 1}. ${p.name}`];
        if (p.price) parts.push(`$${p.price}`);
        if (p.original_price && p.original_price !== p.price) parts.push(`(was $${p.original_price})`);
        if (p.category) parts.push(`[${p.category}]`);
        if (p.brand) parts.push(`by ${p.brand}`);
        if (p.rating) parts.push(`⭐${p.rating}`);
        if (p.stock_status === "out_of_stock") parts.push("❌ Out of Stock");
        if (p.stock_status === "in_stock") parts.push("✅ In Stock");
        if (p.description) parts.push(`— ${p.description.slice(0, 100)}`);
        if (p.image_url) parts.push(`[Image: ${p.image_url}]`);
        if (p.url) parts.push(`[Link: ${p.url}]`);
        return parts.join(" | ");
    });

    return `EXACT PRODUCTS FROM DATABASE (${products.length} results):\n${lines.join("\n")}`;
}
