"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Award, RefreshCw } from "lucide-react";
import { claimCertification } from "@/features/certifications/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

interface QuizResultsProps {
  passed: boolean;
  score: number;
  passingScore: number;
  attemptsRemaining: number;
  attemptId: number;
  certificationId?: number;
  onRetry?: () => void;
}

export function QuizResults({
  passed,
  score,
  passingScore,
  attemptsRemaining,
  attemptId,
  certificationId,
  onRetry,
}: QuizResultsProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);

  async function handleClaimCert() {
    if (!certificationId) return;
    setClaiming(true);
    try {
      const result = await claimCertification(attemptId, certificationId);
      if (!result) {
        toast.error("Failed to claim certification");
      } else if ("error" in result) {
        toast.error("Free certification limit reached. Upgrade to Pro.");
        router.push("/pricing");
      } else {
        toast.success("Certification claimed successfully!");
        router.push("/dashboard/certifications");
      }
    } catch {
      toast.error("Failed to claim certification");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <Card className={`border-2 ${passed ? "border-primary/30" : "border-destructive/30"}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3">
          {passed ? (
            <CheckCircle2 className="h-16 w-16 text-primary" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
        </div>
        <CardTitle className="text-2xl">{passed ? "Congratulations!" : "Not Quite There"}</CardTitle>
        <CardDescription>
          {passed
            ? "You passed the assessment and can claim your certification!"
            : `You need ${passingScore}% to pass. Keep studying and try again.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Your Score</span>
            <span className="font-bold">{score}%</span>
          </div>
          <Progress value={score} className={`h-3 ${passed ? "[&>div]:bg-primary" : "[&>div]:bg-destructive"}`} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Passing: {passingScore}%</span>
            <Badge variant={passed ? "default" : "destructive"}>
              {passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {passed && certificationId && (
            <Button onClick={handleClaimCert} disabled={claiming} size="lg">
              <Award className="mr-2 h-5 w-5" />
              {claiming ? "Claiming..." : "Claim Your Certification"}
            </Button>
          )}
          {!passed && attemptsRemaining > 0 && onRetry && (
            <Button onClick={onRetry} variant="outline" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Assessment ({attemptsRemaining} attempts left)
            </Button>
          )}
          {!passed && attemptsRemaining === 0 && (
            <p className="text-center text-sm text-destructive">
              No attempts remaining for this assessment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
