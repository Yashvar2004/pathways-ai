"use server";

import { db } from "@/lib/db";
import {
  courses,
  modules as modulesTable,
  assessments,
  questions,
  certifications,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "@/lib/ai/providers";
import { getQuizPrompt, getCourseContentPrompt } from "@/lib/ai/prompts";
import { searchYouTubeVideo } from "@/lib/youtube";

const COURSE_TEMPLATES = [
  {
    titleSuffix: "Fundamentals",
    descriptionSuffix: "master the core concepts, principles, and building blocks from the ground up",
    modules: ["Getting Started", "Core Concepts", "Key Principles", "Hands-On Practice", "Final Project"],
  },
  {
    titleSuffix: "Advanced Patterns",
    descriptionSuffix: "dive deep into advanced techniques, design patterns, and best practices",
    modules: ["Advanced Architecture", "Design Patterns", "Performance Optimization", "Real-World Case Studies", "Capstone Project"],
  },
  {
    titleSuffix: "Practical Guide",
    descriptionSuffix: "learn by building real projects with step-by-step hands-on exercises",
    modules: ["Environment Setup", "Building Your First Project", "Intermediate Projects", "Production Deployment", "Portfolio Project"],
  },
  {
    titleSuffix: "Complete Bootcamp",
    descriptionSuffix: "comprehensive bootcamp covering everything from basics to deployment",
    modules: ["Foundations", "Core Development", "Testing & Debugging", "Deployment & DevOps", "Career Preparation"],
  },
  {
    titleSuffix: "Masterclass",
    descriptionSuffix: "expert-level deep dive into professional techniques and industry standards",
    modules: ["Industry Overview", "Professional Workflows", "Advanced Tooling", "Scaling & Architecture", "Certification Prep"],
  },
];

function capitalize(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseQuizJSON(text: string): Array<{
  questionText: string;
  options: string[];
  correctAnswer: number;
}> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch {}
    }
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch {}
    }
  }
  return null;
}

async function createFallbackAssessment(courseId: number, title: string, topic: string) {
  const fallbackQuestions = [
    { text: `What is the primary purpose of ${topic}?`, options: ["To solve specific technical problems", "To replace existing technologies entirely", "To make things more complex", "None of the above"], correct: 0 },
    { text: `Which of the following is a key concept in ${topic}?`, options: ["Understanding fundamentals", "Ignoring best practices", "Avoiding documentation", "Skipping testing"], correct: 0 },
    { text: `What is the best way to learn ${topic}?`, options: ["Only reading theory", "Hands-on practice combined with theory", "Watching videos only", "Memorizing syntax"], correct: 1 },
    { text: `Which resource type is most helpful for beginners in ${topic}?`, options: ["Advanced research papers", "Interactive tutorials and documentation", "Source code only", "API references only"], correct: 1 },
    { text: `What should you do after completing this ${topic} course?`, options: ["Stop learning", "Build real projects to reinforce knowledge", "Forget everything", "Delete all your code"], correct: 1 },
  ];

  const [assessmentResult] = await db.insert(assessments).values({ courseId, title: `${title} Assessment`, passingScore: 70, maxAttempts: 3 }).returning();
  if (assessmentResult) {
    for (let q = 0; q < fallbackQuestions.length; q++) {
      await db.insert(questions).values({ assessmentId: assessmentResult.id, questionText: fallbackQuestions[q].text, options: JSON.stringify(fallbackQuestions[q].options), correctAnswer: fallbackQuestions[q].correct, sortOrder: q });
    }
    await db.insert(certifications).values({ courseId, title: `${title} Certification`, description: `Certification for completing the ${title} course on ${topic}` });
  }
}

export async function generateCoursesForTopic(topicId: number, query: string) {
  const existing = await db.select().from(courses).where(eq(courses.topicId, topicId));
  if (existing.length > 0) return;

  for (let i = 0; i < COURSE_TEMPLATES.length; i++) {
    const template = COURSE_TEMPLATES[i];
    const title = `${capitalize(query)} ${template.titleSuffix}`;
    const description = `Learn to ${template.descriptionSuffix} in ${query}`;

    const [courseResult] = await db.insert(courses).values({
      topicId,
      title,
      description,
      provider: "Pathways AI",
      url: "#",
      isFree: true,
      isPathwaysGenerated: true,
      sortOrder: i,
    }).returning();

    if (!courseResult) continue;

    for (let m = 0; m < template.modules.length; m++) {
      await db.insert(modulesTable).values({
        courseId: courseResult.id,
        title: template.modules[m],
        description: `Module ${m + 1}: ${template.modules[m]} for ${title}`,
        content: null, // Will be generated on-demand
        videoUrl: null,
        videoDuration: 15 + m * 5,
        sortOrder: m,
      });
    }

    // Generate assessment with AI
    try {
      const quizResult = await generateText(
        getQuizPrompt(query, title, template.modules),
        { maxTokens: 2000, temperature: 0.3 }
      );

      if (quizResult) {
        const quizData = parseQuizJSON(quizResult.text);
        if (quizData && quizData.length > 0) {
          const [assessmentResult] = await db.insert(assessments).values({
            courseId: courseResult.id,
            title: `${title} Assessment`,
            passingScore: 70,
            maxAttempts: 3,
          }).returning();

          if (assessmentResult) {
            for (let q = 0; q < quizData.length; q++) {
              await db.insert(questions).values({
                assessmentId: assessmentResult.id,
                questionText: quizData[q].questionText,
                options: JSON.stringify(quizData[q].options),
                correctAnswer: quizData[q].correctAnswer,
                sortOrder: q,
              });
            }
            await db.insert(certifications).values({
              courseId: courseResult.id,
              title: `${title} Certification`,
              description: `Certification for completing the ${title} course on ${query}`,
            });
          }
        } else {
          await createFallbackAssessment(courseResult.id, title, query);
        }
      } else {
        await createFallbackAssessment(courseResult.id, title, query);
      }
    } catch {
      await createFallbackAssessment(courseResult.id, title, query);
    }
  }
}

// Generate module content on-demand
export async function generateModuleContent(
  moduleId: number,
  topic: string,
  courseTitle: string,
  moduleIndex: number,
  moduleTitle: string
): Promise<{ content: string; videoUrl: string | null }> {
  // Check if content already exists
  const [mod] = await db
    .select()
    .from(modulesTable)
    .where(eq(modulesTable.id, moduleId))
    .limit(1);

  if (mod?.content) {
    return { content: mod.content, videoUrl: mod.videoUrl };
  }

  // Generate content with AI and search for video in parallel
  const [contentResult, videoResult] = await Promise.all([
    generateText(getCourseContentPrompt(topic, courseTitle, moduleIndex, moduleTitle), {
      maxTokens: 6000,
      temperature: 0.7,
    }),
    searchYouTubeVideo(`${topic} ${moduleTitle} tutorial`),
  ]);

  const content = contentResult?.text || `## ${moduleTitle}\n\nThis module covers the essential concepts of ${moduleTitle.toLowerCase()} in the context of ${topic}.\n\nKey topics:\n- Understanding the fundamentals\n- Best practices and patterns\n- Real-world examples\n- Hands-on exercises`;

  const videoUrl = videoResult
    ? `https://www.youtube.com/embed/${videoResult.videoId}`
    : null;

  // Save to database
  await db.update(modulesTable)
    .set({ content, videoUrl })
    .where(eq(modulesTable.id, moduleId));

  return { content, videoUrl };
}
