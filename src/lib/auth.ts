import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";
const GPU_API_KEY = process.env.GPU_API_KEY || "";

const gpuHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(GPU_API_KEY ? { "X-API-Key": GPU_API_KEY } : {}),
});

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Email OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                otp: { label: "OTP", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.otp) return null;

                try {
                    const verifyRes = await fetch(`${GPU_URL}/api/otp/verify`, {
                        method: "POST",
                        headers: gpuHeaders(),
                        body: JSON.stringify({ email: credentials.email, code: credentials.otp }),
                    });
                    const data = await verifyRes.json();
                    if (!data.valid) return null;

                    const syncRes = await fetch(`${GPU_URL}/api/users/sync`, {
                        method: "POST",
                        headers: gpuHeaders(),
                        body: JSON.stringify({
                            email: credentials.email,
                            name: credentials.email.split("@")[0],
                            avatar_url: null,
                        }),
                    });
                    const userData = syncRes.ok ? await syncRes.json() : null;

                    return {
                        id: userData?.id || credentials.email,
                        email: credentials.email,
                        name: credentials.email.split("@")[0],
                        image: null,
                        gpu_id: userData?.id,
                        credit_balance: userData?.credit_balance,
                        plan: userData?.plan,
                    } as any;
                } catch (e) {
                    console.error("[OTP Auth] Error:", e);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user }) {
            if (!(user as any).gpu_id) {
                try {
                    const res = await fetch(`${GPU_URL}/api/users/sync`, {
                        method: "POST",
                        headers: gpuHeaders(),
                        body: JSON.stringify({
                            email: user.email,
                            name: user.name,
                            avatar_url: user.image,
                        }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        (user as any).gpu_id = data.id;
                        (user as any).credit_balance = data.credit_balance;
                        (user as any).plan = data.plan;
                    }
                } catch (e) {
                    console.error("[NextAuth] GPU sync failed:", e);
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.gpu_id = (user as any).gpu_id;
                token.credit_balance = (user as any).credit_balance;
                token.plan = (user as any).plan;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).gpu_id = token.gpu_id;
                (session.user as any).credit_balance = token.credit_balance;
                (session.user as any).plan = token.plan;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

