import { NextResponse, type NextRequest } from "next/server";

// Instagram OAuth - Start the login flow
// This redirects user to Facebook Login to grant Instagram permissions
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const chatbotId = searchParams.get("chatbotId");

    if (!chatbotId) {
        return NextResponse.json({ error: "chatbotId required" }, { status: 400 });
    }

    const appId = process.env.META_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

    if (!appId || !redirectUri) {
        return NextResponse.json({ error: "Meta App not configured" }, { status: 500 });
    }

    // Required permissions for Instagram DM automation
    const scopes = [
        "instagram_basic",
        "instagram_manage_messages",
        "pages_show_list",
        "pages_messaging",
        "pages_read_engagement",
    ].join(",");

    // State parameter to pass chatbotId through OAuth flow
    const state = Buffer.from(JSON.stringify({ chatbotId })).toString("base64");

    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(authUrl.toString());
}
