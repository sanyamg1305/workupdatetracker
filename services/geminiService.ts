import { GoogleGenerativeAI } from "@google/generative-ai";
import { DailyWorkUpdate } from "../types";

// User provided API Key via environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateMonthlyReport = async (updates: DailyWorkUpdate[], userName: string, month: string) => {
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
      category: t.category
    })),
    missed: u.missedTasks.map(m => ({ description: m.description, reason: m.reason })),
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
Follow this exact order. Use Markdown headers (##, ###) and Tables where specified.

1️⃣ EXECUTIVE SUMMARY
Tell the founder what matters most in a concise grid or bullet list.
- Primary Time Sink: [Task Name]
- Resource Alignment: [Healthy/Concerning]
- Operational Drag: [Low/Medium/High]
- Productivity Trend: [Improving/Stable/Declining]
- Top Recommendation: [One sentence]

2️⃣ TIME ALLOCATION BREAKDOWN
Use a Markdown table to visualize allocation.
| Category | Hours | % of Month | Pulse/Signal |
| :--- | :--- | :--- | :--- |
| HPA (High Priority) | Xh | X% | [Specific comment] |
| CTA (Core Task) | Xh | X% | [Specific comment] |
| LPA (Low Priority) | Xh | X% | [Direct feedback] |

Flag imbalances aggressively. Do NOT stay neutral.

3️⃣ TOP 5 TIME-CONSUMING TASKS
Use a Markdown table.
| Normalized Task | Hours | Operator Signal |
| :--- | :--- | :--- |
| [Task Name] | Xh | [Candidate for delegation/automation/keep] |

For EACH task, provide a brief bullet on Risk if continued.

4️⃣ PRODUCTIVITY INTELLIGENCE
Look for patterns (e.g., productivity drop on LPA-heavy days).
Use bold text for key insights.
- **Correlation:** [e.g., High LPA days lead to 15% lower scores]
- **Blocker Impact:** [Analysis of how blockers affected output]

5️⃣ RECURRING MISSED TASKS & BLOCKERS
Identify clusters and patterns using bullets. Identify if blockers are structural, leadership, or tool-related.

6️⃣ CAPACITY DIAGNOSIS 📊
State clearly if this person is: **Underutilized, Optimally utilized, Overloaded, or Misallocated**.
Explain WHY with specific data points.

7️⃣ RISK FLAGS 🚨
Call out operational dangers (Admin creep, Strategy starvation, Execution bottlenecks).
Be direct. Do not soften language.

8️⃣ HIGH-IMPACT RECOMMENDATIONS (Max 5)
Must be specific and operator-level.
Example: *Automate lead cleanup — currently consuming 11% of monthly capacity.*

OUTPUT TONE
Concise. Intelligent. Hard-hitting. Use emojis sparingly for visual cues (e.g., 🚨, 📊, ✅, ⚠️).
Clarity > Politeness.
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
