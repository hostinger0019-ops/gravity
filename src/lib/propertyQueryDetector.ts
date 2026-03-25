// Property query detection and response formatter for real estate chatbots

export interface PropertyQuery {
    isPropertyQuery: boolean;
    type: "area_overview" | "property_list" | "property_detail" | null;
    intent: string; // what user wants
    location?: string; // extracted location
    filters?: {
        beds?: number;
        maxPrice?: number;
        minPrice?: number;
    };
}

/**
 * Detects if a user message is asking about properties
 */
export function detectPropertyQuery(userMessage: string): PropertyQuery {
    const msg = userMessage.toLowerCase();

    // Area overview queries
    const areaKeywords = ["which areas", "locations", "where can i find", "available areas", "which location"];
    if (areaKeywords.some(kw => msg.includes(kw))) {
        return {
            isPropertyQuery: true,
            type: "area_overview",
            intent: "show_areas",
        };
    }

    // Property list queries
    const listKeywords = ["show me properties", "show properties", "list properties", "available properties", "properties in"];
    if (listKeywords.some(kw => msg.includes(kw))) {
        // Extract location if present
        const locationMatch = msg.match(/(?:in|at|near)\s+([a-z\s]+?)(?:\s|$|,|\?)/i);
        const location = locationMatch?.[1]?.trim();

        return {
            isPropertyQuery: true,
            type: "property_list",
            intent: "show_properties",
            location,
        };
    }

    // Property detail queries
    const detailKeywords = ["tell me more about", "details about", "more info", "property details"];
    if (detailKeywords.some(kw => msg.includes(kw))) {
        return {
            isPropertyQuery: true,
            type: "property_detail",
            intent: "show_property_details",
        };
    }

    return {
        isPropertyQuery: false,
        type: null,
        intent: "general_chat",
    };
}

/**
 * Formats response with property metadata
 */
export async function buildPropertyResponse(
    query: PropertyQuery,
    textReply: string,
    apiUrl: string = "/api/properties/search"
): Promise<{
    reply: string;
    metadata?: {
        type: "property_list" | "area_overview" | "property_detail";
        data: any;
    };
}> {
    if (!query.isPropertyQuery || !query.type) {
        return { reply: textReply };
    }

    try {
        if (query.type === "area_overview") {
            // Fetch areas
            const res = await fetch(`${apiUrl}?type=areas`, { method: "GET" });
            const data = await res.json();

            if (data.success && data.areas) {
                return {
                    reply: textReply,
                    metadata: {
                        type: "area_overview",
                        data: { areas: data.areas },
                    },
                };
            }
        } else if (query.type === "property_list") {
            // Fetch properties
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query.location || "",
                    limit: 5,
                }),
            });
            const data = await res.json();

            if (data.success && data.properties) {
                return {
                    reply: textReply,
                    metadata: {
                        type: "property_list",
                        data: { properties: data.properties },
                    },
                };
            }
        }
    } catch (error) {
        console.error("Property API error:", error);
    }

    // Fallback to text only
    return { reply: textReply };
}
