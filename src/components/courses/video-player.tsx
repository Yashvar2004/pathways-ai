"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string | null;
  title: string;
  duration?: number | null;
}

export function VideoPlayer({ videoUrl, title, duration }: VideoPlayerProps) {
  const hasVideo = videoUrl && videoUrl !== "#" && videoUrl.includes("youtube.com/embed");

  return (
    <div className="space-y-3">
      {hasVideo ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={videoUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <Card className="aspect-video flex flex-col items-center justify-center gap-3 bg-secondary/50">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">
            Video lesson coming soon
          </p>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " tutorial")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Search on YouTube
            <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      )}
      <div className="flex items-center gap-3">
        {duration && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
          </Badge>
        )}
      </div>
    </div>
  );
}
