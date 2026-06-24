import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { generateText } from "@/lib/ai/providers";
import { getResearchPrompt } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { researchCache, topics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ResearchContent } from "./research-content";
import { auth } from "@clerk/nextjs/server";

interface ResearchSectionProps {
  topicId: number;
  query: string;
}

export async function ResearchSection({ topicId, query }: ResearchSectionProps) {
  console.log("[ResearchSection] Starting for topicId:", topicId, "query:", query);
  const { userId: authUserId } = await auth();
  const userId = authUserId || "unknown";
  // Check cache first
  const [cached] = await db
    .select()
    .from(researchCache)
    .where(eq(researchCache.topicId, topicId))
    .limit(1);

  let content = "";
  let provider = "";

  if (cached) {
    content = cached.content;
    provider = cached.provider;
  } else {
    // Generate research server-side
    console.log("[ResearchSection] No cache, generating with AI...");
    const prompt = getResearchPrompt(query);
    const result = await generateText(prompt, {
      maxTokens: 6000,
      temperature: 0.7,
    });
    console.log("[ResearchSection] AI result:", result ? `${result.provider} (${result.text.length} chars)` : "null");

    if (result) {
      content = result.text;
      provider = result.provider;

      // Cache the result
      try {
        await db.insert(researchCache)
          .values({
            topicId,
            userId,
            content,
            provider,
          });
      } catch (err) {
        console.error("[Research] Failed to cache:", err);
      }
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Research: {query}
        </CardTitle>
        <div className="flex items-center gap-2">
          {provider && (
            <Badge variant="outline" className="text-xs">
              {provider === "groq"
                ? "⚡ Groq"
                : provider === "gemini"
                ? "✨ Gemini"
                : provider}
            </Badge>
          )}
          {cached && (
            <Badge variant="secondary" className="text-xs">
              Cached
            </Badge>
          )}
          <Badge variant="default" className="gap-1 bg-green-600">
            Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {content ? (
          <ResearchContent content={content} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Unable to generate AI research. Please check that AI API keys are
              configured.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
