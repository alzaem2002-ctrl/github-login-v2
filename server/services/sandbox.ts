// Sandbox service for safe code execution

interface TestCase {
  input?: string;
  output: string;
}

interface ExecutionResult {
  success?: boolean;
  error?: string;
  results?: {
    input: string;
    output: string;
    expected: string;
    passed: boolean;
  }[];
}

const DANGEROUS_PATTERNS = [
  /import\s+(os|sys|subprocess|shutil|socket)/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /__import__\s*\(/i,
  /open\s*\(/i,
  /rm\s+-rf/i,
  /require\s*\(\s*['"]child_process['"]\s*\)/i,
  /require\s*\(\s*['"]fs['"]\s*\)/i,
];

function validateCode(code: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      return false;
    }
  }
  return true;
}

// Simple JavaScript-based Python interpreter for basic operations
function executePythonLocally(code: string, testCases: TestCase[]): ExecutionResult {
  const results: { input: string; output: string; expected: string; passed: boolean }[] = [];

  for (const testCase of testCases) {
    try {
      // Handle simple print statements (e.g., print('Hello'))
      const simplePrintMatch = code.match(/print\s*\(\s*['"](.+)['"]\s*\)/);
      if (simplePrintMatch && !testCase.input) {
        const output = simplePrintMatch[1];
        const passed = output === testCase.output;
        results.push({
          input: testCase.input || "",
          output,
          expected: testCase.output,
          passed
        });
        continue;
      }

      // Extract function call from input (e.g., "print(density(10, 5))")
      const funcMatch = testCase.input?.match(/print\((\w+)\((.*)\)\)/);
      if (!funcMatch) {
        results.push({
          input: testCase.input || "",
          output: "Error: Invalid test case format",
          expected: testCase.output,
          passed: false
        });
        continue;
      }

      const funcName = funcMatch[1];
      const argsStr = funcMatch[2];
      const args = argsStr.split(',').map(a => parseFloat(a.trim()));

      let output = "";

      // Extract function from code and evaluate
      const funcDefMatch = code.match(new RegExp(`def\\s+${funcName}\\s*\\([^)]*\\)\\s*:\\s*([\\s\\S]*?)(?=def\\s|$)`));
      
      if (funcDefMatch) {
        const funcBody = funcDefMatch[1];
        
        // Parse return statement
        const returnMatch = funcBody.match(/return\s+(.+)/);
        if (returnMatch) {
          const expression = returnMatch[1].trim();
          
          // Extract parameter names
          const paramMatch = code.match(new RegExp(`def\\s+${funcName}\\s*\\(([^)]*)\\)`));
          const params = paramMatch ? paramMatch[1].split(',').map(p => p.trim()) : [];
          
          // Create variable mapping
          const vars: Record<string, number> = {};
          params.forEach((param, i) => {
            vars[param] = args[i];
          });
          
          // Evaluate expression
          let evalExpr = expression;
          for (const [name, value] of Object.entries(vars)) {
            evalExpr = evalExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), String(value));
          }
          
          // Handle ** operator (power)
          evalExpr = evalExpr.replace(/(\d+(?:\.\d+)?)\s*\*\*\s*(\d+(?:\.\d+)?)/g, (_, base, exp) => {
            return String(Math.pow(parseFloat(base), parseFloat(exp)));
          });
          
          try {
            // Safe evaluation of mathematical expression
            const result = Function(`"use strict"; return (${evalExpr})`)();
            // Format output to match expected (ensure decimals are preserved)
            if (typeof result === 'number') {
              // Check if it's a whole number - still output as float for consistency
              output = Number.isInteger(result) ? `${result}.0` : String(result);
            } else {
              output = String(result);
            }
          } catch {
            output = "None";
          }
        } else {
          output = "None";
        }
      } else {
        output = "Error: Function not found";
      }

      // Normalize numeric comparison (2 == 2.0, etc.)
      let passed = output === testCase.output;
      if (!passed) {
        const numOutput = parseFloat(output);
        const numExpected = parseFloat(testCase.output);
        if (!isNaN(numOutput) && !isNaN(numExpected)) {
          passed = Math.abs(numOutput - numExpected) < 0.0001;
        }
      }
      results.push({
        input: testCase.input || "",
        output,
        expected: testCase.output,
        passed
      });
    } catch (error) {
      results.push({
        input: testCase.input || "",
        output: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        expected: testCase.output,
        passed: false
      });
    }
  }

  return {
    success: true,
    results
  };
}

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  // Validate code for dangerous patterns
  if (!validateCode(code)) {
    return { error: "كود غير آمن - تم رفض التنفيذ" };
  }

  // Check supported languages
  if (!["python", "javascript"].includes(language)) {
    return { error: "اللغة غير مدعومة" };
  }

  // Use local execution for now (safer and doesn't require external API)
  if (language === "python") {
    return executePythonLocally(code, testCases);
  }

  return { error: "اللغة غير مدعومة حالياً" };
}

// Export for use with Replit API if available
export async function executeCodeWithReplitAPI(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const apiKey = process.env.REPLIT_API_KEY;
  const projectId = process.env.REPLIT_PROJECT_ID;

  if (!apiKey || !projectId) {
    // Fallback to local execution
    return executeCode(code, language, testCases);
  }

  if (!validateCode(code)) {
    return { error: "كود غير آمن - تم رفض التنفيذ" };
  }

  const results: { input: string; output: string; expected: string; passed: boolean }[] = [];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`https://api.replit.com/v0/projects/${projectId}/eval`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language,
          code,
          stdin: testCase.input || "",
          args: [],
          timeout: 10,
          memory_limit: 128
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const output = (data.output || "").trim();
      const passed = output === testCase.output.trim();

      results.push({
        input: testCase.input || "",
        output,
        expected: testCase.output,
        passed
      });
    } catch (error) {
      return { error: `فشل التنفيذ: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  }

  return { success: true, results };
}
