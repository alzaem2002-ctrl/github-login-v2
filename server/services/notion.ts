import { Client } from "@notionhq/client";

function getNotionClient(): Client {
  if (!process.env.NOTION_API_KEY) {
    throw new Error("NOTION_API_KEY is not configured");
  }
  return new Client({ auth: process.env.NOTION_API_KEY });
}

export interface NotionProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  functionName: string;
  testCases: { input: string; output: string }[];
}

export async function getNotionDatabases(): Promise<{ id: string; title: string }[]> {
  try {
    const notion = getNotionClient();
    const response = await notion.search({
      filter: { property: "object", value: "database" as any },
    });

    return response.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled",
    }));
  } catch (error) {
    console.error("Notion search error:", error);
    return [];
  }
}

export async function syncProblemsFromNotion(databaseId: string): Promise<NotionProblem[]> {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error("NOTION_API_KEY is not configured");
    }

    // Clean API key from any invisible/RTL characters (U+200F is RTL mark often added in Arabic environments)
    const cleanApiKey = apiKey.replace(/[^\x00-\x7F]/g, '').trim();

    // Use direct API call since SDK v5 removed databases.query
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Notion API error:", errorData);
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    const problems: NotionProblem[] = [];

    for (const page of data.results as any[]) {
      const props = page.properties;
      
      // Support both Arabic and English property names
      const title = props["الاسم"]?.title?.[0]?.plain_text || 
                    props.Title?.title?.[0]?.plain_text || 
                    props.Name?.title?.[0]?.plain_text || "";
      
      const description = props["الوصف"]?.rich_text?.[0]?.plain_text || 
                          props.Description?.rich_text?.[0]?.plain_text || "";
      
      const difficulty = props["الصعوبة"]?.select?.name || 
                         props.Difficulty?.select?.name || "easy";
      
      const functionName = props["الدالة"]?.rich_text?.[0]?.plain_text || 
                           props.FunctionName?.rich_text?.[0]?.plain_text || "";
      
      let testCases: { input: string; output: string }[] = [];
      const testCasesRaw = props["الاختبارات"]?.rich_text?.[0]?.plain_text || 
                           props.TestCases?.rich_text?.[0]?.plain_text || "";
      
      if (testCasesRaw) {
        try {
          testCases = JSON.parse(testCasesRaw);
        } catch {
          testCases = [];
        }
      }

      if (title && functionName) {
        problems.push({
          id: page.id,
          title,
          description,
          difficulty,
          functionName,
          testCases,
        });
      }
    }

    return problems;
  } catch (error) {
    console.error("Notion sync error:", error);
    return [];
  }
}

export async function saveSubmissionToNotion(
  databaseId: string,
  data: {
    studentName: string;
    problemTitle: string;
    code: string;
    score: number;
    passed: boolean;
    feedback: string;
  }
): Promise<boolean> {
  try {
    const notion = getNotionClient();
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "الطالب": {
          title: [{ text: { content: data.studentName } }],
        },
        "المسألة": {
          rich_text: [{ text: { content: data.problemTitle } }],
        },
        "الدرجة": {
          number: data.score,
        },
        "نجح": {
          checkbox: data.passed,
        },
        "التعليق": {
          rich_text: [{ text: { content: data.feedback } }],
        },
        "التاريخ": {
          date: { start: new Date().toISOString().split("T")[0] },
        },
      },
      children: [
        {
          object: "block",
          type: "code",
          code: {
            language: "python",
            rich_text: [{ type: "text", text: { content: data.code } }],
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Notion save error:", error);
    return false;
  }
}

export async function createProblemInNotion(
  databaseId: string,
  problem: {
    title: string;
    description: string;
    difficulty: string;
    functionName: string;
    language?: string;
    testCases: { input: string; output: string }[];
  }
): Promise<boolean> {
  try {
    const notion = getNotionClient();
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "الاسم": {
          title: [{ text: { content: problem.title } }],
        },
        "الوصف": {
          rich_text: [{ text: { content: problem.description } }],
        },
        "الصعوبة": {
          select: { name: problem.difficulty },
        },
        "اللغة": {
          select: { name: problem.language || "python" },
        },
        "الدالة": {
          rich_text: [{ text: { content: problem.functionName } }],
        },
        "الحالة": {
          status: { name: "نشط" },
        },
        "الاختبارات": {
          rich_text: [{ text: { content: JSON.stringify(problem.testCases) } }],
        },
      },
    });
    return true;
  } catch (error) {
    console.error("Notion create problem error:", error);
    return false;
  }
}

// Sync assignment to Notion (similar to Python NotionService)
export async function syncAssignment(
  databaseId: string,
  assignmentData: {
    title: string;
    description: string;
    language: string;
  }
): Promise<string | null> {
  try {
    const notion = getNotionClient();
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "الاسم": {
          title: [{ text: { content: assignmentData.title } }],
        },
        "الوصف": {
          rich_text: [{ text: { content: assignmentData.description } }],
        },
        "اللغة": {
          select: { name: assignmentData.language },
        },
        "الحالة": {
          status: { name: "نشط" },
        },
      },
    });
    return response.id;
  } catch (error) {
    console.error("Notion sync assignment error:", error);
    return null;
  }
}

export async function testNotionConnection(): Promise<boolean> {
  try {
    const notion = getNotionClient();
    await notion.users.me({});
    return true;
  } catch (error) {
    console.error("Notion connection test failed:", error);
    return false;
  }
}
