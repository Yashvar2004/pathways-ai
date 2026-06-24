"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Play, Clock, Lock } from "lucide-react";
import Link from "next/link";
import type { ModuleItem } from "@/types";
import { LinkButton } from "@/components/ui/link-button";

interface ModuleListProps {
  modules: ModuleItem[];
  courseId: number;
  completedModuleIds?: number[];
}

export function ModuleList({ modules, courseId, completedModuleIds = [] }: ModuleListProps) {
  return (
    <div className="space-y-2">
      {modules.map((mod, index) => {
        const isCompleted = completedModuleIds.includes(mod.id);
        const isLocked = index > 0 && !completedModuleIds.includes(modules[index - 1].id);

        return (
          <div
            key={mod.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isCompleted
                ? "border-primary/30 bg-primary/5"
                : isLocked
                ? "border-border bg-muted/30 opacity-60"
                : "border-border hover:border-primary/30 transition-colors"
            }`}
          >
            <div className="shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : isLocked ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {index + 1}. {mod.title}
              </p>
              {mod.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {mod.description}
                </p>
              )}
            </div>
            {mod.videoDuration && (
              <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {mod.videoDuration} min
              </Badge>
            )}
            {!isLocked && (
              <LinkButton variant="ghost" size="sm" className="shrink-0" href={`/dashboard/courses/${courseId}/modules/${mod.id}`}>
                  <Play className="h-4 w-4 mr-1" />
                  {isCompleted ? "Review" : "Start"}
                </LinkButton>
            )}
          </div>
        );
      })}
    </div>
  );
}
