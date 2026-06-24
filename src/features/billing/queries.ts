import { db } from "@/lib/db";
import { subscriptions, userUsage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FREE_SEARCH_LIMIT, FREE_CERTIFICATION_LIMIT } from "@/lib/constants";

export async function checkSearchQuota(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub?.status === "active") {
    return { allowed: true, remaining: Infinity };
  }

  const [usage] = await db
    .select()
    .from(userUsage)
    .where(eq(userUsage.userId, userId))
    .limit(1);

  if (
    !usage ||
    usage.periodEnd < new Date()
  ) {
    return { allowed: true, remaining: FREE_SEARCH_LIMIT };
  }

  const remaining = FREE_SEARCH_LIMIT - usage.searchCount;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
  };
}

export async function incrementSearchCount(userId: string): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [existing] = await db
    .select()
    .from(userUsage)
    .where(eq(userUsage.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(userUsage)
      .set({
        searchCount: existing.searchCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(userUsage.userId, userId));
  } else {
    await db.insert(userUsage)
      .values({
        userId,
        searchCount: 1,
        certificationCount: 0,
        periodStart: now,
        periodEnd,
      });
  }
}

export async function checkCertificationQuota(
  userId: string
): Promise<boolean> {
  const [usage] = await db
    .select()
    .from(userUsage)
    .where(eq(userUsage.userId, userId))
    .limit(1);

  const count = usage?.certificationCount ?? 0;

  if (count < FREE_CERTIFICATION_LIMIT) return true;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return sub?.status === "active";
}

export async function incrementCertificationCount(
  userId: string
): Promise<void> {
  const [existing] = await db
    .select()
    .from(userUsage)
    .where(eq(userUsage.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(userUsage)
      .set({
        certificationCount: existing.certificationCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(userUsage.userId, userId));
  } else {
    await db.insert(userUsage)
      .values({
        userId,
        searchCount: 0,
        certificationCount: 1,
        periodStart: new Date(),
        periodEnd: new Date(),
      });
  }
}

export async function getUserUsage(userId: string) {
  const [usage] = await db
    .select()
    .from(userUsage)
    .where(eq(userUsage.userId, userId))
    .limit(1);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const isSubscribed = sub?.status === "active";
  const searchCount = usage?.searchCount ?? 0;
  const certificationCount = usage?.certificationCount ?? 0;

  return {
    searchCount,
    searchLimit: isSubscribed ? Infinity : FREE_SEARCH_LIMIT,
    searchesRemaining: isSubscribed
      ? Infinity
      : Math.max(0, FREE_SEARCH_LIMIT - searchCount),
    certificationCount,
    certificationLimit: isSubscribed ? Infinity : FREE_CERTIFICATION_LIMIT,
    certificationsRemaining: isSubscribed
      ? Infinity
      : Math.max(0, FREE_CERTIFICATION_LIMIT - certificationCount),
    isSubscribed,
  };
}
