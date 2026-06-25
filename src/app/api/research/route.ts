import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { researchCache, topics } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateStream } from "@/lib/ai/providers";
import { getResearchPrompt } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  console.log("[Research API] POST request received");
  const { userId } = await getAuth();
  console.log("[Research API] Session:", userId ? "authenticated" : "NOT authenticated");
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topicId, query } = await req.json();
  if (!topicId || !query) {
    return new Response("Missing topicId or query", { status: 400 });
  }

  

  // Verify topic belongs to user
  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId)))
    .limit(1);

  if (!topic) {
    return new Response("Topic not found", { status: 404 });
  }

  // Check for cached research
  const [cached] = await db
    .select()
    .from(researchCache)
    .where(eq(researchCache.topicId, topicId))
    .limit(1);

  if (cached) {
    // Return cached content as a single-stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send in chunks to simulate streaming for cached content
        const chunks = cached.content.match(/.{1,50}/g) || [cached.content];
        for (const chunk of chunks) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: chunk, done: false, provider: cached.provider, cached: true })}\n\n`
            )
          );
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: "", done: true, provider: cached.provider, cached: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Generate fresh research with AI
  const prompt = getResearchPrompt(query);
  const aiStream = await generateStream(prompt, {
    maxTokens: 6000,
    temperature: 0.7,
  });

  if (!aiStream) {
    // AI providers unavailable — return fallback message
    const encoder = new TextEncoder();
    const fallback = `# ${query}\n\nWe're currently unable to generate AI research for this topic. Please ensure AI API keys are configured, or try again later.\n\nIn the meantime, check the courses and resources listed below.`;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: fallback, done: false, provider: "fallback" })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: "", done: true, provider: "fallback" })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Stream AI response and collect for caching
  let fullContent = "";
  let providerName = "unknown";

  const encoder = new TextEncoder();
  const reader = aiStream.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fullContent += value.text;
          providerName = value.provider;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: value.text, done: false, provider: value.provider })}\n\n`
            )
          );
        }

        // Cache the complete research
        if (fullContent.length > 100) {
          try {
            await db.insert(researchCache)
              .values({
                topicId,
                userId,
                content: fullContent,
                provider: providerName,
              });
          } catch (err) {
            console.error("[Research] Failed to cache:", err);
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "", done: true, provider: providerName })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        console.error("[Research] Stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
