import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// OAuth callback - Facebook redirects here after user grants permissions
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
        console.error("[Instagram OAuth] User denied:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots?error=oauth_denied`);
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots?error=missing_code`);
    }

    // Decode state to get chatbotId
    let chatbotId: string;
    try {
        const state = JSON.parse(Buffer.from(stateParam, "base64").toString());
        chatbotId = state.chatbotId;
    } catch {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots?error=invalid_state`);
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

    try {
        // Step 1: Exchange code for short-lived access token
        const tokenRes = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `client_secret=${appSecret}&code=${code}`
        );
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("[Instagram OAuth] Token error:", tokenData.error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots/${chatbotId}/instagram?error=token_exchange_failed`);
        }

        const shortLivedToken = tokenData.access_token;

        // Step 2: Exchange for long-lived token (60 days)
        const longTokenRes = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            `grant_type=fb_exchange_token&client_id=${appId}&` +
            `client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
        );
        const longTokenData = await longTokenRes.json();
        const longLivedToken = longTokenData.access_token || shortLivedToken;
        const expiresIn = longTokenData.expires_in || 5184000; // Default 60 days

        // Step 3: Get user's Facebook Pages
        const pagesRes = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
        );
        const pagesData = await pagesRes.json();

        if (!pagesData.data || pagesData.data.length === 0) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots/${chatbotId}/instagram?error=no_pages`);
        }

        // Get the first page (user can have multiple - for MVP, we use first)
        const page = pagesData.data[0];
        const pageId = page.id;
        const pageAccessToken = page.access_token;

        // Step 4: Get Instagram Business Account linked to this page
        const igRes = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
        );
        const igData = await igRes.json();

        if (!igData.instagram_business_account) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots/${chatbotId}/instagram?error=no_instagram`);
        }

        const igAccountId = igData.instagram_business_account.id;

        // Step 5: Get Instagram username
        const igProfileRes = await fetch(
            `https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${pageAccessToken}`
        );
        const igProfile = await igProfileRes.json();
        const igUsername = igProfile.username || null;

        // Step 6: Save connection to GPU backend
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        await gpu.instagram.connect({
            chatbot_id: chatbotId,
            instagram_account_id: igAccountId,
            instagram_username: igUsername,
            facebook_page_id: pageId,
            page_access_token: pageAccessToken,
            token_expires_at: tokenExpiresAt,
            is_active: true,
        });

        console.log("[Instagram OAuth] Connected successfully:", { chatbotId, igAccountId, igUsername });

        // Redirect back to Instagram settings with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots/${chatbotId}/instagram?success=connected`);
    } catch (err) {
        console.error("[Instagram OAuth] Error:", err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/chatbots/${chatbotId}/instagram?error=unknown`);
    }
}
