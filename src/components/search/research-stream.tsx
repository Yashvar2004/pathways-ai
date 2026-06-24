"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface ResearchStreamProps {
  topicId: number;
  query: string;
}

export function ResearchStream({ topicId, query }: ResearchStreamProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"loading" | "streaming" | "done" | "error">("loading");
  const [provider, setProvider] = useState<string>("");
  const [isCached, setIsCached] = useState(false);

  const fetchResearch = useCallback(async () => {
    try {
      console.log("[Research] Starting fetch for:", topicId, query);
      setStatus("loading");

      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topicId, query }),
      });

      console.log("[Research] Response status:", res.status);

      if (!res.ok) {
        throw new Error(`Research request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      setStatus("streaming");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.text) {
              setContent((prev) => prev + data.text);
            }

            if (data.provider) {
              setProvider(data.provider);
            }

            if (data.cached) {
              setIsCached(true);
            }

            if (data.done) {
              setStatus("done");
            }
          } catch {
            // Skip malformed lines
          }
        }
      }

      setStatus("done");
    } catch (err) {
      console.error("[Research] Stream error:", err);
      setStatus("error");
    }
  }, [topicId, query]);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

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
          {isCached && (
            <Badge variant="secondary" className="text-xs">
              Cached
            </Badge>
          )}
          {status === "streaming" && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </Badge>
          )}
          {status === "done" && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Starting AI research...</p>
          </div>
        )}

        {status === "error" && !content && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground">
              Unable to generate AI research. Please check that AI API keys are
              configured and try again.
            </p>
          </div>
        )}

        {(content || status === "streaming") && (
          <div className="prose prose-sm max-w-none dark:prose-invert max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={content} />
            {status === "streaming" && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Simple Markdown Renderer ─────────────────────

function MarkdownRenderer({ content }: { content: string }) {
  const html = content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
    )
    // Inline code
    .replace(
      /`(.+?)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>'
    )
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Single newlines to <br>
    .replace(/\n/g, "<br/>");

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<p class="mb-3">${html}</p>`,
      }}
    />
  );
}
