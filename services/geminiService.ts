import { GoogleGenerativeAI } from "@google/generative-ai";
import { DailyWorkUpdate, ProjectTask } from "../types";

// User provided API Key via environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateMonthlyReport = async (updates: DailyWorkUpdate[], userName: string, month: string, projectTasksReference: ProjectTask[] = []) => {
  if (!API_KEY) {
    console.error("Missing VITE_GEMINI_API_KEY in environment variables");
    throw new Error("Missing Gemini API Key. Please check your environment configuration.");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const dataSummary = updates.map(u => ({
    date: u.date,
    productivity: u.productivityScore,
    totalTime: u.totalTime,
    tasks: u.tasks.map(t => ({
      description: t.description,
      time: t.timeSpent,
      category: t.category,
      projectTaskId: t.projectTaskId
    })),
    missed: u.missedTasks.map(m => ({
      description: m.description,
      reason: m.reason,
      projectTaskId: m.projectTaskId
    })),
    blockers: u.blockers.map(b => ({ description: b.description, reason: b.reason }))
  }));

  const prompt = `
ROLE
You are an elite operations analyst AI.
Your job is to analyze structured work log data and produce a founder-level operational intelligence report, not a descriptive summary.
Avoid fluff or generic productivity advice.
Be sharp, analytical, and decisive.
Write like a Chief of Staff briefing a founder.

PRIMARY OBJECTIVE
Turn raw work updates into decision-support insight.
The founder should be able to read this report in under 3 minutes and immediately understand:
- Where time is going
- What is wasting capacity
- What is driving impact
- Where intervention is needed

INPUT DATA
You will receive a month of daily work updates containing:
Tasks, Time spent, Task category (HPA, CTA, LPA), Missed tasks + reasons, Blockers + reasons, Productivity scores

TARGET USER: ${userName}
PERIOD: ${month}
DATA: ${JSON.stringify(dataSummary, null, 2)}
PROJECT_TASKS_REFERENCE: ${JSON.stringify(projectTasksReference, null, 2)}

⚠️ CRITICAL STEP — TASK NORMALIZATION
Before ANY analysis:
You MUST semantically group similar tasks.
Users may write the same task differently.
Normalization Rules:
- Group by intent, not wording.
- Merge synonyms automatically.
- Create a clean normalized task label.
- Do this FIRST internally to inform the analysis.

REPORT STRUCTURE (MANDATORY)
Follow this exact order. Use Markdown headers (##, ###) and **FULLY FORMATTED MARKDOWN TABLES** for sections 2 and 3.

1️⃣ EXECUTIVE SUMMARY
Provide a concise intelligence grid using a bullet list.
- **Primary Time Sink:** [Task Name]
- **Resource Alignment:** [Healthy/Concerning]
- **Operational Drag:** [Low/Medium/High]
- **Productivity Trend:** [Improving/Stable/Declining]
- **Top Recommendation:** [One sentence, high-impact]

2️⃣ TIME ALLOCATION BREAKDOWN
You MUST use a Markdown table. This is non-negotiable.
| Category | Hours | % of Month | Pulse/Signal |
| :--- | :--- | :--- | :--- |
| HPA (High Priority) | Xh | X% | [Specific comment] |
| CTA (Core Task) | Xh | X% | [Specific comment] |
| LPA (Low Priority) | Xh | X% | [Direct feedback] |

3️⃣ TOP 5 TIME-CONSUMING TASKS
You MUST use a Markdown table.
| Normalized Task | Hours | Operator Signal |
| :--- | :--- | :--- |
| [Task Name] | Xh | [Candidate for delegation/automation/keep] |

For EACH task, provide a brief bullet on **Risk** if continued in current form.

3.5️⃣ EFFICIENCY DELTA & ESTIMATE ACCURACY 📉
Analyze the projectTasks and compare estimates to actuals.
- Identify tasks where the user consistently over-estimates or under-estimates.
- Highlight specific project tasks that blew past estimates.
- Provide a "Planning Compliance Score" (0-100%).

4️⃣ PRODUCTIVITY INTELLIGENCE
Look for patterns and correlations.
- **Correlation:** [Analysis]
- **Blocker Impact:** [Analysis]

5️⃣ RECURRING MISSED TASKS & BLOCKERS
Cluster inhibitors into structural, leadership, or tool-related issues.

6️⃣ CAPACITY DIAGNOSIS 📊
State clearly: **Underutilized, Optimally utilized, Overloaded, or Misallocated**.

7️⃣ RISK FLAGS 🚨
Direct, unvarnished callouts of operational dangers.

8️⃣ HIGH-IMPACT RECOMMENDATIONS (Max 5)

OUTPUT TONE
Sharp. Decisive. Premium. Use bolding for emphasis. Ensure tables are perfectly formatted with header separators.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Report Error:", error);
    throw new Error(`Failed to generate AI report: ${error.message || error}`);
  }
};
