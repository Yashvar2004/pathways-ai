import { auth, currentUser } from "@clerk/nextjs/server";
import { getCertificationById } from "@/features/certifications/queries";
import { CertificateDisplay } from "@/components/certifications/certificate-display";
import { notFound } from "next/navigation";

export default async function CertificationDetailPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const userName = user?.fullName || user?.firstName || "Learner";

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
