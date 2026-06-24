import { db } from "@/lib/db";
import { certifications, userCertifications, courses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserCertifications(userId: string) {
  const userCerts = await db
    .select()
    .from(userCertifications)
    .where(eq(userCertifications.userId, userId))
    .orderBy(desc(userCertifications.issuedAt));

  return Promise.all(
    (userCerts as any[]).map(async (uc: any) => {
      const [cert] = await db
        .select()
        .from(certifications)
        .where(eq(certifications.id, uc.certificationId))
        .limit(1);

      const course = cert
        ? (await db
            .select()
            .from(courses)
            .where(eq(courses.id, cert.courseId))
            .limit(1))[0]
        : null;

      return {
        ...uc,
        certification: cert ? { ...cert, course } : null,
      };
    })
  );
}

export async function getCertificationById(certId: number) {
  const [cert] = await db
    .select()
    .from(certifications)
    .where(eq(certifications.id, certId))
    .limit(1);

  if (!cert) return null;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, cert.courseId))
    .limit(1);

  return { ...cert, course };
}
