import {
  pgTable,
  integer,
  text,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Auth.js Tables ──────────────────────────────

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ── Topics ───────────────────────────────────────

export const topics = pgTable(
  "topics",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userQueryIdx: index("idx_topics_user_query").on(table.userId, table.query),
  })
);

// ── Resources ────────────────────────────────────

export const resources = pgTable("resources", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  type: text("type").default("article").notNull(),
  isFree: boolean("is_free").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Courses ──────────────────────────────────────

export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  provider: text("provider"),
  url: text("url"),
  isFree: boolean("is_free").default(true).notNull(),
  isPathwaysGenerated: boolean("is_pathways_generated").default(false),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Modules ──────────────────────────────────────

export const modules = pgTable("modules", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  videoUrl: text("video_url"),
  videoDuration: integer("video_duration"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Enrollments ──────────────────────────────────

export const enrollments = pgTable(
  "enrollments",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    progress: integer("progress").default(0).notNull(),
    startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    userCourseIdx: uniqueIndex("idx_enrollments_user_course").on(
      table.userId,
      table.courseId
    ),
  })
);

// ── Module Progress ──────────────────────────────

export const moduleProgress = pgTable(
  "module_progress",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    moduleId: integer("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    enrollmentModuleIdx: uniqueIndex("idx_modprogress_enrollment_module").on(
      table.enrollmentId,
      table.moduleId
    ),
  })
);

// ── Assessments ──────────────────────────────────

export const assessments = pgTable("assessments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  passingScore: integer("passing_score").default(70).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Questions ────────────────────────────────────

export const questions = pgTable("questions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  assessmentId: integer("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  options: text("options").notNull(), // JSON string
  correctAnswer: integer("correct_answer").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ── Assessment Attempts ──────────────────────────

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessmentId: integer("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    answers: text("answers").notNull(), // JSON string
    attemptedAt: timestamp("attempted_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userAssessmentIdx: index("idx_attempts_user_assessment").on(
      table.userId,
      table.assessmentId
    ),
  })
);

// ── Certifications ───────────────────────────────

export const certifications = pgTable("certifications", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  badgeImageUrl: text("badge_image_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── User Certifications ──────────────────────────

export const userCertifications = pgTable(
  "user_certifications",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    certificationId: integer("certification_id")
      .notNull()
      .references(() => certifications.id, { onDelete: "cascade" }),
    assessmentAttemptId: integer("assessment_attempt_id")
      .notNull()
      .references(() => assessmentAttempts.id, { onDelete: "cascade" }),
    issuedAt: timestamp("issued_at", { mode: "date" }).defaultNow().notNull(),
    certificateUrl: text("certificate_url"),
  },
  (table) => ({
    userCertIdx: uniqueIndex("idx_usercert_user_cert").on(
      table.userId,
      table.certificationId
    ),
  })
);

// ── Subscriptions ────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  status: text("status").default("incomplete").notNull(),
  priceId: text("price_id"),
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ── User Usage ───────────────────────────────────

export const userUsage = pgTable("user_usage", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  searchCount: integer("search_count").default(0).notNull(),
  certificationCount: integer("certification_count").default(0).notNull(),
  periodStart: timestamp("period_start", { mode: "date" }).notNull(),
  periodEnd: timestamp("period_end", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Stripe Events ────────────────────────────────

export const stripeEvents = pgTable("stripe_events", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  type: text("type").notNull(),
  processed: boolean("processed").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Research Cache ───────────────────────────────

export const researchCache = pgTable("research_cache", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Verification Codes ─────────────────────────

export const verificationCodes = pgTable("verification_codes", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Marketing Subscribers ──────────────────────

export const marketingSubscribers = pgTable("marketing_subscribers", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name"),
  source: text("source").notNull().default("signup"),
  optedIn: boolean("opted_in").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Relations ─────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
  enrollments: many(enrollments),
  assessmentAttempts: many(assessmentAttempts),
  userCertifications: many(userCertifications),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  resources: many(resources),
  courses: many(courses),
  researchCache: many(researchCache),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  topic: one(topics, {
    fields: [resources.topicId],
    references: [topics.id],
  }),
}));

export const modulesRelations = relations(modules, ({ one }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  enrollments: many(enrollments),
  assessments: many(assessments),
  certifications: many(certifications),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  moduleProgress: many(moduleProgress),
}));

export const assessmentsRelations = relations(assessments, ({ many, one }) => ({
  course: one(courses, {
    fields: [assessments.courseId],
    references: [courses.id],
  }),
  questions: many(questions),
  attempts: many(assessmentAttempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  assessment: one(assessments, {
    fields: [questions.assessmentId],
    references: [assessments.id],
  }),
}));

export const assessmentAttemptsRelations = relations(assessmentAttempts, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentAttempts.assessmentId],
    references: [assessments.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one, many }) => ({
  course: one(courses, {
    fields: [certifications.courseId],
    references: [courses.id],
  }),
  userCertifications: many(userCertifications),
}));

export const userCertificationsRelations = relations(
  userCertifications,
  ({ one }) => ({
    certification: one(certifications, {
      fields: [userCertifications.certificationId],
      references: [certifications.id],
    }),
  })
);

export const researchCacheRelations = relations(researchCache, ({ one }) => ({
  topic: one(topics, {
    fields: [researchCache.topicId],
    references: [topics.id],
  }),
  user: one(users, {
    fields: [researchCache.userId],
    references: [users.id],
  }),
}));

export const moduleProgressRelations = relations(moduleProgress, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [moduleProgress.enrollmentId],
    references: [enrollments.id],
  }),
}));
