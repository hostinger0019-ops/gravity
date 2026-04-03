/**
 * POST /api/auth/verify-otp
 * Verifies the OTP code and creates/syncs the user.
 */
import { NextRequest, NextResponse } from "next/server";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";
const GPU_API_KEY = process.env.GPU_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    // Verify OTP via GPU backend
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (GPU_API_KEY) headers["X-API-Key"] = GPU_API_KEY;

    const verifyRes = await fetch(`${GPU_URL}/api/otp/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, code }),
    });

    const data = await verifyRes.json();

    if (!verifyRes.ok || !data.valid) {
      return NextResponse.json(
        { error: data.error || "Invalid or expired code" },
        { status: 401 }
      );
    }

    // Sync user to GPU backend (same as Google login flow)
    const syncRes = await fetch(`${GPU_URL}/api/users/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        name: email.split("@")[0],
        avatar_url: null,
      }),
    });

    let userData = null;
    if (syncRes.ok) {
      userData = await syncRes.json();
    }

    return NextResponse.json({
      success: true,
      user: {
        email,
        name: email.split("@")[0],
        gpu_id: userData?.id || null,
        credit_balance: userData?.credit_balance || 0,
        plan: userData?.plan || "free",
      },
    });
  } catch (err: any) {
    console.error("[verify-otp] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
