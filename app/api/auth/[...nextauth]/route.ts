import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user }) {
            // Sync user to GPU backend on every login
            try {
                const res = await fetch(`${GPU_URL}/api/users/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: user.email,
                        name: user.name,
                        avatar_url: user.image,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    // Attach GPU user_id to the user object
                    (user as any).gpu_id = data.id;
                    (user as any).credit_balance = data.credit_balance;
                    (user as any).plan = data.plan;
                }
            } catch (e) {
                console.error("[NextAuth] GPU sync failed:", e);
                // Still allow login even if GPU sync fails
            }
            return true;
        },
        async jwt({ token, user }) {
            // On first sign-in, persist GPU data in the JWT
            if (user) {
                token.gpu_id = (user as any).gpu_id;
                token.credit_balance = (user as any).credit_balance;
                token.plan = (user as any).plan;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose GPU data in the client session
            if (session.user) {
                (session.user as any).gpu_id = token.gpu_id;
                (session.user as any).credit_balance = token.credit_balance;
                (session.user as any).plan = token.plan;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
