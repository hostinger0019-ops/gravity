/**
 * Sitemap Discovery API
 * ======================
 * Fetches sitemap.xml from a website and returns all discoverable page URLs.
 * Falls back to HTML link extraction if no sitemap is found.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SCRAPER } from "@/scraper/config";

export const runtime = "nodejs";

type Body = { url?: string };

// Parse XML sitemap (handles both sitemap index and urlset)
function parseSitemapXml(xml: string): { urls: string[]; sitemapUrls: string[] } {
    const urls: string[] = [];
    const sitemapUrls: string[] = [];

    // Extract <sitemap><loc>...</loc></sitemap> (sitemap index)
    const sitemapLocRegex = /<sitemap[^>]*>[\s\S]*?<loc>\s*(.*?)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
    let match;
    while ((match = sitemapLocRegex.exec(xml)) !== null) {
        if (match[1]) sitemapUrls.push(match[1].trim());
    }

    // Extract <url><loc>...</loc></url> (regular sitemap)
    const urlLocRegex = /<url[^>]*>[\s\S]*?<loc>\s*(.*?)\s*<\/loc>[\s\S]*?<\/url>/gi;
    while ((match = urlLocRegex.exec(xml)) !== null) {
        if (match[1]) urls.push(match[1].trim());
    }

    return { urls, sitemapUrls };
}

// Normalize and deduplicate URLs, group by path prefix
function organizeUrls(urls: string[], baseHost: string) {
    const unique = [...new Set(urls)].filter((u) => {
        try {
            return new URL(u).hostname === baseHost;
        } catch {
            return false;
        }
    });

    // Group by first path segment
    const groups: Record<string, string[]> = {};
    for (const url of unique) {
        try {
            const parsed = new URL(url);
            const segments = parsed.pathname.split("/").filter(Boolean);
            const group = segments[0] || "(root)";
            if (!groups[group]) groups[group] = [];
            groups[group].push(url);
        } catch {
            if (!groups["other"]) groups["other"] = [];
            groups["other"].push(url);
        }
    }

    return { total: unique.length, urls: unique, groups };
}

// Fall back to HTML link extraction
async function discoverFromHtml(url: string): Promise<string[]> {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": SCRAPER.userAgent, Accept: "text/html" },
            signal: AbortSignal.timeout(10000),
            redirect: "follow",
        });
        if (!res.ok) return [];
        const html = await res.text();
        const origin = new URL(url).origin;
        const baseHost = new URL(url).hostname;

        const urls = new Set<string>();
        urls.add(url.split("#")[0].split("?")[0]); // Include the page itself

        // Match all href values (absolute, relative, protocol-relative)
        const hrefRegex = /href\s*=\s*["']([^"'#][^"']*?)["']/gi;
        let match;
        while ((match = hrefRegex.exec(html)) !== null) {
            try {
                const raw = match[1]?.trim();
                if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;

                // Resolve relative to absolute
                const full = new URL(raw, origin);
                if (full.hostname !== baseHost) continue;

                // Clean URL: remove hash and query params
                const clean = full.origin + full.pathname;
                // Skip files (images, css, js, etc.)
                if (/\.(png|jpg|jpeg|gif|svg|css|js|ico|woff|woff2|ttf|eot|pdf|zip|mp4|mp3)$/i.test(clean)) continue;

                urls.add(clean);
            } catch { }
        }

        return [...urls];
    } catch {
        return [];
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;
        const url = body.url?.trim();
        if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

        const parsed = new URL(url);
        const baseHost = parsed.hostname;
        let allUrls: string[] = [];
        let source = "none";

        // Try sitemap.xml first
        const sitemapUrls = [
            `${parsed.origin}/sitemap.xml`,
            `${parsed.origin}/sitemap_index.xml`,
            `${parsed.origin}/sitemap/sitemap.xml`,
        ];

        for (const sitemapUrl of sitemapUrls) {
            try {
                const res = await fetch(sitemapUrl, {
                    headers: { "User-Agent": SCRAPER.userAgent },
                    signal: AbortSignal.timeout(10000),
                });
                if (!res.ok) continue;
                const xml = await res.text();
                if (!xml.includes("<urlset") && !xml.includes("<sitemapindex")) continue;

                const { urls, sitemapUrls: nestedSitemaps } = parseSitemapXml(xml);
                allUrls.push(...urls);

                // Follow nested sitemaps (sitemap index), limit to first 5
                for (const nestedUrl of nestedSitemaps.slice(0, 5)) {
                    try {
                        const nestedRes = await fetch(nestedUrl, {
                            headers: { "User-Agent": SCRAPER.userAgent },
                            signal: AbortSignal.timeout(10000),
                        });
                        if (nestedRes.ok) {
                            const nestedXml = await nestedRes.text();
                            const nested = parseSitemapXml(nestedXml);
                            allUrls.push(...nested.urls);
                        }
                    } catch { }
                }

                if (allUrls.length > 0) {
                    source = "sitemap";
                    break;
                }
            } catch { }
        }

        // Fall back to HTML link discovery
        if (allUrls.length === 0) {
            allUrls = await discoverFromHtml(url);
            source = allUrls.length > 0 ? "html" : "none";
        }

        // Organize and cap at 500 URLs
        const organized = organizeUrls(allUrls.slice(0, 500), baseHost);

        return NextResponse.json({
            ok: true,
            source,
            ...organized,
        });
    } catch (err: any) {
        console.error("SITEMAP ERROR", err);
        return NextResponse.json({ error: err?.message || "Failed to discover pages" }, { status: 500 });
    }
}
