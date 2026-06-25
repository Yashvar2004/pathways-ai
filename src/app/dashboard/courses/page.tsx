import { getAuth } from "@/lib/auth-helpers";
import { getUserEnrollments } from "@/features/courses/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

export const metadata = {
  title: "My Courses",
};

export default async function CoursesPage() {
  const { userId } = await getAuth();
  if (!userId) return null;

  const enrollments = await getUserEnrollments(userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-1">
          Continue where you left off
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              You haven&apos;t enrolled in any courses yet. Search for a topic to find courses.
            </p>
            <LinkButton className="mt-4" href="/dashboard/search">Browse Courses</LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(enrollments as any[]).filter((e: any) => e.course).map((enrollment: any) => (
            <Card key={enrollment.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{enrollment.course!.title}</h2>
                      {enrollment.course!.isPathwaysGenerated && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                          Pathways AI
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                  </div>
                  <LinkButton className="shrink-0" href={`/dashboard/courses/${enrollment.courseId}`}>
                      {enrollment.progress === 0 ? "Start" : "Continue"}
                    </LinkButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
