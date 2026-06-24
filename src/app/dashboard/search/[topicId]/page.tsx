import { getTopicDetail } from "@/features/search/actions";
import { notFound } from "next/navigation";
import { TopicDetailClient } from "./topic-detail-client";
import { ResearchSection } from "./research-section";
import { generateCoursesForTopic } from "@/features/courses/generate";

export const metadata = {
  title: "Search Results",
};

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  console.log("[Page] Loading topic:", topicId);
  let data = await getTopicDetail(Number(topicId));
  console.log("[Page] Data:", data ? `found (resources: ${data.resources.length}, courses: ${data.courses.length})` : "NOT FOUND");
  if (!data) notFound();

  // Generate courses if none exist
  if (data.courses.length === 0) {
    await generateCoursesForTopic(data.id, data.query);
    // Re-fetch data with new courses
    const refreshed = await getTopicDetail(Number(topicId));
    if (refreshed) data = refreshed;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ResearchSection topicId={data.id} query={data.query} />
      <TopicDetailClient
        topicId={data.id}
        query={data.query}
        resources={(data.resources as any[]).map((r: any) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          description: r.description,
          type: r.type as "article" | "video" | "documentation" | "tool",
          isFree: r.isFree,
        }))}
        courses={(data.courses as any[]).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          provider: c.provider,
          url: c.url,
          isFree: c.isFree,
          isPathwaysGenerated: c.isPathwaysGenerated,
        }))}
      />
    </div>
  );
}
