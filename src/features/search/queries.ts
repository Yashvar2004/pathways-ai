import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getRecentSearches(userId: string, limit = 5) {
  return db
    .select()
    .from(topics)
    .where(eq(topics.userId, userId))
    .orderBy(desc(topics.createdAt))
    .limit(limit);
}
