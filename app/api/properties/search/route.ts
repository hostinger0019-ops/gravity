import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Sample property data extractor from pages/knowledge_chunks
export async function POST(req: Request) {
    try {
        const { query, chatbotId, limit = 10 } = await req.json();

        // For demo purposes, return sample properties
        // In production, this would search through pages/knowledge_chunks
        const sampleProperties = [
            {
                id: "prop-1",
                title: "Luxury 3BHK Apartment in Greater Kailash",
                price: "₹4.5Cr",
                priceValue: 45000000,
                beds: 3,
                baths: 2,
                sqft: 2100,
                location: "Greater Kailash, South Delhi",
                area: "South Delhi",
                images: [
                    "/placeholder-property.jpg",
                    "/placeholder-property.jpg"
                ],
                features: ["Modular Kitchen", "Club House", "Swimming Pool", "24/7 Security", "Power Backup", "Lift"],
                description: "This stunning 3BHK apartment offers modern amenities and spacious living in the heart of Greater Kailash. Perfect for families looking for a premium lifestyle."
            },
            {
                id: "prop-2",
                title: "Premium 4BHK Villa in Gurgaon",
                price: "₹8.2Cr",
                priceValue: 82000000,
                beds: 4,
                baths: 3,
                sqft: 3500,
                location: "Golf Course Road, Gurgaon",
                area: "Gurgaon",
                images: [
                    "/placeholder-property.jpg"
                ],
                features: ["Private Garden", "Servant Quarter", "Gym", "Home Theater", "Parking for 3 Cars"],
                description: "Luxurious independent villa with world-class amenities in the prime location of Golf Course Road."
            },
            {
                id: "prop-3",
                title: "Modern 2BHK in Noida",
                price: "₹1.8Cr",
                priceValue: 18000000,
                beds: 2,
                baths: 2,
                sqft: 1400,
                location: "Sector 62, Noida",
                area: "Noida",
                images: [
                    "/placeholder-property.jpg"
                ],
                features: ["Ready to Move", "Park Facing", "Vastu Compliant", "Gated Society"],
                description: "Well-designed 2BHK apartment in a prime location with excellent connectivity to Delhi and Gurgaon."
            },
            {
                id: "prop-4",
                title: "Spacious 3BHK in Dwarka",
                price: "₹2.2Cr",
                priceValue: 22000000,
                beds: 3,
                baths: 2,
                sqft: 1800,
                location: "Dwarka Sector 10, West Delhi",
                area: "West Delhi",
                images: [
                    "/placeholder-property.jpg"
                ],
                features: ["Metro Connectivity", "Shopping Complex", "Children Play Area", "Intercom Facility"],
                description: "Affordable yet spacious 3BHK with excellent metro connectivity in the heart of Dwarka."
            },
            {
                id: "prop-5",
                title: "Penthouse in Vasant Kunj",
                price: "₹12Cr",
                priceValue: 120000000,
                beds: 5,
                baths: 4,
                sqft: 4500,
                location: "Vasant Kunj, South Delhi",
                area: "South Delhi",
                images: [
                    "/placeholder-property.jpg"
                ],
                features: ["Private Terrace", "Jacuzzi", "Smart Home", "Premium Fixtures", "Elevator Access"],
                description: "Ultra-luxurious penthouse with breathtaking views and state-of-the-art amenities."
            }
        ];

        // Simple filtering based on query
        let filtered = [...sampleProperties];

        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = sampleProperties.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.location.toLowerCase().includes(lowerQuery) ||
                p.area?.toLowerCase().includes(lowerQuery) ||
                p.description.toLowerCase().includes(lowerQuery)
            );
        }

        // Limit results
        filtered = filtered.slice(0, limit);

        return NextResponse.json({
            success: true,
            properties: filtered,
            total: filtered.length
        });

    } catch (error: any) {
        console.error("Property search error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to search properties" },
            { status: 500 }
        );
    }
}

// GET endpoint for area overview
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get("type");

        if (type === "areas") {
            // Return area overview data
            const areas = [
                {
                    name: "South Delhi",
                    propertyCount: 20,
                    priceRange: { min: "₹3.5Cr", max: "₹12Cr" },
                    avgPrice: "₹6.8Cr",
                    description: "Premium residential area with excellent connectivity and infrastructure",
                    highlights: ["Metro Access", "Reputed Schools", "Shopping Hubs"],
                    trending: true
                },
                {
                    name: "Gurgaon",
                    propertyCount: 23,
                    priceRange: { min: "₹2.8Cr", max: "₹9Cr" },
                    avgPrice: "₹5.2Cr",
                    description: "Modern corporate hub with world-class amenities",
                    highlights: ["IT Parks", "Malls", "Golf Courses"]
                },
                {
                    name: "Noida",
                    propertyCount: 18,
                    priceRange: { min: "₹1.5Cr", max: "₹4Cr" },
                    avgPrice: "₹2.5Cr",
                    description: "Affordable housing with great growth potential",
                    highlights: ["Metro Connectivity", "IT Corridor", "Upcoming Airport"]
                },
                {
                    name: "West Delhi",
                    propertyCount: 12,
                    priceRange: { min: "₹1.8Cr", max: "₹3.5Cr" },
                    avgPrice: "₹2.4Cr",
                    description: "Well-established residential locality with good connectivity",
                    highlights: ["Metro Lines", "Educational Institutions"]
                }
            ];

            return NextResponse.json({ success: true, areas });
        }

        return NextResponse.json(
            { success: false, error: "Invalid type parameter" },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("Property GET error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch data" },
            { status: 500 }
        );
    }
}
