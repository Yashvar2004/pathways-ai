"use server";

import { getAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  enrollments,
  moduleProgress,
  modules as modulesTable,
  courses,
  assessments,
  questions,
  certifications,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function enrollCourse(courseId: number) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const [existing] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId, courseId })
    .returning();

  revalidatePath("/dashboard/courses");
  return enrollment;
}

export async function markModuleComplete(
  enrollmentId: number,
  moduleId: number
) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const [existing] = await db
    .select()
    .from(moduleProgress)
    .where(
      and(
        eq(moduleProgress.enrollmentId, enrollmentId),
        eq(moduleProgress.moduleId, moduleId)
      )
    )
    .limit(1);

  if (existing) {
    await db.update(moduleProgress)
      .set({ completed: true, completedAt: new Date() })
      .where(eq(moduleProgress.id, existing.id));
  } else {
    await db.insert(moduleProgress)
      .values({
        enrollmentId,
        moduleId,
        completed: true,
        completedAt: new Date(),
      });
  }

  // Recalculate progress
  const [enrollmentData] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (enrollmentData) {
    const courseModules = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.courseId, enrollmentData.courseId));

    const completedModules = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.enrollmentId, enrollmentId),
          eq(moduleProgress.completed, true)
        )
      );

    const totalModules = courseModules.length;
    const completedCount = completedModules.length;
    const progress =
      totalModules > 0
        ? Math.round((completedCount / totalModules) * 100)
        : 0;

    await db.update(enrollments)
      .set({
        progress,
        completedAt: progress === 100 ? new Date() : null,
      })
      .where(eq(enrollments.id, enrollmentId));
  }

  revalidatePath("/dashboard/courses");
}

export async function getCourseWithModules(courseId: number) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) return null;

  const courseModules = await db
    .select()
    .from(modulesTable)
    .where(eq(modulesTable.courseId, courseId))
    .orderBy(asc(modulesTable.sortOrder));

  const courseAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.courseId, courseId));

  const assessmentQuestions = courseAssessments.length > 0
    ? await db
        .select()
        .from(questions)
        .where(eq(questions.assessmentId, courseAssessments[0].id))
    : [];

  const [courseCertification] = await db
    .select()
    .from(certifications)
    .where(eq(certifications.courseId, courseId))
    .limit(1);

  return {
    ...course,
    modules: courseModules,
    assessments: (courseAssessments as any[]).map((a: any) => ({
      ...a,
      questions: assessmentQuestions,
    })),
    certification: courseCertification || null,
  };
}
