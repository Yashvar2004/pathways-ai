import { getAuth } from "@/lib/auth-helpers";
import { getCourseWithModules } from "@/features/courses/actions";
import { getEnrollment } from "@/features/courses/queries";
import { ModuleList } from "@/components/courses/module-list";
import { ProgressTracker } from "@/components/courses/progress-tracker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, GraduationCap, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { enrollCourse } from "@/features/courses/actions";
import { revalidatePath } from "next/cache";
import { LinkButton } from "@/components/ui/link-button";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId } = await getAuth();
  if (!userId) return null;

  const course = await getCourseWithModules(Number(courseId));
  if (!course) notFound();

  let enrollment = await getEnrollment(userId, Number(courseId));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {course.isPathwaysGenerated && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Pathways AI
            </Badge>
          )}
          {course.provider && (
            <Badge variant="outline">{course.provider}</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground mt-2">{course.description}</p>
        )}
      </div>

      {enrollment && (
        <ProgressTracker
          completed={(enrollment.moduleProgress as any[]).filter((mp: any) => mp.completed).length}
          total={course.modules.length}
        />
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Course Modules</h2>
        <ModuleList
          modules={(course.modules as any[]).map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            content: m.content,
            videoUrl: m.videoUrl,
            videoDuration: m.videoDuration,
            sortOrder: m.sortOrder,
          }))}
          courseId={course.id}
          completedModuleIds={
            (enrollment?.moduleProgress as any[])
              ?.filter((mp: any) => mp.completed)
              .map((mp: any) => mp.moduleId) || []
          }
        />
      </div>

      {!enrollment && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Enroll in this course to start learning</p>
            <form
              action={async () => {
                "use server";
                await enrollCourse(Number(courseId));
                revalidatePath(`/dashboard/courses/${courseId}`);
              }}
            >
              <Button type="submit" size="lg">
                <GraduationCap className="mr-2 h-5 w-5" />
                Enroll for Free
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {enrollment && enrollment.progress === 100 && course.assessments?.[0] && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Assessment Ready
            </CardTitle>
            <CardDescription>
              Take the assessment to earn your certification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href={`/dashboard/courses/${courseId}/assessment`}>
                Start Assessment
              </LinkButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
