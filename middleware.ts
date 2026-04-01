/**
 * Next.js Middleware — Protect admin routes and API routes.
 * Unauthenticated users are redirected to /login.
 */
export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        // Protect all admin pages
        "/admin/:path*",
        // Protect admin API routes
        "/api/admin/:path*",
        // Protect builder session API
        "/api/builder-sessions/:path*",
        // Protect AI generator API
        "/api/ai-generator/:path*",
    ],
};
