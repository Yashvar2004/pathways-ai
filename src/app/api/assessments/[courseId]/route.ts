import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { assessments, questions, certifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { userId } = await getAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.courseId, Number(courseId)))
    .limit(1);

  if (!assessment) {
    return NextResponse.json(
      { error: "Assessment not found" },
      { status: 404 }
    );
  }

  // Get questions
  const assessmentQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assessment.id));

  // Find associated certification
  const [certification] = await db
    .select()
    .from(certifications)
    .where(eq(certifications.courseId, Number(courseId)))
    .limit(1);

  // Strip correct answers from questions
  const safeQuestions = (assessmentQuestions as any[]).map((q: any) => ({
    id: q.id,
    questionText: q.questionText,
    options: typeof q.options === "string" ? JSON.parse(q.options as string) : q.options,
    sortOrder: q.sortOrder,
  }));

  return NextResponse.json({
    id: assessment.id,
    title: assessment.title,
    passingScore: assessment.passingScore,
    maxAttempts: assessment.maxAttempts,
    questions: safeQuestions,
    certification: certification
      ? { id: certification.id, title: certification.title }
      : null,
  });
}
