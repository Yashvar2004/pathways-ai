"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BookOpen, Award, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [userName, setUserName] = useState("there");
  const [stats, setStats] = useState({ searches: 0, courses: 0, certifications: 0 });
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    // Get user info
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.name) {
          setUserName(data.user.name.split(" ")[0] || data.user.email?.split("@")[0] || "there");
        }
      })
      .catch(() => {});

    // Load dashboard data
    async function loadData() {
      try {
        const [searchRes, courseRes, certRes] = await Promise.all([
          fetch("/api/research?limit=5"),
          fetch("/api/courses?limit=5"),
          fetch("/api/certifications?limit=5"),
        ]);

        if (searchRes.ok) {
          const data = await searchRes.json();
          setRecentSearches(data.topics || []);
          setStats((s) => ({ ...s, searches: data.topics?.length || 0 }));
        }
        if (courseRes.ok) {
          const data = await courseRes.json();
          setEnrollments(data.enrollments || []);
          setStats((s) => ({ ...s, courses: data.enrollments?.length || 0 }));
        }
        if (certRes.ok) {
          const data = await certRes.json();
          setStats((s) => ({ ...s, certifications: data.certifications?.length || 0 }));
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      }
    }
    loadData();
  }, []);

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
            <p className="text-3xl font-bold">{stats.searches}</p>
            <LinkButton variant="link" size="sm" className="px-0 mt-1" href="/dashboard/search">
              Start a new search <ArrowRight className="ml-1 h-3 w-3" />
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.courses}</p>
            <LinkButton variant="link" size="sm" className="px-0 mt-1" href="/dashboard/courses">
              View courses <ArrowRight className="ml-1 h-3 w-3" />
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.certifications}</p>
            <LinkButton variant="link" size="sm" className="px-0 mt-1" href="/dashboard/certifications">
              View certifications <ArrowRight className="ml-1 h-3 w-3" />
            </LinkButton>
          </CardContent>
        </Card>
      </div>

      {recentSearches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Searches</h2>
          <div className="grid gap-2">
            {recentSearches.map((topic: any) => (
              <Card key={topic.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{topic.query}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <LinkButton variant="ghost" size="sm" href={`/dashboard/search/${topic.id}`}>
                    View Results
                  </LinkButton>
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
            {enrollments
              .filter((e: any) => e.course)
              .map((enrollment: any) => (
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
