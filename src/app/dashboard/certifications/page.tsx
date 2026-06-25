import { getAuth } from "@/lib/auth-helpers";
import { getUserCertifications } from "@/features/certifications/queries";
import { CertificationCard } from "@/components/certifications/certification-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

export const metadata = {
  title: "Certifications",
};

export default async function CertificationsPage() {
  const { userId } = await getAuth();
  if (!userId) return null;

  const certifications = await getUserCertifications(userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
        <p className="text-muted-foreground mt-1">
          Your earned certifications and credentials
        </p>
      </div>

      {certifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No certifications yet. Complete a course and pass the assessment to earn one.
            </p>
            <LinkButton className="mt-4" href="/dashboard/courses">View Courses</LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(certifications as any[]).filter((uc: any) => uc.certification).map((uc: any) => (
            <CertificationCard
              key={uc.id}
              id={uc.certificationId}
              title={uc.certification!.title}
              description={uc.certification!.description}
              courseTitle={uc.certification!.course?.title}
              issuedAt={uc.issuedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
