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
      projectTaskId: t.projectTaskId,
      isScheduled: t.isScheduled,
      estimatedTime: t.estimatedTimeAtLogDate,
      variance: t.variance,
      statusAtSubmission: t.statusAtSubmission
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
You are a "Visual Intelligence Specialist" AI.
Your ONLY goal is to produce a high-impact, visual-first executive dashboard.
NO LONG PARAGRAPHS. NO FLUFF. NO GENERIC ADVICE.

CORE DIRECTIVE: VISUALS OVER TEXT
1. MANDATORY TABLES: Use Markdown tables for ANY data comparison or list.
2. STRICT LIMITS: Max 1 sentence per insight.
3. CLEAR SEPARATION: Use horizontal rules (---) between ALL major sections.
4. PREMIUM FORMATTING: Use bolding for impact. Use emojis sparingly but effectively.

INPUT DATA:
- Period: ${month}
- Team Member: ${userName}
- Raw Data: ${JSON.stringify(dataSummary)}
- Reference Tasks: ${JSON.stringify(projectTasksReference)}

---

1️⃣ EXECUTIVE SUMMARY (KPIS)
| Metric | Status | Primary Insight |
| :--- | :--- | :--- |
| **Main Time Sink** | [Task Name] | [1 sentence on impact] |
| **Capacity Type** | [Under/Optimal/Over] | [1 sentence evidence] |
| **Operational Drag** | [Low/High] | [1 sentence on inhibitors] |

---

2️⃣ PLANNED VS ACTUAL WORKLOAD
| Metric | Hours | Insight |
| :--- | :--- | :--- |
| **Scheduled Hours** | Xh | [1 sentence variance implication] |
| **Actual Logged** | Xh | [1 sentence on output] |
| **Overall Variance** | +/- Xh | [1 sentence on planning reality] |

---

3️⃣ ESTIMATION ACCURACY
| Category | Performance | Types / Patterns |
| :--- | :--- | :--- |
| **Best Estimated** | [Accurate/Spot-on] | [Task types consistently accurate] |
| **Worst Estimated** | [Under/Over] | [Task types frequently delayed] |

*Trend:* [1 sentence on whether estimation discipline is improving]

---

4️⃣ UNPLANNED WORK BURDEN
| Metric | Value | Operational Interpretation |
| :--- | :--- | :--- |
| **Hours on Manual/Unplanned** | Xh | [1 sentence on strategic disruption] |
| **% of Total Time** | X% | [Is reactive work eating strategic work?] |

---

5️⃣ COLLABORATION LOAD
| Metric | Stat | Implication |
| :--- | :--- | :--- |
| **Multi-Assignee Tasks** | [Count] | [1 sentence overview] |
| **Collaboration Time** | Xh | [Is collaboration creating efficiency or bloated confusion?] |

---

6️⃣ INHIBITOR CLUSTERING (MISSED & BLOCKERS)
| Category | Instances | Root Cause | Structural Risk |
| :--- | :--- | :--- | :--- |
| [Task/Missed] | [count] | [1 sentence cause] | [Low/Mid/High] |

---

7️⃣ HIGH-IMPACT LEVERS (TOP 3 ONLY)
1. **[Action]**: [Expected Outcome - Max 20 words]
2. **[Action]**: [Expected Outcome - Max 20 words]
3. **[Action]**: [Expected Outcome - Max 20 words]

---

TONE: Brutally honest, data-centric, high-agency.
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
