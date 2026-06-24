import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CourseItem } from "@/types";
import { LinkButton } from "@/components/ui/link-button";

export function CourseCard({ course, topicId }: { course: CourseItem; topicId: number }) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{course.title}</h3>
              {course.isPathwaysGenerated && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  Pathways AI
                </Badge>
              )}
            </div>
            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-3 w-3" />
            {course.provider || "Online Course"}
          </div>
          <div className="flex gap-2">
            {course.url && course.url !== "#" && (
              <LinkButton variant="outline" size="sm" href={course.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visit
                </LinkButton>
            )}
            {course.isPathwaysGenerated && (
              <LinkButton size="sm" href={`/dashboard/courses/${course.id}`}>Enroll Free</LinkButton>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
