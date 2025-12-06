import { 
  users,
  problems,
  submissions,
  type User, 
  type InsertUser, 
  type Problem, 
  type InsertProblem,
  type Submission,
  type InsertSubmission,
  defaultConfig
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: string, newPassword: string): Promise<boolean>;
  
  getProblem(id: string): Promise<Problem | undefined>;
  getAllProblems(): Promise<Problem[]>;
  createProblem(problem: InsertProblem): Promise<Problem>;
  
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByUser(userId: string): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: "student",
        displayName: insertUser.displayName || null
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id));
    return problem || undefined;
  }

  async getAllProblems(): Promise<Problem[]> {
    return await db.select().from(problems);
  }

  async createProblem(insertProblem: InsertProblem & { id?: string }): Promise<Problem> {
    const testCasesArray = Array.isArray(insertProblem.testCases) 
      ? insertProblem.testCases as { input: string; output: string }[]
      : insertProblem.testCases;
    
    const existingProblem = insertProblem.id ? await this.getProblem(insertProblem.id) : null;
    
    if (existingProblem) {
      const [updated] = await db
        .update(problems)
        .set({
          title: insertProblem.title,
          description: insertProblem.description,
          language: insertProblem.language || "python",
          functionName: insertProblem.functionName || "solve",
          difficulty: insertProblem.difficulty || "medium",
          testCases: testCasesArray
        })
        .where(eq(problems.id, insertProblem.id!))
        .returning();
      return updated;
    }
    
    const [problem] = await db
      .insert(problems)
      .values({
        id: insertProblem.id,
        title: insertProblem.title,
        description: insertProblem.description,
        language: insertProblem.language || "python",
        functionName: insertProblem.functionName || "solve",
        difficulty: insertProblem.difficulty || "medium",
        testCases: testCasesArray
      })
      .returning();
    return problem;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.userId, userId));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions);
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const resultsArray = insertSubmission.results 
      ? insertSubmission.results as { input: string; expected: string; actual: string; passed: boolean }[]
      : null;
    
    const [submission] = await db
      .insert(submissions)
      .values({
        userId: insertSubmission.userId,
        problemId: insertSubmission.problemId,
        code: insertSubmission.code,
        passed: insertSubmission.passed ?? false,
        totalTests: insertSubmission.totalTests ?? 0,
        passedTests: insertSubmission.passedTests ?? 0,
        results: resultsArray
      })
      .returning();
    return submission;
  }

  async initializeData(): Promise<void> {
    const existingAdmin = await this.getUserByUsername(defaultConfig.adminUsername);
    if (!existingAdmin) {
      await db.insert(users).values({
        id: "admin",
        username: defaultConfig.adminUsername,
        password: defaultConfig.adminPassword,
        role: "admin",
        displayName: "المشرف"
      });
    }

    const existingProblems = await this.getAllProblems();
    if (existingProblems.length === 0) {
      await db.insert(problems).values([
        {
          id: "density",
          title: "احسب الكثافة",
          description: "اكتب دالة باسم `density(mass, volume)` تُعيد الكثافة (الكتلة ÷ الحجم).",
          language: "python",
          functionName: "density",
          difficulty: "easy",
          testCases: [
            { input: "print(density(10, 5))", output: "2.0" },
            { input: "print(density(7.5, 3))", output: "2.5" }
          ]
        },
        {
          id: "ohm_law",
          title: "قانون أوم",
          description: "اكتب دالة باسم `voltage(current, resistance)` تحسب فرق الجهد (V = I × R).",
          language: "python",
          functionName: "voltage",
          difficulty: "medium",
          testCases: [
            { input: "print(voltage(2, 5))", output: "10" },
            { input: "print(voltage(0.5, 12))", output: "6.0" }
          ]
        },
        {
          id: "kinetic_energy",
          title: "الطاقة الحركية",
          description: "اكتب دالة باسم `kinetic_energy(mass, velocity)` تحسب KE = 0.5 × m × v².",
          language: "python",
          functionName: "kinetic_energy",
          difficulty: "hard",
          testCases: [
            { input: "print(kinetic_energy(10, 4))", output: "80.0" },
            { input: "print(kinetic_energy(2, 3))", output: "9.0" }
          ]
        }
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
