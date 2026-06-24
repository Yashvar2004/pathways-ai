"use client";

import { ResourceCard } from "@/components/search/resource-card";
import { CourseCard } from "@/components/search/course-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import type { ResourceItem, CourseItem } from "@/types";

interface TopicDetailClientProps {
  topicId: number;
  query: string;
  resources: ResourceItem[];
  courses: CourseItem[];
}

export function TopicDetailClient({
  topicId,
  query,
  resources,
  courses,
}: TopicDetailClientProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            {query}
          </h1>
          <p className="text-muted-foreground mt-1">
            {resources.length} resources and {courses.length} courses found
          </p>
        </div>
        <LinkButton variant="outline" href="/dashboard/search">
          New Search
        </LinkButton>
      </div>

      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources" className="gap-1">
            <BookOpen className="h-4 w-4" />
            Resources
            <Badge variant="secondary" className="ml-1">
              {resources.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-1">
            <GraduationCap className="h-4 w-4" />
            Courses
            <Badge variant="secondary" className="ml-1">
              {courses.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-3 mt-4">
          {resources.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No resources found for this topic.
            </p>
          ) : (
            resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-3 mt-4">
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No courses found for this topic.
            </p>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                topicId={topicId}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
