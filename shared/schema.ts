import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for both students and admin
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // "admin" or "student"
  displayName: text("display_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Test case type
export const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

export type TestCase = z.infer<typeof testCaseSchema>;

// Problems table
export const problems = pgTable("problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  language: text("language").notNull().default("python"),
  testCases: jsonb("test_cases").notNull().$type<TestCase[]>(),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
});

export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problems.$inferSelect;

// Submissions table
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  problemId: varchar("problem_id").notNull(),
  code: text("code").notNull(),
  passed: boolean("passed").notNull().default(false),
  totalTests: integer("total_tests").notNull().default(0),
  passedTests: integer("passed_tests").notNull().default(0),
  results: jsonb("results").$type<{ input: string; expected: string; actual: string; passed: boolean }[]>(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Platform config
export interface PlatformConfig {
  siteName: string;
  adminUsername: string;
  adminPassword: string;
  allowRegistration: boolean;
  defaultLanguage: string;
}

export const defaultConfig: PlatformConfig = {
  siteName: "منصة علوم الذكية",
  adminUsername: "ostaz_science",
  adminPassword: "SecurePass2025!",
  allowRegistration: true,
  defaultLanguage: "ar",
};

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  displayName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Submit code schema
export const submitCodeSchema = z.object({
  problemId: z.string(),
  code: z.string().min(1, "الكود مطلوب"),
});

export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
