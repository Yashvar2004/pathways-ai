// Seed script - run with: DATABASE_URL="..." npx tsx scripts/seed.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

const SEED_TOPICS = [
  {
    query: "blockchain",
    resources: [
      { title: "What is Blockchain? A Complete Guide", url: "https://www.ibm.com/topics/blockchain", description: "IBM's comprehensive introduction to blockchain technology", type: "article" },
      { title: "Bitcoin Whitepaper by Satoshi Nakamoto", url: "https://bitcoin.org/bitcoin.pdf", description: "The original paper that started it all", type: "documentation" },
      { title: "Blockchain Demo (Interactive)", url: "https://andersbrownworth.com/blockchain/", description: "Visual interactive demo of blockchain concepts", type: "tool" },
      { title: "Ethereum Developer Docs", url: "https://ethereum.org/en/developers/docs/", description: "Official Ethereum documentation for developers", type: "documentation" },
      { title: "Blockchain Explained (YouTube)", url: "https://www.youtube.com/watch?v=SSo_EIwHSd4", description: "Simply Explained video on blockchain", type: "video" },
    ],
    courses: [
      { title: "Introduction to Blockchain", description: "Learn blockchain fundamentals, distributed ledgers, and consensus mechanisms", provider: "Pathways AI", url: "#", isPathwaysGenerated: true },
      { title: "Blockchain A-Z: Build a Blockchain", description: "Hands-on course to build your own blockchain", provider: "Udemy", url: "https://www.udemy.com/course/build-your-blockchain-az/", isPathwaysGenerated: false },
    ],
  },
  {
    query: "react developer",
    resources: [
      { title: "React Official Documentation", url: "https://react.dev/", description: "The new React docs with hooks and server components", type: "documentation" },
      { title: "Next.js Documentation", url: "https://nextjs.org/docs", description: "Official Next.js framework documentation", type: "documentation" },
      { title: "React TypeScript Cheatsheet", url: "https://react-typescript-cheatsheet.netlify.app/", description: "Comprehensive guide for React with TypeScript", type: "article" },
    ],
    courses: [
      { title: "React Fundamentals", description: "Master React from basics to advanced concepts like hooks, context, and patterns", provider: "Pathways AI", url: "#", isPathwaysGenerated: true },
      { title: "Full-Stack React with Next.js", description: "Build production-ready full-stack applications with Next.js", provider: "Frontend Masters", url: "https://frontendmasters.com/courses/next-js/", isPathwaysGenerated: false },
    ],
  },
  {
    query: "machine learning",
    resources: [
      { title: "Machine Learning Crash Course (Google)", url: "https://developers.google.com/machine-learning/crash-course", description: "Google's fast-paced ML introduction", type: "article" },
      { title: "Kaggle Learn", url: "https://www.kaggle.com/learn", description: "Free hands-on ML tutorials with real datasets", type: "tool" },
      { title: "Scikit-Learn Documentation", url: "https://scikit-learn.org/stable/", description: "Core Python ML library documentation", type: "documentation" },
    ],
    courses: [
      { title: "Introduction to Machine Learning", description: "Learn ML fundamentals: supervised/unsupervised learning, model evaluation", provider: "Pathways AI", url: "#", isPathwaysGenerated: true },
      { title: "Machine Learning (Coursera)", description: "Andrew Ng's legendary ML course", provider: "Coursera", url: "https://www.coursera.org/learn/machine-learning", isPathwaysGenerated: false },
    ],
  },
];

const quizQuestions = [
  { text: "What is the primary purpose of this technology?", options: ["To solve specific technical problems", "To replace existing technologies entirely", "To make things more complex", "None of the above"], correct: 0 },
  { text: "Which of the following is a key concept in this field?", options: ["Understanding fundamentals", "Ignoring best practices", "Avoiding documentation", "Skipping testing"], correct: 0 },
  { text: "What is the best way to learn this technology?", options: ["Only reading theory", "Hands-on practice combined with theory", "Watching videos only", "Memorizing syntax"], correct: 1 },
  { text: "Which resource type is most helpful for beginners?", options: ["Advanced research papers", "Interactive tutorials and documentation", "Source code only", "API references only"], correct: 1 },
  { text: "What should you do after completing this course?", options: ["Stop learning", "Build real projects to reinforce knowledge", "Forget everything", "Delete all your code"], correct: 1 },
];

async function seed() {
  console.log("Seeding database...");

  // Create a demo user for seed data
  const seedUserId = "seed-demo-user";
  await db.insert(schema.users)
    .values({ id: seedUserId, email: "demo@pathways.ai", name: "Demo User" })
    .onConflictDoNothing();

  for (const topicData of SEED_TOPICS) {
    console.log(`  Topic: ${topicData.query}`);

    const [topicResult] = await db.insert(schema.topics)
      .values({ userId: seedUserId, query: topicData.query })
      .returning();
    if (!topicResult) continue;
    const topicId = topicResult.id;

    // Insert resources
    for (let i = 0; i < topicData.resources.length; i++) {
      const r = topicData.resources[i];
      await db.insert(schema.resources)
        .values({ topicId, title: r.title, url: r.url, description: r.description, type: r.type, isFree: true, sortOrder: i });
    }

    // Insert courses
    for (let i = 0; i < topicData.courses.length; i++) {
      const c = topicData.courses[i];
      const [courseResult] = await db.insert(schema.courses)
        .values({ topicId, title: c.title, description: c.description, provider: c.provider, url: c.url, isFree: true, isPathwaysGenerated: c.isPathwaysGenerated, sortOrder: i })
        .returning();
      if (!courseResult) continue;
      const courseId = courseResult.id;

      if (c.isPathwaysGenerated) {
        const moduleNames = ["Getting Started", "Core Concepts", "Deep Dive", "Practical Applications", "Final Project"];

        for (let m = 0; m < moduleNames.length; m++) {
          await db.insert(schema.modules)
            .values({
              courseId,
              title: moduleNames[m],
              description: `Module ${m + 1}: ${moduleNames[m]} for ${c.title}`,
              content: `## ${moduleNames[m]}\n\nThis module covers the essential concepts of ${moduleNames[m].toLowerCase()} in the context of ${topicData.query}.\n\nKey topics:\n- Understanding the fundamentals\n- Best practices and patterns\n- Real-world examples\n- Hands-on exercises`,
              videoUrl: null,
              videoDuration: 15 + m * 5,
              sortOrder: m,
            });
        }

        // Create assessment
        const [assessmentResult] = await db.insert(schema.assessments)
          .values({ courseId, title: `${c.title} Assessment`, passingScore: 70, maxAttempts: 3 })
          .returning();
        if (!assessmentResult) continue;
        const assessmentId = assessmentResult.id;

        // Create questions
        for (let q = 0; q < quizQuestions.length; q++) {
          await db.insert(schema.questions)
            .values({
              assessmentId,
              questionText: quizQuestions[q].text.replace("this technology", topicData.query).replace("this field", topicData.query),
              options: JSON.stringify(quizQuestions[q].options),
              correctAnswer: quizQuestions[q].correct,
              sortOrder: q,
            });
        }

        // Create certification
        await db.insert(schema.certifications)
          .values({ courseId, title: c.title, description: `Certification for completing the ${c.title} course` });
      }
    }
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
