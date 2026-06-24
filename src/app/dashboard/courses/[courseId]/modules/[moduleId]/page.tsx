import { auth } from "@clerk/nextjs/server";
import { getModuleById } from "@/features/courses/queries";
import { getEnrollment } from "@/features/courses/queries";
import { AIVideoPlayer } from "@/components/courses/ai-video-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { markModuleComplete } from "@/features/courses/actions";
import { generateModuleContent } from "@/features/courses/generate";
import { revalidatePath } from "next/cache";
import { LinkButton } from "@/components/ui/link-button";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const module_ = await getModuleById(Number(moduleId));
  if (!module_) notFound();

  const enrollment = await getEnrollment(userId, Number(courseId));
  if (!enrollment) redirect(`/dashboard/courses/${courseId}`);

  const moduleProgress = enrollment.moduleProgress.find(
    (mp: any) => mp.moduleId === Number(moduleId)
  );
  const isCompleted = moduleProgress?.completed;

  const allModules = enrollment.course.modules.sort(
    (a: any, b: any) => a.sortOrder - b.sortOrder
  );
  const currentIndex = allModules.findIndex((m: any) => m.id === Number(moduleId));
  const prevModule = currentIndex > 0 ? allModules[currentIndex - 1] : null;
  const nextModule =
    currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null;

  // Generate module content if not exists
  let content = module_.content;
  if (!content) {
    const courseTitle = module_.course?.title || "this course";
    const topic = courseTitle.split(" ")[0].toLowerCase();

    const generated = await generateModuleContent(
      module_.id,
      topic,
      courseTitle,
      currentIndex,
      module_.title
    );
    content = generated.content;
  }

  // Extract topic from course title
  const courseTitle = module_.course?.title || "this course";
  const topic = courseTitle.split(" ")[0].toLowerCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/dashboard/courses/${courseId}`} className="hover:text-foreground">
          {module_.course?.title || "Course"}
        </Link>
        <span>/</span>
        <span className="text-foreground">{module_.title}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{module_.title}</h1>
        {module_.description && (
          <p className="text-muted-foreground mt-1">{module_.description}</p>
        )}
      </div>

      {/* AI Video Player */}
      <AIVideoPlayer
        moduleTitle={module_.title}
        moduleContent={content || ""}
        topic={topic}
      />

      {/* Written Content */}
      {content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Written Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{
                __html: content
                  .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>')
                  .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                  .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
                  .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                  .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
                  .replace(/\n\n/g, '</p><p class="mb-3">')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          {prevModule && (
            <LinkButton variant="outline" href={`/dashboard/courses/${courseId}/modules/${prevModule.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </LinkButton>
          )}
        </div>

        <form
          action={async () => {
            "use server";
            await markModuleComplete(enrollment.id, Number(moduleId));
            revalidatePath(
              `/dashboard/courses/${courseId}/modules/${moduleId}`
            );
          }}
        >
          <Button
            type="submit"
            variant={isCompleted ? "outline" : "default"}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              <>
                <Circle className="mr-2 h-4 w-4" />
                Mark Complete
              </>
            )}
          </Button>
        </form>

        <div>
          {nextModule && (
            <LinkButton variant="outline" href={`/dashboard/courses/${courseId}/modules/${nextModule.id}`}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </LinkButton>
          )}
        </div>
      </div>

      {enrollment.progress === 100 && (
        <Card className="text-center p-4">
          <LinkButton href={`/dashboard/courses/${courseId}/assessment`}>
            Take Assessment
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
