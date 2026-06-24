"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Calendar, GraduationCap, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";

interface CertificateDisplayProps {
  userName: string;
  courseTitle: string;
  certificationTitle: string;
  issuedAt: Date;
}

export function CertificateDisplay({
  userName,
  courseTitle,
  certificationTitle,
  issuedAt,
}: CertificateDisplayProps) {
  const certRef = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    if (!certRef.current) return;

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `${userName}-${certificationTitle}-Certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download certificate:", err);
    }
  }

  return (
    <div className="space-y-4">
      <div ref={certRef}>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden relative">
          {/* Decorative border */}
          <div className="absolute inset-0 border-8 border-primary/10 rounded-lg m-2 pointer-events-none" />

          <CardContent className="p-8 md:p-12 text-center space-y-6 relative">
            {/* Pathways Header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-primary tracking-tight">Pathways</span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
                Certificate of Completion
              </p>
              <div className="w-24 h-0.5 bg-primary/30 mx-auto" />
            </div>

            <Award className="h-16 w-16 text-primary mx-auto" />

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This is to certify that
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{userName}</p>
              <p className="text-sm text-muted-foreground">
                has successfully completed
              </p>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                {courseTitle}
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3">
                Issued by Pathways
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(issuedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download Certificate
        </Button>
      </div>
    </div>
  );
}
