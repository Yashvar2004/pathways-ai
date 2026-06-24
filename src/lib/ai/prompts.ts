// ── Research Prompt ──────────────────────────────

export function getResearchPrompt(topic: string): string {
  return `You are an expert tech researcher and learning path designer. Generate a comprehensive research document for the topic: "${topic}"

Write a well-structured research document in Markdown format. Include ALL of the following sections:

## Overview
Write a clear 2-3 paragraph introduction explaining what ${topic} is, why it matters, and who it's for.

## Key Concepts
Break down the 5-8 most important concepts someone needs to understand. For each concept:
- **Concept Name**: Clear explanation in 2-3 sentences
- Why it matters for practitioners

## Learning Path

### Beginner Level
- What to learn first
- Recommended approach
- Time estimate: 2-4 weeks

### Intermediate Level
- Core skills to develop
- Project ideas to practice
- Time estimate: 1-3 months

### Advanced Level
- Expert-level topics
- Specialization areas
- Time estimate: 3-6 months

## Top Free Resources
Curate exactly 15 real, freely available resources. For each, provide:
- Title (real, verifiable name)
- URL (a real, working URL to an actual resource)
- Type: one of "article", "video", "documentation", "tool"
- Brief description (1 sentence)

Use REAL URLs from well-known platforms: official docs, YouTube, freeCodeCamp, MDN, Coursera (free courses), GitHub, dev.to, Medium, etc.

## Recommended Courses
Suggest 5 courses — a mix of:
- 2-3 from real platforms (Coursera, Udemy, freeCodeCamp, etc.) with real URLs
- 2-3 "Pathways AI" generated courses (use URL "#" for these)

For each course:
- Title
- Description (1-2 sentences)
- Provider name
- URL

## Career Outlook
Brief section on job market, salary ranges, and demand for ${topic} professionals.

## What's Next
Suggest 3-5 related topics the user might want to research next.

Keep the tone professional but approachable. Use proper Markdown formatting with headers, bold, lists, and links.`;
}

// ── Course Content Prompt ────────────────────────

export function getCourseContentPrompt(
  topic: string,
  courseTitle: string,
  moduleIndex: number,
  moduleTitle: string
): string {
  return `You are an expert course content creator. Generate DETAILED, IN-DEPTH learning content for:

**Topic:** ${topic}
**Course:** ${courseTitle}
**Module ${moduleIndex + 1}:** ${moduleTitle}

IMPORTANT: Do NOT just list bullet points. Write FULL, DETAILED explanations for every concept. Each section must have 2-3 paragraphs of explanation with examples.

Write the module content in Markdown format:

## Introduction
Write 3-4 paragraphs explaining what this module covers, why it matters for ${topic}, and what the learner will achieve. Be specific to "${moduleTitle}" in the context of "${topic}".

## Core Concepts

### Concept 1: [Name related to ${moduleTitle}]
Write 2-3 paragraphs explaining this concept in detail. Include:
- What it is and why it matters
- How it works in practice
- A real-world analogy
- Common mistakes to avoid

### Concept 2: [Name related to ${moduleTitle}]
Write 2-3 paragraphs explaining this concept in detail with examples.

### Concept 3: [Name related to ${moduleTitle}]
Write 2-3 paragraphs explaining this concept in detail with examples.

## Practical Examples
Provide 2-3 detailed, real-world examples showing how ${moduleTitle} is used in ${topic}. For each example:
- Describe the scenario
- Explain the approach
- Show the expected outcome

## Hands-On Exercises

### Exercise 1: Beginner
Describe a simple exercise with step-by-step instructions.

### Exercise 2: Intermediate
Describe a moderate challenge with clear goals.

### Exercise 3: Advanced
Describe a project-based exercise that combines multiple concepts.

## Key Takeaways
Write 5-7 detailed takeaways (each 2-3 sentences, not just bullet points).

## What's Next
Preview what the next module covers and how it builds on this one.

Write AT LEAST 1000 words. Be thorough, detailed, and educational. Every concept must be fully explained, not just mentioned.`;
}

// ── Quiz Questions Prompt ────────────────────────

export function getQuizPrompt(
  topic: string,
  courseTitle: string,
  moduleTitles: string[]
): string {
  return `Generate a quiz assessment for a course about "${topic}".

**Course:** ${courseTitle}
**Modules covered:**
${moduleTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate exactly 5 multiple-choice questions that test understanding of the course material.

Return ONLY a valid JSON array with this exact structure (no markdown, no code fences, just raw JSON):
[
  {
    "questionText": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option
- Questions should test understanding, not just memorization
- Cover material from different modules
- Make distractors plausible but clearly wrong to someone who learned the material
- Return ONLY the JSON array, nothing else`;
}

// ── Resource Validation Prompt ───────────────────

export function getResourceSearchPrompt(topic: string): string {
  return `List 15 real, freely available online resources for learning about "${topic}".

Return ONLY a valid JSON array (no markdown, no code fences):
[
  {
    "title": "Exact resource title",
    "url": "https://real-url.com/path",
    "description": "One sentence description",
    "type": "article"
  }
]

Rules:
- type must be one of: "article", "video", "documentation", "tool"
- URLs must be real and verifiable
- Use well-known platforms: official docs, YouTube, GitHub, MDN, freeCodeCamp, dev.to, etc.
- Include a mix of resource types
- Return ONLY the JSON array`;
}
