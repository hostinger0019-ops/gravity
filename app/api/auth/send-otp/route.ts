/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP, stores it in PostgreSQL, and emails it.
 */
import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/email";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";
const GPU_API_KEY = process.env.GPU_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Store OTP in GPU PostgreSQL via backend API
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (GPU_API_KEY) headers["X-API-Key"] = GPU_API_KEY;

    const storeRes = await fetch(`${GPU_URL}/api/otp/store`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, code, expires_at: expiresAt }),
    });

    if (!storeRes.ok) {
      console.error("[send-otp] Failed to store OTP:", await storeRes.text());
      return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }

    // Send email
    await sendOTP(email, code);

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (err: any) {
    console.error("[send-otp] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
