import { NextRequest, NextResponse } from "next/server";
import { getAuth, getCurrentUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_req: NextRequest) {
  const { userId } = await getAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getCurrentUser();
  const email = user?.email || "";

  let stripeCustomerId: string;
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing?.stripeCustomerId) {
    stripeCustomerId = existing.stripeCustomerId;
  } else {
    const customer = await getStripe().customers.create({ email });
    stripeCustomerId = customer.id;
  }

  const checkout = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [
      { price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { userId },
  });

  return NextResponse.json({ url: checkout.url });
}
