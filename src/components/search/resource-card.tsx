import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Video, BookOpen, Wrench } from "lucide-react";
import Link from "next/link";
import type { ResourceItem } from "@/types";

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  documentation: <BookOpen className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />,
};

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  article: "default",
  video: "destructive",
  documentation: "secondary",
  tool: "outline",
};

export function ResourceCard({ resource }: { resource: ResourceItem }) {
  return (
    <Card className="hover:border-primary/30 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <Link
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span className="truncate">{resource.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {resource.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {resource.description}
              </p>
            )}
          </div>
          <Badge variant={typeColors[resource.type] || "default"} className="shrink-0 gap-1">
            {typeIcons[resource.type]}
            {resource.type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
