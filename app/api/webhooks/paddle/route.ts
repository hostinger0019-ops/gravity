import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const GPU_BACKEND_URL = process.env.GPU_BACKEND_URL || "http://69.19.137.175:8000";
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || "";

/**
 * Verify Paddle webhook signature (Paddle Billing v2)
 * Header format: ts=<timestamp>;h1=<hash>
 */
function verifyPaddleSignature(rawBody: string, signature: string): boolean {
  if (!PADDLE_WEBHOOK_SECRET) {
    console.warn("[Paddle Webhook] No PADDLE_WEBHOOK_SECRET set — skipping verification");
    return true;
  }

  try {
    const parts: Record<string, string> = {};
    signature.split(";").forEach((part) => {
      const [key, val] = part.split("=");
      if (key && val) parts[key] = val;
    });

    const ts = parts["ts"];
    const h1 = parts["h1"];
    if (!ts || !h1) return false;

    const signedPayload = `${ts}:${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", PADDLE_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(h1, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (err) {
    console.error("[Paddle Webhook] Signature verification error:", err);
    return false;
  }
}

/**
 * Find user by email via GPU backend
 */
async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${GPU_BACKEND_URL}/api/users/by-email?email=${encodeURIComponent(email)}`,
      { headers: { "X-API-Key": "test-key-1" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id || data?.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Assign plan to user via GPU backend
 */
async function assignPlan(userId: string, planId: string): Promise<boolean> {
  try {
    const res = await fetch(`${GPU_BACKEND_URL}/api/user-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "test-key-1",
      },
      body: JSON.stringify({ user_id: userId, plan_id: planId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";

    // Verify webhook signature
    if (PADDLE_WEBHOOK_SECRET && !verifyPaddleSignature(rawBody, signature)) {
      console.error("[Paddle Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;

    console.log(`[Paddle Webhook] Received: ${eventType}`);

    // Handle transaction completed
    if (eventType === "transaction.completed") {
      const data = event.data;

      // Get customer email
      const customerEmail =
        data?.custom_data?.user_email ||
        data?.customer?.email ||
        data?.checkout?.customer?.email;

      // Get plan ID from custom_data (set during transaction creation)
      const planId = data?.custom_data?.plan_id || "ltd_starter";

      if (!customerEmail) {
        console.error("[Paddle Webhook] No customer email found");
        return NextResponse.json({ error: "No customer email" }, { status: 400 });
      }

      console.log(`[Paddle Webhook] Payment from: ${customerEmail}, Plan: ${planId}`);

      // Find user by email
      const userId = await findUserByEmail(customerEmail);
      if (!userId) {
        console.error(`[Paddle Webhook] User not found: ${customerEmail}`);
        return NextResponse.json({
          received: true,
          warning: "User not found — needs manual plan assignment",
          email: customerEmail,
          plan: planId,
        });
      }

      // Assign the plan
      const success = await assignPlan(userId, planId);
      if (success) {
        console.log(`[Paddle Webhook] ✅ Plan ${planId} assigned to user ${userId} (${customerEmail})`);
      } else {
        console.error(`[Paddle Webhook] ❌ Failed to assign plan ${planId} to user ${userId}`);
      }

      return NextResponse.json({
        received: true,
        event: eventType,
        email: customerEmail,
        plan: planId,
        userId,
        success,
      });
    }

    // Handle subscription events
    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      console.log(`[Paddle Webhook] Subscription event: ${eventType}`, event.data?.id);
      return NextResponse.json({ received: true, event: eventType });
    }

    // Accept all other events
    return NextResponse.json({ received: true, event: eventType });
  } catch (err) {
    console.error("[Paddle Webhook] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
