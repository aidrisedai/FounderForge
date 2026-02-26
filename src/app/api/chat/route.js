import { getServerSession } from "next-auth";
import { CURRICULUM } from "@/lib/curriculum";
import { logUserActivity } from "@/lib/admin-storage";

export async function POST(req) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, stepId, taskIdx, project } = await req.json();

  const step = CURRICULUM.find(s => s.id === stepId);
  if (!step) return Response.json({ error: "Invalid step" }, { status: 400 });

  const task = step.tasks[taskIdx];
  if (!task) return Response.json({ error: "Invalid task" }, { status: 400 });

  // Build system prompt with full context
  const dels = project?.deliverables || {};
  const allDel = Object.entries(dels).map(([id, d]) => {
    const s = CURRICULUM.find(s => s.tasks.some(t => t.id === id));
    const t = s ? s.tasks.find(t => t.id === id) : null;
    return t ? `[${s.title} → ${t.title}]: ${d}` : null;
  }).filter(Boolean).join("\n\n");

  const existingDel = dels[task.id];

  const systemPrompt = `You are a world-class startup mentor — think Paul Graham meets a demanding but caring professor.

PERSONALITY: Direct, warm, punchy. 2-4 paragraphs MAX. Real examples. Push back on vague. Celebrate breakthroughs. ONE question at a time.

PROJECT: "${project?.name || "Untitled"}"
User: ${session.user.name || session.user.email}
POSITION: Step ${step.id}/6 "${step.title}" → Task ${taskIdx + 1}/${step.tasks.length} "${task.title}"

━━━ CURRICULUM ━━━
Step overview: ${step.overview}
Learning goal: ${task.goal}
Required output: ${task.output}
Quality criteria: ${task.criteria}
Evaluation guide: ${task.eval}

━━━ FOUNDER'S JOURNEY SO FAR ━━━
${allDel || "(No deliverables yet)"}

${existingDel ? `━━━ EXISTING DELIVERABLE (revisiting) ━━━\n${existingDel}` : ""}

━━━ RULES ━━━
1. First message with no conversation → deliver this intro: ${task.intro}
2. After response → evaluate against output + criteria.
3. Incomplete → name good + missing.
4. Vague → push for specifics.
5. Off-topic → redirect: "Let's focus. I need: ${task.output}"
6. COMPLETE → praise + deliverable + completion tag.
7. Reference previous deliverables when relevant.
8. CONCISE. 2-4 paragraphs.

COMPLETION FORMAT (ONLY when all criteria met):
[DELIVERABLE_START]
(2-4 sentence summary of their work)
[DELIVERABLE_END]
[TASK_COMPLETE]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    
    // Log user activity for admin tracking
    const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    await logUserActivity(userId, project?.id, {
      type: 'message',
      stage: stepId,
      task: task.id,
      taskTitle: task.title,
      projectName: project?.name,
      messageCount: messages.length,
      hasDeliverable: data.content?.[0]?.text?.includes('[DELIVERABLE_START]'),
      isComplete: data.content?.[0]?.text?.includes('[TASK_COMPLETE]')
    });
    
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "API call failed" }, { status: 500 });
  }
}
