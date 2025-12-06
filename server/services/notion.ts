import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
    const response = await (notion as any).databases.query({
      database_id: databaseId,
    });

    const problems: NotionProblem[] = [];

    for (const page of response.results as any[]) {
      const props = page.properties;
      
      const title = props.Title?.title?.[0]?.plain_text || 
                    props.Name?.title?.[0]?.plain_text || 
                    props.title?.title?.[0]?.plain_text || "";
      
      const description = props.Description?.rich_text?.[0]?.plain_text || 
                          props.description?.rich_text?.[0]?.plain_text || "";
      
      const difficulty = props.Difficulty?.select?.name || 
                         props.difficulty?.select?.name || "easy";
      
      const functionName = props.FunctionName?.rich_text?.[0]?.plain_text || 
                           props.function_name?.rich_text?.[0]?.plain_text || "";
      
      let testCases: { input: string; output: string }[] = [];
      const testCasesRaw = props.TestCases?.rich_text?.[0]?.plain_text || 
                           props.test_cases?.rich_text?.[0]?.plain_text || "";
      
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
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "Student": {
          title: [{ text: { content: data.studentName } }],
        },
        "Problem": {
          rich_text: [{ text: { content: data.problemTitle } }],
        },
        "Score": {
          number: data.score,
        },
        "Passed": {
          checkbox: data.passed,
        },
        "Feedback": {
          rich_text: [{ text: { content: data.feedback } }],
        },
        "Date": {
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
    testCases: { input: string; output: string }[];
  }
): Promise<boolean> {
  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "Title": {
          title: [{ text: { content: problem.title } }],
        },
        "Description": {
          rich_text: [{ text: { content: problem.description } }],
        },
        "Difficulty": {
          select: { name: problem.difficulty },
        },
        "FunctionName": {
          rich_text: [{ text: { content: problem.functionName } }],
        },
        "TestCases": {
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

export async function testNotionConnection(): Promise<boolean> {
  try {
    await notion.users.me({});
    return true;
  } catch (error) {
    console.error("Notion connection test failed:", error);
    return false;
  }
}
