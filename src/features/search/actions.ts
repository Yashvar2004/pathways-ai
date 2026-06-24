"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { topics, resources, courses } from "@/lib/db/schema";
import { checkSearchQuota, incrementSearchCount } from "@/features/billing/queries";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncUser } from "@/features/auth/actions";

export async function searchTopic(query: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // Ensure user exists in our DB
  await syncUser();

  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) throw new Error("Search query required");

  const { allowed, remaining } = await checkSearchQuota(userId);
  if (!allowed) {
    return { error: "LIMIT_REACHED", remaining: 0 } as const;
  }

  // Insert topic
  const [topic] = await db
    .insert(topics)
    .values({ userId, query: trimmedQuery })
    .returning();

  await incrementSearchCount(userId);
  revalidatePath("/dashboard/search");

  return {
    topicId: topic.id,
    query: trimmedQuery,
    remaining,
  };
}

export async function getTopicDetail(topicId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // Use simple selects instead of relational query
  const [topic] = await db
    .select()
    .from(topics)
    .where(eq(topics.id, topicId))
    .limit(1);

  if (!topic || topic.userId !== userId) return null;

  const topicResources = await db
    .select()
    .from(resources)
    .where(eq(resources.topicId, topicId));

  const topicCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.topicId, topicId));

  return {
    id: topic.id,
    userId: topic.userId,
    query: topic.query,
    resources: (topicResources as any[]).map((r: any) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      description: r.description,
      type: r.type,
      isFree: r.isFree,
    })),
    courses: (topicCourses as any[]).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      provider: c.provider,
      url: c.url,
      isFree: c.isFree,
      isPathwaysGenerated: c.isPathwaysGenerated,
    })),
  };
}
