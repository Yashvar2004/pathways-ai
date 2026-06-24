import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  topics,
  courses,
  modules as modulesTable,
  assessments,
  questions,
  certifications,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateText } from "@/lib/ai/providers";
import { getQuizPrompt } from "@/lib/ai/prompts";

// Course templates for AI generation
const COURSE_TEMPLATES = [
  {
    titleSuffix: "Fundamentals",
    descriptionSuffix:
      "master the core concepts, principles, and building blocks from the ground up",
    modules: [
      "Getting Started",
      "Core Concepts",
      "Key Principles",
      "Hands-On Practice",
      "Final Project",
    ],
  },
  {
    titleSuffix: "Advanced Patterns",
    descriptionSuffix:
      "dive deep into advanced techniques, design patterns, and best practices",
    modules: [
      "Advanced Architecture",
      "Design Patterns",
      "Performance Optimization",
      "Real-World Case Studies",
      "Capstone Project",
    ],
  },
  {
    titleSuffix: "Practical Guide",
    descriptionSuffix:
      "learn by building real projects with step-by-step hands-on exercises",
    modules: [
      "Environment Setup",
      "Building Your First Project",
      "Intermediate Projects",
      "Production Deployment",
      "Portfolio Project",
    ],
  },
  {
    titleSuffix: "Complete Bootcamp",
    descriptionSuffix:
      "comprehensive bootcamp covering everything from basics to deployment",
    modules: [
      "Foundations",
      "Core Development",
      "Testing & Debugging",
      "Deployment & DevOps",
      "Career Preparation",
    ],
  },
  {
    titleSuffix: "Masterclass",
    descriptionSuffix:
      "expert-level deep dive into professional techniques and industry standards",
    modules: [
      "Industry Overview",
      "Professional Workflows",
      "Advanced Tooling",
      "Scaling & Architecture",
      "Certification Prep",
    ],
  },
];

interface GeneratedCourse {
  id: number;
  title: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topicId, query } = await req.json();
  if (!topicId || !query) {
    return NextResponse.json(
      { error: "Missing topicId or query" },
      { status: 400 }
    );
  }

  

  // Verify topic belongs to user
  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId)))
    .limit(1);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // Check if courses already exist for this topic
  const existingCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.topicId, topicId));

  if (existingCourses.length > 0) {
    return NextResponse.json({
      courses: (existingCourses as any[]).map((c: any) => ({ id: c.id, title: c.title })),
      cached: true,
    });
  }

  // Generate courses
  const generatedCourses: GeneratedCourse[] = [];

  for (const template of COURSE_TEMPLATES) {
    const title = `${capitalize(query)} ${template.titleSuffix}`;
    const description = `Learn to ${template.descriptionSuffix} in ${query}`;

    // Insert course
    const [courseResult] = await db
      .insert(courses)
      .values({
        topicId,
        title,
        description,
        provider: "Pathways AI",
        url: "#",
        isFree: true,
        isPathwaysGenerated: true,
        sortOrder: generatedCourses.length,
      })
      .returning();

    if (!courseResult) continue;

    // Insert modules
    for (let m = 0; m < template.modules.length; m++) {
      await db.insert(modulesTable)
        .values({
          courseId: courseResult.id,
          title: template.modules[m],
          description: `Module ${m + 1}: ${template.modules[m]} for ${title}`,
          content: `## ${template.modules[m]}\n\nThis module covers the essential concepts of ${template.modules[m].toLowerCase()} in the context of ${query}.\n\nKey topics:\n- Understanding the fundamentals\n- Best practices and patterns\n- Real-world examples\n- Hands-on exercises\n\nComplete this module and mark it as done to track your progress.`,
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
          const [assessmentResult] = await db
            .insert(assessments)
            .values({
              courseId: courseResult.id,
              title: `${title} Assessment`,
              passingScore: 70,
              maxAttempts: 3,
            })
            .returning();

          if (assessmentResult) {
            for (let q = 0; q < quizData.length; q++) {
              await db.insert(questions)
                .values({
                  assessmentId: assessmentResult.id,
                  questionText: quizData[q].questionText,
                  options: JSON.stringify(quizData[q].options),
                  correctAnswer: quizData[q].correctAnswer,
                  sortOrder: q,
                });
            }

            // Create certification
            await db.insert(certifications)
              .values({
                courseId: courseResult.id,
                title: `${title} Certification`,
                description: `Certification for completing the ${title} course on ${query}`,
              });
          }
        }
      }
    } catch (err) {
      console.error(`[Courses] Quiz generation failed for ${title}:`, err);
      // Create assessment with fallback questions
      await createFallbackAssessment(courseResult.id, title, query);
    }

    generatedCourses.push({ id: courseResult.id, title });
  }

  return NextResponse.json({ courses: generatedCourses, cached: false });
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseQuizJSON(text: string): Array<{
  questionText: string;
  options: string[];
  correctAnswer: number;
}> | null {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code fences
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // ignore
      }
    }
    // Try finding array in text
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // ignore
      }
    }
  }
  return null;
}

async function createFallbackAssessment(
  courseId: number,
  title: string,
  topic: string
) {
  const fallbackQuestions = [
    {
      text: `What is the primary purpose of ${topic}?`,
      options: [
        "To solve specific technical problems",
        "To replace existing technologies entirely",
        "To make things more complex",
        "None of the above",
      ],
      correct: 0,
    },
    {
      text: `Which of the following is a key concept in ${topic}?`,
      options: [
        "Understanding fundamentals",
        "Ignoring best practices",
        "Avoiding documentation",
        "Skipping testing",
      ],
      correct: 0,
    },
    {
      text: `What is the best way to learn ${topic}?`,
      options: [
        "Only reading theory",
        "Hands-on practice combined with theory",
        "Watching videos only",
        "Memorizing syntax",
      ],
      correct: 1,
    },
    {
      text: `Which resource type is most helpful for beginners in ${topic}?`,
      options: [
        "Advanced research papers",
        "Interactive tutorials and documentation",
        "Source code only",
        "API references only",
      ],
      correct: 1,
    },
    {
      text: `What should you do after completing this ${topic} course?`,
      options: [
        "Stop learning",
        "Build real projects to reinforce knowledge",
        "Forget everything",
        "Delete all your code",
      ],
      correct: 1,
    },
  ];

  const [assessmentResult] = await db
    .insert(assessments)
    .values({
      courseId,
      title: `${title} Assessment`,
      passingScore: 70,
      maxAttempts: 3,
    })
    .returning();

  if (assessmentResult) {
    for (let q = 0; q < fallbackQuestions.length; q++) {
      await db.insert(questions)
        .values({
          assessmentId: assessmentResult.id,
          questionText: fallbackQuestions[q].text,
          options: JSON.stringify(fallbackQuestions[q].options),
          correctAnswer: fallbackQuestions[q].correct,
          sortOrder: q,
        });
    }

    await db.insert(certifications)
      .values({
        courseId,
        title: `${title} Certification`,
        description: `Certification for completing the ${title} course on ${topic}`,
      });
  }
}
