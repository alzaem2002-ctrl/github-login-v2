import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, submitCodeSchema, type TestCase } from "@shared/schema";

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  if (req.session.role !== "admin") {
    return res.status(403).json({ error: "غير مصرح لك بالوصول لهذه الصفحة" });
  }
  next();
}

// Simple Python code executor simulation
function executePythonCode(code: string, testCases: TestCase[]): {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  results: { input: string; expected: string; actual: string; passed: boolean }[];
} {
  const results: { input: string; expected: string; actual: string; passed: boolean }[] = [];
  let passedTests = 0;

  for (const testCase of testCases) {
    try {
      // Extract function call from input (e.g., "print(density(10, 5))")
      const funcMatch = testCase.input.match(/print\((\w+)\((.*)\)\)/);
      if (!funcMatch) {
        results.push({
          input: testCase.input,
          expected: testCase.output,
          actual: "Error: Invalid test case format",
          passed: false
        });
        continue;
      }

      const funcName = funcMatch[1];
      const argsStr = funcMatch[2];
      const args = argsStr.split(',').map(a => parseFloat(a.trim()));

      // Parse the user's Python code to extract function definition
      let actual = "";
      
      // Simple evaluation based on expected functions
      if (funcName === "density" && code.includes("def density")) {
        // Check if user implemented return mass / volume
        if (code.includes("return") && (code.includes("mass / volume") || code.includes("mass/volume"))) {
          const mass = args[0];
          const volume = args[1];
          actual = String(mass / volume);
        } else {
          actual = "None";
        }
      } else if (funcName === "voltage" && code.includes("def voltage")) {
        // Check if user implemented return current * resistance
        if (code.includes("return") && (code.includes("current * resistance") || code.includes("current*resistance") || code.includes("* resistance") || code.includes("*resistance"))) {
          const current = args[0];
          const resistance = args[1];
          const result = current * resistance;
          actual = Number.isInteger(result) ? String(result) : String(result);
        } else {
          actual = "None";
        }
      } else if (funcName === "kinetic_energy" && code.includes("def kinetic_energy")) {
        // Check if user implemented return 0.5 * mass * velocity ** 2
        if (code.includes("return") && (code.includes("0.5") || code.includes("1/2") || code.includes("/ 2"))) {
          const mass = args[0];
          const velocity = args[1];
          actual = String(0.5 * mass * velocity * velocity);
        } else {
          actual = "None";
        }
      } else {
        actual = "Error: Function not found";
      }

      const passed = actual === testCase.output;
      if (passed) passedTests++;

      results.push({
        input: testCase.input,
        expected: testCase.output,
        actual,
        passed
      });
    } catch (error) {
      results.push({
        input: testCase.input,
        expected: testCase.output,
        actual: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        passed: false
      });
    }
  }

  return {
    passed: passedTests === testCases.length,
    totalTests: testCases.length,
    passedTests,
    results
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.role = user.role;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0]?.message || "بيانات غير صالحة" });
      }

      const { username, password, displayName } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "اسم المستخدم مستخدم بالفعل" });
      }

      const user = await storage.createUser({ username, password, displayName });
      
      // Set session
      req.session.userId = user.id;
      req.session.role = user.role;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "حدث خطأ في تسجيل الخروج" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.session.userId) {
      res.json({ userId: req.session.userId, role: req.session.role });
    } else {
      res.status(401).json({ error: "غير مسجل الدخول" });
    }
  });

  // Problems routes (public for viewing, but submissions require auth)
  app.get("/api/problems", async (req, res) => {
    try {
      const problems = await storage.getAllProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  app.get("/api/problems/:id", async (req, res) => {
    try {
      const problem = await storage.getProblem(req.params.id);
      if (!problem) {
        return res.status(404).json({ error: "المسألة غير موجودة" });
      }
      res.json(problem);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  // Submissions routes (require auth)
  app.get("/api/submissions/:userId", requireAuth, async (req, res) => {
    try {
      // Users can only access their own submissions
      if (req.session.userId !== req.params.userId && req.session.role !== "admin") {
        return res.status(403).json({ error: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      const submissions = await storage.getSubmissionsByUser(req.params.userId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  app.post("/api/submit", requireAuth, async (req, res) => {
    try {
      const result = submitCodeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }

      const { problemId, code } = result.data;
      // Use userId from session, not from request body
      const userId = req.session.userId!;

      // Get problem
      const problem = await storage.getProblem(problemId);
      if (!problem) {
        return res.status(404).json({ error: "المسألة غير موجودة" });
      }

      // Execute code and get results
      const executionResult = executePythonCode(code, problem.testCases);

      // Save submission with authenticated user
      const submission = await storage.createSubmission({
        userId,
        problemId,
        code,
        passed: executionResult.passed,
        totalTests: executionResult.totalTests,
        passedTests: executionResult.passedTests,
        results: executionResult.results
      });

      res.json(executionResult);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  // Admin routes (require admin role)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  return httpServer;
}
