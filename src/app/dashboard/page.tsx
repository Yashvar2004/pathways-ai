import { auth, currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentSearches } from "@/features/search/queries";
import { getUserEnrollments } from "@/features/courses/queries";
import { getUserCertifications } from "@/features/certifications/queries";
import { Search, BookOpen, Award, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { syncUser } from "@/features/auth/actions";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  // Ensure user is synced to our DB
  await syncUser();

  const user = await currentUser();
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "there";

  const [recentSearches, enrollments, certifications] = await Promise.all([
    getRecentSearches(userId),
    getUserEnrollments(userId),
    getUserCertifications(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Research tech stacks, take courses, and earn certifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentSearches.length}</p>
            <LinkButton variant="link" size="sm" className="px-0 mt-1" href="/dashboard/search">Start a new search <ArrowRight className="ml-1 h-3 w-3" /></LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enrollments.length}</p>
            <LinkButton variant="link" size="sm" className="px-0 mt-1" href="/dashboard/courses">View courses <ArrowRight className="ml-1 h-3 w-3" /></LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{certifications.length}</p>
            <LinkButton variant="link" size="sm" className="px-0 mt-1" href="/dashboard/certifications">View certifications <ArrowRight className="ml-1 h-3 w-3" /></LinkButton>
          </CardContent>
        </Card>
      </div>

      {recentSearches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Searches</h2>
          <div className="grid gap-2">
            {(recentSearches as any[]).map((topic: any) => (
              <Card key={topic.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{topic.query}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <LinkButton variant="ghost" size="sm" href={`/dashboard/search/${topic.id}`}>View Results</LinkButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {enrollments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">In Progress</h2>
          <div className="grid gap-2">
            {(enrollments as any[]).filter((e: any) => e.course).map((enrollment: any) => (
              <Card key={enrollment.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{enrollment.course!.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Progress: {enrollment.progress}%
                    </p>
                  </div>
                  <LinkButton variant="ghost" size="sm" href={`/dashboard/courses/${enrollment.courseId}`}>
                    Continue
                  </LinkButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
