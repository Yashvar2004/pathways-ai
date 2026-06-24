import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Provider clients ─────────────────────────────

function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

function getGemini() {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

// ── Types ────────────────────────────────────────

export interface GenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamChunk {
  text: string;
  done: boolean;
  provider: "groq" | "gemini";
}

// ── Non-streaming generation ─────────────────────

export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<{ text: string; provider: string } | null> {
  const { systemPrompt, maxTokens = 4096, temperature = 0.7 } = options;

  // Try Groq first
  const groq = getGroq();
  if (groq) {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const text = response.choices[0]?.message?.content;
      if (text) return { text, provider: "groq" };
    } catch (err) {
      console.error("[AI] Groq failed, trying Gemini:", err);
    }
  }

  // Fallback to Gemini
  const genAI = getGemini();
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return { text, provider: "gemini" };
    } catch (err) {
      console.error("[AI] Gemini also failed:", err);
    }
  }

  return null;
}

// ── Streaming generation ─────────────────────────

export async function generateStream(
  prompt: string,
  options: GenerateOptions = {}
): Promise<ReadableStream<StreamChunk> | null> {
  const { systemPrompt, maxTokens = 4096, temperature = 0.7 } = options;

  // Try Groq streaming first (blazing fast)
  const groq = getGroq();
  if (groq) {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });

      const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });

      return new ReadableStream<StreamChunk>({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue({ text: content, done: false, provider: "groq" });
              }
            }
            controller.enqueue({ text: "", done: true, provider: "groq" });
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
    } catch (err) {
      console.error("[AI] Groq stream failed, trying Gemini:", err);
    }
  }

  // Fallback to Gemini streaming
  const genAI = getGemini();
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContentStream(prompt);

      return new ReadableStream<StreamChunk>({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue({ text, done: false, provider: "gemini" });
              }
            }
            controller.enqueue({ text: "", done: true, provider: "gemini" });
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
    } catch (err) {
      console.error("[AI] Gemini stream also failed:", err);
    }
  }

  return null;
}
