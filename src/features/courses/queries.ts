import { db } from "@/lib/db";
import { enrollments, modules, moduleProgress, courses } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getUserEnrollments(userId: string) {
  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  return Promise.all(
    (userEnrollments as any[]).map(async (e: any) => {
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, e.courseId))
        .limit(1);
      return { ...e, course };
    })
  );
}

export async function getEnrollment(userId: string, courseId: number) {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    )
    .limit(1);

  if (!enrollment) return null;

  const courseModules = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.sortOrder));

  const progress = await db
    .select()
    .from(moduleProgress)
    .where(eq(moduleProgress.enrollmentId, enrollment.id));

  return {
    ...enrollment,
    course: { modules: courseModules },
    moduleProgress: progress,
  };
}

export async function getModuleById(moduleId: number) {
  const [mod] = await db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!mod) return null;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, mod.courseId))
    .limit(1);

  return { ...mod, course };
}
