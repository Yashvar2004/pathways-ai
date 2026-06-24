import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { topics, courses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topicId } = await params;
  

  // Verify topic belongs to user
  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.id, Number(topicId)), eq(topics.userId, userId)))
    .limit(1);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const topicCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.topicId, Number(topicId)));

  return NextResponse.json({
    courses: (topicCourses as any[]).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      provider: c.provider,
      url: c.url,
      isFree: c.isFree,
      isPathwaysGenerated: c.isPathwaysGenerated,
    })),
  });
}
