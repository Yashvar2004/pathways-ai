import { getAuth, getCurrentUser } from "@/lib/auth-helpers";
import { getCertificationById } from "@/features/certifications/queries";
import { CertificateDisplay } from "@/components/certifications/certificate-display";
import { notFound } from "next/navigation";

export default async function CertificationDetailPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const { userId } = await getAuth();
  if (!userId) return null;

  const user = await getCurrentUser();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.email?.split("@")[0] || "Learner";

  const certification = await getCertificationById(Number(certId));
  if (!certification) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <CertificateDisplay
        userName={userName}
        courseTitle={certification.course?.title || certification.title}
        certificationTitle={certification.title}
        issuedAt={new Date()}
      />
    </div>
  );
}
