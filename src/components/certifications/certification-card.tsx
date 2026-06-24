import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Calendar } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

interface CertificationCardProps {
  id: number;
  title: string;
  description: string | null;
  courseTitle?: string;
  issuedAt: Date;
}

export function CertificationCard({
  id,
  title,
  description,
  courseTitle,
  issuedAt,
}: CertificationCardProps) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
          <Award className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {courseTitle && (
              <span>{courseTitle}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(issuedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <LinkButton variant="outline" size="sm" className="shrink-0" href={`/dashboard/certifications/${id}`}>View</LinkButton>
      </CardContent>
    </Card>
  );
}
