import { AssessmentClient } from "./assessment-client";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <AssessmentClient courseId={courseId} />;
}
