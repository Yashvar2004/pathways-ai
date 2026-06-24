import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, stripeEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await db.query.stripeEvents.findFirst({
    where: eq(stripeEvents.stripeEventId, event.id),
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  await db.insert(stripeEvents).values({
    stripeEventId: event.id,
    type: event.type,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );
          await db
            .insert(subscriptions)
            .values({
              id: sub.id,
              userId: session.metadata?.userId || "",
              stripeCustomerId: session.customer as string,
              status: sub.status,
              priceId: sub.items.data[0].price.id,
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            })
            .onConflictDoUpdate({
              target: subscriptions.id,
              set: {
                status: sub.status,
                currentPeriodStart: new Date((sub as any).current_period_start * 1000),
                currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              },
            });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            invoice.subscription as string
          );
          await db
            .update(subscriptions)
            .set({
              status: sub.status,
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        await db
          .update(subscriptions)
          .set({
            status: sub.status,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await db
          .update(subscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
