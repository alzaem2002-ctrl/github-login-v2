import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CodeEvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  hints: string[];
  errorExplanation?: string;
}

export async function evaluateStudentCode(
  code: string,
  problemTitle: string,
  problemDescription: string,
  expectedFunction: string,
  testCases: { input: string; output: string }[]
): Promise<CodeEvaluationResult> {
  const prompt = `أنت معلم علوم يقوم بتصحيح كود Python لطالب.

المسألة: ${problemTitle}
الوصف: ${problemDescription}
الدالة المطلوبة: ${expectedFunction}

حالات الاختبار:
${testCases.map((tc, i) => `${i + 1}. المدخل: ${tc.input} -> المخرج المتوقع: ${tc.output}`).join('\n')}

كود الطالب:
\`\`\`python
${code}
\`\`\`

قم بتحليل الكود وأعطني:
1. هل الكود صحيح؟ (true/false)
2. الدرجة من 100
3. تعليق تشجيعي للطالب بالعربية
4. تلميحات للتحسين (إذا كان هناك أخطاء)
5. شرح الأخطاء إن وجدت

أجب بصيغة JSON فقط:
{
  "isCorrect": boolean,
  "score": number,
  "feedback": "string",
  "hints": ["string"],
  "errorExplanation": "string or null"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    
    return {
      isCorrect: false,
      score: 0,
      feedback: "حدث خطأ في تقييم الكود",
      hints: [],
    };
  } catch (error) {
    console.error("Gemini evaluation error:", error);
    return {
      isCorrect: false,
      score: 0,
      feedback: "حدث خطأ في الاتصال بالذكاء الاصطناعي",
      hints: [],
    };
  }
}

export async function generateHint(
  code: string,
  problemTitle: string,
  problemDescription: string
): Promise<string> {
  const prompt = `أنت معلم علوم مساعد. طالب يحتاج مساعدة في حل هذه المسألة:

المسألة: ${problemTitle}
الوصف: ${problemDescription}

محاولة الطالب:
\`\`\`python
${code}
\`\`\`

أعطِ الطالب تلميحاً واحداً مفيداً بالعربية بدون إعطاء الحل الكامل. كن مشجعاً ولطيفاً.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "جرب مراجعة الصيغة الرياضية المطلوبة";
  } catch (error) {
    console.error("Gemini hint error:", error);
    return "جرب التفكير في الخطوات الرياضية المطلوبة لحل المسألة";
  }
}

export async function generateProblem(topic: string, difficulty: string): Promise<{
  title: string;
  description: string;
  functionName: string;
  testCases: { input: string; output: string }[];
}> {
  const prompt = `أنشئ مسألة برمجة Python جديدة في موضوع "${topic}" بمستوى صعوبة "${difficulty}".

المسألة يجب أن تكون:
- متعلقة بالعلوم (فيزياء، كيمياء، أحياء)
- مناسبة لطلاب المرحلة الثانوية
- تتطلب كتابة دالة Python بسيطة

أجب بصيغة JSON:
{
  "title": "عنوان المسألة بالعربية",
  "description": "وصف تفصيلي للمسألة بالعربية مع الصيغة الرياضية",
  "functionName": "اسم الدالة بالإنجليزية",
  "testCases": [
    {"input": "print(function_name(args))", "output": "expected_output"},
    {"input": "print(function_name(args))", "output": "expected_output"}
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    
    throw new Error("Empty response");
  } catch (error) {
    console.error("Gemini problem generation error:", error);
    throw new Error("فشل في توليد مسألة جديدة");
  }
}
