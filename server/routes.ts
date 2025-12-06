import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, submitCodeSchema } from "@shared/schema";
import { evaluateStudentCode, generateHint, generateProblem } from "./services/gemini";
import { getNotionDatabases, syncProblemsFromNotion, saveSubmissionToNotion, testNotionConnection, createProblemInNotion, syncAssignment } from "./services/notion";
import { executeCode } from "./services/sandbox";

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

      // Execute code using sandbox service
      const executionResult = await executeCode(code, problem.language, problem.testCases);

      if (executionResult.error) {
        return res.status(400).json({ error: executionResult.error });
      }

      const results = executionResult.results || [];
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      const passed = passedTests === totalTests;

      // Save submission with authenticated user
      await storage.createSubmission({
        userId,
        problemId,
        code,
        passed,
        totalTests,
        passedTests,
        results: results.map(r => ({
          input: r.input,
          expected: r.expected,
          actual: r.output,
          passed: r.passed
        }))
      });

      res.json({
        passed,
        totalTests,
        passedTests,
        results: results.map(r => ({
          input: r.input,
          expected: r.expected,
          actual: r.output,
          passed: r.passed
        }))
      });
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

  // AI Routes (Gemini)
  app.post("/api/ai/evaluate", requireAuth, async (req, res) => {
    try {
      const { code, problemId } = req.body;
      const problem = await storage.getProblem(problemId);
      if (!problem) {
        return res.status(404).json({ error: "المسألة غير موجودة" });
      }

      const result = await evaluateStudentCode(
        code,
        problem.title,
        problem.description,
        problem.functionName,
        problem.testCases
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في تقييم الكود" });
    }
  });

  app.post("/api/ai/hint", requireAuth, async (req, res) => {
    try {
      const { code, problemId } = req.body;
      const problem = await storage.getProblem(problemId);
      if (!problem) {
        return res.status(404).json({ error: "المسألة غير موجودة" });
      }

      const hint = await generateHint(code, problem.title, problem.description);
      res.json({ hint });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في توليد التلميح" });
    }
  });

  app.post("/api/ai/generate-problem", requireAdmin, async (req, res) => {
    try {
      const { topic, difficulty } = req.body;
      const problem = await generateProblem(topic || "فيزياء", difficulty || "medium");
      res.json(problem);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في توليد المسألة" });
    }
  });

  // Notion Routes
  app.get("/api/notion/test", requireAdmin, async (req, res) => {
    try {
      const connected = await testNotionConnection();
      res.json({ connected });
    } catch (error) {
      res.status(500).json({ error: "فشل الاتصال بـ Notion" });
    }
  });

  app.get("/api/notion/databases", requireAdmin, async (req, res) => {
    try {
      const databases = await getNotionDatabases();
      res.json(databases);
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في جلب قواعد البيانات" });
    }
  });

  app.post("/api/notion/sync-problems", requireAdmin, async (req, res) => {
    try {
      const { databaseId } = req.body;
      if (!databaseId) {
        return res.status(400).json({ error: "يرجى تحديد قاعدة البيانات" });
      }

      const notionProblems = await syncProblemsFromNotion(databaseId);
      
      // Add problems to storage
      for (const np of notionProblems) {
        const existingProblem = await storage.getProblem(np.id);
        if (!existingProblem) {
          await storage.createProblem({
            id: np.id,
            title: np.title,
            description: np.description,
            difficulty: np.difficulty as "easy" | "medium" | "hard",
            functionName: np.functionName,
            testCases: np.testCases
          });
        }
      }

      res.json({ synced: notionProblems.length, problems: notionProblems });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في مزامنة المسائل" });
    }
  });

  app.post("/api/notion/save-submission", requireAdmin, async (req, res) => {
    try {
      const { databaseId, studentName, problemTitle, code, score, passed, feedback } = req.body;
      if (!databaseId) {
        return res.status(400).json({ error: "يرجى تحديد قاعدة البيانات" });
      }

      const saved = await saveSubmissionToNotion(databaseId, {
        studentName,
        problemTitle,
        code,
        score,
        passed,
        feedback
      });

      res.json({ saved });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في حفظ النتيجة" });
    }
  });

  app.post("/api/notion/create-problem", requireAdmin, async (req, res) => {
    try {
      const { databaseId, title, description, difficulty, functionName, language, testCases } = req.body;
      if (!databaseId) {
        return res.status(400).json({ error: "يرجى تحديد قاعدة البيانات" });
      }

      const created = await createProblemInNotion(databaseId, {
        title,
        description,
        difficulty,
        functionName,
        language,
        testCases
      });

      res.json({ created });
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في إنشاء المسألة" });
    }
  });

  app.post("/api/notion/sync-assignment", requireAdmin, async (req, res) => {
    try {
      const { databaseId, title, description, language } = req.body;
      if (!databaseId) {
        return res.status(400).json({ error: "يرجى تحديد قاعدة البيانات" });
      }

      const pageId = await syncAssignment(databaseId, {
        title,
        description,
        language: language || "python"
      });

      if (pageId) {
        res.json({ success: true, pageId });
      } else {
        res.status(500).json({ error: "فشل في مزامنة التمرين" });
      }
    } catch (error) {
      res.status(500).json({ error: "حدث خطأ في مزامنة التمرين" });
    }
  });

  return httpServer;
}
