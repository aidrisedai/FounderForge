import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DETAIL_WINDOW = 5;

export const ROLE_CONFIG = {
  marketing:   { roleName: "Head of Marketing",        expertName: "Alex",   color: "#8B5CF6", icon: "📣" },
  sales:       { roleName: "Head of Sales",            expertName: "Jordan", color: "#0066CC", icon: "💼" },
  engineering: { roleName: "CTO / Head of Engineering", expertName: "Priya",  color: "#06B6D4", icon: "⚙️" },
  design:      { roleName: "Head of Design",           expertName: "Maya",   color: "#EC4899", icon: "🎨" },
  finance:     { roleName: "CFO / Finance Lead",       expertName: "Chris",  color: "#F59E0B", icon: "📊" },
  ops:         { roleName: "COO / Head of Operations", expertName: "Sam",    color: "#10B981", icon: "⚡" },
  growth:      { roleName: "Head of Growth",           expertName: "Riley",  color: "#F97316", icon: "📈" },
  custom:      { roleName: "Custom Expert",            expertName: "Your Expert", color: "#6B7280", icon: "🤝" },
};

function getPersona(role, roleName) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.custom;
  const effectiveName = config.expertName;
  const effectiveRole = roleName || config.roleName;
  return `You are ${effectiveName}, an elite ${effectiveRole} with 15+ years of experience scaling startups from zero to exit. You have been hired as a fractional ${effectiveRole} to execute a specific goal. You are direct, tactical, and entirely focused on the deliverable. You don't do strategy theater — you ship work, run experiments, and hit metrics. Every day you give the founder a precise set of tasks they can execute TODAY. No vague advice. No "think about X." Only concrete, specific actions.`;
}

function parseJSON(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function generateSprintSkeleton({ role, roleName, goal, timeline, startupContext }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.custom;
  const effectiveRole = roleName || config.roleName;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: getPersona(role, roleName),
    messages: [{
      role: "user",
      content: `Build a ${timeline}-day execution plan for this goal.

ROLE: ${effectiveRole}
GOAL: ${goal}
STARTUP CONTEXT: ${startupContext || "Early-stage startup"}
TIMELINE: ${timeline} days

Respond ONLY with valid JSON:
{
  "phases": [
    { "name": "short phase name", "dayStart": 1, "dayEnd": ${Math.ceil(timeline / 3)}, "milestone": "concrete proof this phase is done" }
  ],
  "days": [
    { "day": 1, "theme": "3-5 word theme", "objective": "one specific sentence on what to accomplish today" }
  ]
}

Rules:
- 2 to 4 phases covering days 1 through ${timeline} with no gaps.
- "days" array MUST have exactly ${timeline} entries, day 1 through ${timeline}.
- Early: research, setup, quick wins. Middle: execution and iteration. Late: optimize and lock in results.
- Every objective is a concrete ACTION this ${effectiveRole} takes — specific, measurable, tied to the goal.
- Think like a practitioner. Real work, not planning work.`,
    }],
  });

  const data = parseJSON(msg.content[0].text.trim());
  const byDay = {};
  for (const d of data.days || []) byDay[d.day] = d;
  const phases = data.phases || [];

  const days = [];
  for (let day = 1; day <= timeline; day++) {
    const ph = phases.find((p) => day >= p.dayStart && day <= p.dayEnd) || phases[phases.length - 1];
    days.push(byDay[day]
      ? { day, theme: byDay[day].theme, objective: byDay[day].objective }
      : { day, theme: ph?.name || "Execute", objective: `Continue executing your ${effectiveRole} tasks toward the goal.` });
  }

  return { phases, days };
}

export async function generateSprintDetail({ sprint, windowDays, recentReports }) {
  const config = ROLE_CONFIG[sprint.role] || ROLE_CONFIG.custom;
  const roleName = sprint.roleName || config.roleName;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: getPersona(sprint.role, sprint.roleName),
    messages: [{
      role: "user",
      content: `Add concrete tasks and a coaching note to each day in this ${sprint.timeline}-day sprint.

GOAL: ${sprint.goal}
STARTUP CONTEXT: ${sprint.startupContext || "Early-stage startup"}
ROLE: ${roleName}
${recentReports.length ? `RECENT REPORTS:\n${JSON.stringify(recentReports)}` : ""}

DAYS TO DETAIL:
${windowDays.map((d) => `Day ${d.dayNumber}: ${d.theme} — ${d.objective}`).join("\n")}

Respond ONLY with valid JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "tasks": [{ "text": "concrete action (write X, contact Y, build Z)", "done": false }],
      "expertNote": "one-sentence tactical coaching note in first person",
      "rationale": "one sentence on why this matters right now"
    }
  ]
}

Rules:
- 3 to 5 tasks per day. Tasks are ACTIONS — "Write 3 cold email templates targeting CTOs" not "Work on email."
- expertNote is direct and tactical: "I'd start with warm leads — cold outreach needs volume to work."
- All tasks must be something a ${roleName} would actually do.`,
    }],
  });

  return parseJSON(msg.content[0].text.trim());
}

export async function applySprintDetail(sprintId, detail) {
  await Promise.all(
    (detail.days || []).map((d) =>
      prisma.expertSprintDay.updateMany({
        where: { sprintId, dayNumber: d.dayNumber },
        data: {
          tasks: (d.tasks || []).map((t) => ({ text: t.text, done: false })),
          expertNote: d.expertNote || null,
          rationale: d.rationale || null,
          detailed: true,
        },
      })
    )
  );
}

export async function generateCheckinFeedback({ sprint, day, report }) {
  const config = ROLE_CONFIG[sprint.role] || ROLE_CONFIG.custom;
  const roleName = sprint.roleName || config.roleName;
  const expertName = sprint.expertName || config.expertName;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: getPersona(sprint.role, sprint.roleName),
    messages: [{
      role: "user",
      content: `A founder reported Day ${day.dayNumber} progress.

GOAL: ${sprint.goal}
TODAY'S THEME: ${day.theme}
TODAY'S OBJECTIVE: ${day.objective}

THEIR REPORT:
Summary: ${report.summary}
${report.blockers ? `Blockers: ${report.blockers}` : ""}
${report.metric ? `Metric update: ${report.metric}` : ""}
Mood: ${report.mood || "not reported"}

As ${expertName} (${roleName}), write 2-3 sentences of tactical feedback. Acknowledge what moved the needle, call out the single most important thing for tomorrow. Be specific, not encouraging. No fluff.`,
    }],
  });

  return msg.content[0].text.trim();
}
