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
| **Focus Quality** | [High/Mid/Low] | [1 sentence HPA ratio comment] |
| **Operational Drag** | [Low/High] | [1 sentence on inhibitors] |

---

2️⃣ MONTHLY CAPACITY DIAGNOSIS
| Category | Growth Hours (HPA) | Core Hours (CTA) | Admin/Drag (LPA) | Total Output |
| :--- | :--- | :--- | :--- | :--- |
| **Allocation** | Xh | Xh | Xh | Xh |
| **% Mix** | X% | X% | X% | 100% |

> [!NOTE]
> Insight: [Exactly one punchy sentence about the time mix]

---

3️⃣ TASK EFFICIENCY & PLANNING PRECISION
| Top 5 Critical Tasks | Actual Time | Planning Delta | Operator Verdict |
| :--- | :--- | :--- | :--- |
| [Task] | Xh | [+/- Xh] | [Delegate/Optimize/Keep] |

**Planning Compliance Score:** [0-100%]
*Insight:* [1 sentence on where estimation logic is failing]

---

4️⃣ INHIBITOR CLUSTERING (MISSED & BLOCKERS)
| Category | Instances | Root Cause | Structural Risk |
| :--- | :--- | :--- | :--- |
| [Task/Missed] | [count] | [1 sentence cause] | [Low/Mid/High] |

---

5️⃣ STRATEGIC CALLOUTS 🚨
- **[Callout 1]:** [Max 15 words]
- **[Callout 2]:** [Max 15 words]

---

6️⃣ HIGH-IMPACT LEVERS (TOP 3 ONLY)
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
