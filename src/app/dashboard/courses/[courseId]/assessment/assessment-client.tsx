"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuizQuestion } from "@/components/certifications/quiz-question";
import { QuizResults } from "@/components/certifications/quiz-results";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { submitAssessment } from "@/features/certifications/actions";

export function AssessmentClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/assessments/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAssessment(data);
        }
      })
      .catch(() => setError("Failed to load assessment"))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handleSubmit() {
    if (!assessment) return;
    setSubmitting(true);

    const questions = assessment.questions.sort(
      (a: any, b: any) => a.sortOrder - b.sortOrder
    );
    const answerArr = questions.map((_: any, i: number) => answers[i] ?? -1);

    try {
      const res = await submitAssessment(assessment.id, answerArr);
      setResult(res);
    } catch {
      setError("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setResult(null);
    setAnswers({});
    setError("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <QuizResults
          passed={result.passed}
          score={result.score}
          passingScore={result.passingScore}
          attemptsRemaining={result.attemptsRemaining}
          attemptId={result.attemptId}
          certificationId={assessment.certification?.id}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const questions = assessment.questions.sort(
    (a: any, b: any) => a.sortOrder - b.sortOrder
  );
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
        <p className="text-muted-foreground">
          Passing score: {assessment.passingScore}% | Questions: {questions.length}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <Progress
          value={(answeredCount / questions.length) * 100}
          className="h-2"
        />
      </div>

      <div className="space-y-6">
        {questions.map((q: any, i: number) => (
          <QuizQuestion
            key={q.id}
            questionNumber={i + 1}
            total={questions.length}
            questionText={q.questionText}
            options={q.options}
            selectedAnswer={answers[i] ?? null}
            onSelect={(answerIndex) =>
              setAnswers({ ...answers, [i]: answerIndex })
            }
          />
        ))}
      </div>

      <div className="sticky bottom-4">
        <Card className="p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {answeredCount === questions.length
              ? "All questions answered"
              : `${questions.length - answeredCount} questions remaining`}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={answeredCount !== questions.length || submitting}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Grading...
              </>
            ) : (
              "Submit Assessment"
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
