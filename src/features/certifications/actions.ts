"use server";

import { getAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  assessments,
  assessmentAttempts,
  questions,
  userCertifications,
} from "@/lib/db/schema";
import {
  checkCertificationQuota,
  incrementCertificationCount,
} from "@/features/billing/queries";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitAssessment(
  assessmentId: number,
  userAnswers: number[]
) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  // Get assessment
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) throw new Error("Assessment not found");

  // Get questions
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId));

  // Check attempts
  const previousAttempts = await db
    .select()
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        eq(assessmentAttempts.assessmentId, assessmentId)
      )
    );

  if (previousAttempts.length >= assessment.maxAttempts) {
    return {
      error: "MAX_ATTEMPTS_REACHED",
      attemptsRemaining: 0,
    } as const;
  }

  // Grade answers
  const sortedQuestions = [...allQuestions].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  let correct = 0;
  for (let i = 0; i < sortedQuestions.length; i++) {
    if (userAnswers[i] === sortedQuestions[i].correctAnswer) correct++;
  }

  const score = Math.round((correct / sortedQuestions.length) * 100);
  const passed = score >= assessment.passingScore;

  const [attempt] = await db
    .insert(assessmentAttempts)
    .values({
      userId,
      assessmentId,
      score,
      passed,
      answers: JSON.stringify(userAnswers),
    })
    .returning();

  revalidatePath("/dashboard/courses");

  const attemptsRemaining =
    assessment.maxAttempts - (previousAttempts.length + 1);

  return {
    passed,
    score,
    passingScore: assessment.passingScore,
    attemptsRemaining: Math.max(0, attemptsRemaining),
    attemptId: attempt.id,
  } as const;
}

export async function claimCertification(
  assessmentAttemptId: number,
  certificationId: number
) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  // Verify attempt passed
  const [attempt] = await db
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.id, assessmentAttemptId))
    .limit(1);

  if (!attempt || !attempt.passed) {
    throw new Error("Assessment not passed");
  }

  // Check already claimed
  const [existing] = await db
    .select()
    .from(userCertifications)
    .where(
      and(
        eq(userCertifications.userId, userId),
        eq(userCertifications.certificationId, certificationId)
      )
    )
    .limit(1);

  if (existing) return existing;

  // Check quota
  const allowed = await checkCertificationQuota(userId);
  if (!allowed) {
    return { error: "UPGRADE_REQUIRED" } as const;
  }

  // Claim it
  const [cert] = await db
    .insert(userCertifications)
    .values({
      userId,
      certificationId,
      assessmentAttemptId,
    })
    .returning();

  await incrementCertificationCount(userId);
  revalidatePath("/dashboard/certifications");

  return cert;
}
