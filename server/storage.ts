import { 
  type User, 
  type InsertUser, 
  type Problem, 
  type InsertProblem,
  type Submission,
  type InsertSubmission,
  type TestCase,
  defaultConfig
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: string, newPassword: string): Promise<boolean>;
  
  // Problems
  getProblem(id: string): Promise<Problem | undefined>;
  getAllProblems(): Promise<Problem[]>;
  createProblem(problem: InsertProblem): Promise<Problem>;
  
  // Submissions
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByUser(userId: string): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private problems: Map<string, Problem>;
  private submissions: Map<string, Submission>;

  constructor() {
    this.users = new Map();
    this.problems = new Map();
    this.submissions = new Map();
    
    // Initialize admin user
    this.initializeAdmin();
    
    // Initialize science problems
    this.initializeProblems();
  }

  private initializeAdmin() {
    const adminUser: User = {
      id: "admin",
      username: defaultConfig.adminUsername,
      password: defaultConfig.adminPassword,
      role: "admin",
      displayName: "المشرف",
    };
    this.users.set(adminUser.id, adminUser);
  }

  private initializeProblems() {
    // Problem 1: Density
    const densityProblem: Problem = {
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
    };
    this.problems.set(densityProblem.id, densityProblem);

    // Problem 2: Ohm's Law
    const ohmLawProblem: Problem = {
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
    };
    this.problems.set(ohmLawProblem.id, ohmLawProblem);

    // Problem 3: Kinetic Energy
    const kineticEnergyProblem: Problem = {
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
    };
    this.problems.set(kineticEnergyProblem.id, kineticEnergyProblem);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: "student",
      displayName: insertUser.displayName || null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.password = newPassword;
    this.users.set(userId, user);
    return true;
  }

  // Problem methods
  async getProblem(id: string): Promise<Problem | undefined> {
    return this.problems.get(id);
  }

  async getAllProblems(): Promise<Problem[]> {
    return Array.from(this.problems.values());
  }

  async createProblem(insertProblem: InsertProblem & { id?: string }): Promise<Problem> {
    const id = insertProblem.id || randomUUID();
    const problem: Problem = { 
      id,
      title: insertProblem.title,
      description: insertProblem.description,
      language: insertProblem.language || "python",
      functionName: insertProblem.functionName || "solve",
      difficulty: insertProblem.difficulty || "medium",
      testCases: insertProblem.testCases as { input: string; output: string }[]
    };
    this.problems.set(id, problem);
    return problem;
  }

  // Submission methods
  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.userId === userId,
    );
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values());
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = { 
      id,
      userId: insertSubmission.userId,
      problemId: insertSubmission.problemId,
      code: insertSubmission.code,
      passed: insertSubmission.passed ?? false,
      totalTests: insertSubmission.totalTests ?? 0,
      passedTests: insertSubmission.passedTests ?? 0,
      results: (insertSubmission.results as { input: string; expected: string; actual: string; passed: boolean }[]) ?? null,
      submittedAt: new Date()
    };
    this.submissions.set(id, submission);
    return submission;
  }
}

export const storage = new MemStorage();
