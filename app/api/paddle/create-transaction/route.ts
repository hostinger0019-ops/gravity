import { NextRequest, NextResponse } from "next/server";

// Plan definitions — matches gpu_backend/routes/plans.py
const PLANS: Record<string, { name: string; priceCents: number; category: string }> = {
  starter:          { name: "Starter Plan",          priceCents: 4900,  category: "monthly" },
  pro:              { name: "Pro Plan",              priceCents: 14900, category: "monthly" },
  ltd_starter:      { name: "LTD Starter",           priceCents: 9900,  category: "lifetime" },
  ltd_reseller_pro: { name: "LTD Reseller Pro",      priceCents: 19900, category: "lifetime" },
  ltd_agency_elite: { name: "LTD Agency Elite",      priceCents: 39900, category: "lifetime" },
};

const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, email } = body;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!PADDLE_API_KEY) {
      return NextResponse.json({ error: "Paddle API key not configured" }, { status: 500 });
    }

    const plan = PLANS[planId];

    // Build the transaction request for Paddle
    const transactionPayload: any = {
      items: [
        {
          price: {
            description: plan.name,
            name: plan.name,
            unit_price: {
              amount: String(plan.priceCents),
              currency_code: "USD",
            },
            product: {
              name: plan.name,
              description: `Agent Forja ${plan.name}`,
              tax_category: "standard",
            },
            quantity: { minimum: 1, maximum: 1 },
          },
          quantity: 1,
        },
      ],
      customer: {
        email: email,
      },
      custom_data: {
        plan_id: planId,
        user_email: email,
      },
    };

    // For monthly plans, set billing cycle
    if (plan.category === "monthly") {
      transactionPayload.items[0].price.billing_cycle = {
        interval: "month",
        frequency: 1,
      };
    }

    console.log(`[Paddle] Creating transaction: ${planId} ($${plan.priceCents / 100}) for ${email}`);

    // Call Paddle API to create transaction
    const paddleRes = await fetch("https://api.paddle.com/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionPayload),
    });

    const paddleData = await paddleRes.json();

    if (!paddleRes.ok) {
      console.error("[Paddle] Transaction creation failed:", JSON.stringify(paddleData));
      return NextResponse.json(
        { error: "Failed to create transaction", details: paddleData },
        { status: paddleRes.status }
      );
    }

    const transactionId = paddleData.data?.id;
    console.log(`[Paddle] Transaction created: ${transactionId}`);

    return NextResponse.json({
      transactionId,
      planId,
      amount: plan.priceCents / 100,
    });
  } catch (err) {
    console.error("[Paddle] Error creating transaction:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
