"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface QuizQuestionProps {
  questionNumber: number;
  total: number;
  questionText: string;
  options: string[];
  selectedAnswer: number | null;
  onSelect: (answerIndex: number) => void;
}

export function QuizQuestion({
  questionNumber,
  total,
  questionText,
  options,
  selectedAnswer,
  onSelect,
}: QuizQuestionProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">
          Question {questionNumber} of {total}
        </p>
        <CardTitle className="text-lg">{questionText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedAnswer === index
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/30"
            }`}
          >
            <input
              type="radio"
              name={`question-${questionNumber}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => onSelect(index)}
              className="sr-only"
            />
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                selectedAnswer === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
