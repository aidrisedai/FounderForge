import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { MIN_DURATION, MAX_DURATION, clampDuration, planMaxTokens } from "@/lib/ycConstants";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export { MIN_DURATION, MAX_DURATION, clampDuration };

// Michael Seibel coaching persona — the voice behind every plan and check-in.
export function seibelPersona(durationDays = 90) {
  return `You are Michael Seibel, Managing Director and Group Partner at Y Combinator, coaching a founder who has just been accepted into a YC batch. You co-founded Justin.tv/Twitch and Socialcam, and you have worked with thousands of YC startups.

Your coaching style is direct, tactical, warm but demanding. Your core beliefs:
- Launch now. Something shipped beats something perfect. Ship embarrassingly early.
- Talk to users EVERY day. The answers live with your customers, not in your head.
- Do things that don't scale to land your first customers.
- 10 users who LOVE you beat 1,000 who kind of like you.
- Focus relentlessly. Say no to anything that doesn't move your one key metric.
- Get to revenue fast. Charging money is the only real signal of value.
- Track week-over-week growth. 5-7%/week is good, 10%+ is exceptional.
- Avoid fake work: PR, conferences, awards, fundraising theater, premature hiring.
- Stay default alive. Always know your runway.

The founder has ${durationDays} days to reach a $1M annual revenue run-rate (about $83K MRR). Treat this like a real YC batch sprint: push hard, stay concrete, give them specific actions — never vague platitudes. Every task should be something a founder can actually DO that day.`;
}

function parseJSON(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(start, end + 1));
}

// Normalize a {phases, days} plan: days covers exactly 1..durationDays with no gaps,
// and phases tile 1..durationDays contiguously (the UI renders days only through
// phase ranges, so a gap between phases would hide real days from the founder).
export function normalizePlan(data, durationDays) {
  const byDay = {};
  for (const d of data.days || []) byDay[d.day] = d;
  const phases = (data.phases || [])
    .map((p) => ({
      ...p,
      dayStart: Math.max(1, Math.min(durationDays, p.dayStart || 1)),
      dayEnd: Math.max(1, Math.min(durationDays, p.dayEnd || durationDays)),
    }))
    .sort((a, b) => a.dayStart - b.dayStart);
  for (let i = 0; i < phases.length; i++) {
    phases[i].dayStart = i === 0 ? 1 : phases[i - 1].dayEnd + 1;
    phases[i].dayEnd = i === phases.length - 1
      ? durationDays
      : Math.min(durationDays, Math.max(phases[i].dayStart, phases[i].dayEnd));
  }
  const findPhase = (day) => phases.find((p) => day >= p.dayStart && day <= p.dayEnd) || phases[phases.length - 1];

  const days = [];
  for (let day = 1; day <= durationDays; day++) {
    if (byDay[day]) {
      days.push({ day, theme: byDay[day].theme || "Build & talk to users", objective: byDay[day].objective || "Make progress on the key metric and talk to a customer." });
    } else {
      const ph = findPhase(day);
      days.push({ day, theme: ph?.name || "Build & talk to users", objective: ph?.goal || "Make progress on the key metric and talk to a customer." });
    }
  }

  return { phases, days };
}

// Generate the full sprint skeleton: phases + a theme/objective for every single day.
export async function generateSkeleton({ startupName, oneLiner, stage, startingRevenue, durationDays = 90 }) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: planMaxTokens(durationDays),
    system: seibelPersona(durationDays),
    messages: [
      {
        role: "user",
        content: `Build a ${durationDays}-day plan to get this startup to a $1M revenue run-rate.

STARTUP: ${startupName}
WHAT IT IS: ${oneLiner}
STAGE: ${stage}
CURRENT MONTHLY REVENUE: $${startingRevenue}

Produce a complete arc. Respond ONLY with valid JSON in this exact shape:

{
  "phases": [
    { "name": "short phase name", "dayStart": 1, "dayEnd": ${Math.ceil(durationDays / 6)}, "goal": "what the founder must achieve in this phase", "milestone": "the concrete proof this phase is done" }
  ],
  "days": [
    { "day": 1, "theme": "3-5 word theme", "objective": "one specific sentence on what to accomplish today" }
  ]
}

Rules:
- ${durationDays <= 30 ? "3 to 5" : "5 to 7"} phases that together cover days 1 through ${durationDays} with no gaps.
- The "days" array MUST contain exactly ${durationDays} entries, day 1 through day ${durationDays}, in order.
- Early phase: talk to users, launch, first paying customers (do things that don't scale).
- Middle phase: find a repeatable acquisition + sales motion, tighten the product.
- Late phase: scale what works, push the growth rate toward the revenue goal.
- Each objective is concrete and action-oriented, not abstract. Tie to revenue/users/growth.
- Keep each theme and objective tight. This is a skeleton; daily detail comes later.`,
      },
    ],
  });

  return normalizePlan(parseJSON(msg.content[0].text.trim()), durationDays);
}

// Plan-review conversation: founder gives feedback on the draft plan, Seibel replies and
// (when the feedback calls for it) revises the skeleton — including changing the sprint
// length. Returns { reply, plan|null, durationDays|null }.
export async function refinePlan({ program, plan, chatHistory, userMessage }) {
  const durationDays = program.durationDays || 90;
  const phaseSummary = (plan.phases || [])
    .map((p) => `Days ${p.dayStart}-${p.dayEnd} — ${p.name}: ${p.goal} (milestone: ${p.milestone})`)
    .join("\n");
  const daySummary = (plan.days || [])
    .map((d) => `Day ${d.day}: [${d.theme}] ${d.objective}`)
    .join("\n");

  const history = (chatHistory || []).slice(-12).map((m) => ({ role: m.role, content: m.content }));

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: planMaxTokens(Math.max(durationDays, MAX_DURATION)),
    system: `${seibelPersona(durationDays)}

You are in PLAN REVIEW with the founder. They have not started Day 1 yet. Your draft ${durationDays}-day plan is below. The founder will push back, add context, or ask for changes — your job is to sharpen the plan WITH them until they're confident enough to start.

CURRENT DRAFT PLAN
Phases:
${phaseSummary}

Days:
${daySummary}

STARTUP: ${program.startupName} — ${program.oneLiner} (stage: ${program.stage}, starting revenue: $${program.startingRevenue}/mo)

Respond ONLY with valid JSON. (Earlier assistant turns in this conversation show only your prose replies — you must STILL answer with this JSON envelope every time.)
{
  "reply": "2-5 sentences in your direct voice. React to their input, explain what you changed and why (or push back if their request would hurt them).",
  "planChanged": true|false,
  "durationDays": ${durationDays},  // total sprint length; change it only if the founder asked to (${MIN_DURATION}-${MAX_DURATION})
  "phases": [...],  // FULL updated phases array — only if planChanged
  "days": [...]     // FULL updated days array, exactly durationDays entries — only if planChanged
}

Rules:
- If the founder's message is a question or context that doesn't require plan changes, set planChanged=false and omit phases/days.
- If you change the plan, return the COMPLETE phases and days arrays (same shape as the draft), not a diff. The days array length MUST equal durationDays.
- If the founder wants a shorter or longer sprint, set durationDays to the new length (${MIN_DURATION}-${MAX_DURATION}) and rebuild the full plan for it.
- If they only want phase-level changes (names, goals, milestones), you may return "phases" without "days".
- Don't be a pushover: if a request is fake work or avoids customers/revenue, say so and propose the sharper version.
- Keep themes/objectives tight and concrete.`,
    messages: [...history, { role: "user", content: userMessage }],
  });

  const data = parseJSON(msg.content[0].text.trim());
  const reply = data.reply || "Got it.";

  if (!data.planChanged) return { reply, plan: null, durationDays: null };

  const hasDays = Array.isArray(data.days) && data.days.length > 0;
  const hasPhases = Array.isArray(data.phases) && data.phases.length > 0;

  if (hasDays) {
    const declared = parseInt(data.durationDays, 10) || durationDays;
    // A days array that doesn't match the declared length means the output was
    // truncated or malformed — refuse it honestly instead of padding with filler.
    if (data.days.length !== declared || declared < MIN_DURATION || declared > MAX_DURATION) {
      return {
        reply: `${reply}\n\n(Heads up — my revision came out incomplete, so I kept the current plan. Ask me again and I'll redo it.)`,
        plan: null,
        durationDays: null,
      };
    }
    return {
      reply,
      plan: normalizePlan({ phases: hasPhases ? data.phases : plan.phases, days: data.days }, declared),
      durationDays: declared !== durationDays ? declared : null,
    };
  }

  if (hasPhases) {
    // Phase-only revision: keep the existing days, re-tile the new phases over them.
    return { reply, plan: normalizePlan({ phases: data.phases, days: plan.days }, durationDays), durationDays: null };
  }

  return { reply, plan: null, durationDays: null };
}

// Generate detailed tasks + a Seibel note for a window of days, factoring in recent reports.
export async function generateDetail({ program, windowDays, recentReports }) {
  const durationDays = program.durationDays || 90;
  const phaseSummary = (program.phases || [])
    .map((p) => `Days ${p.dayStart}-${p.dayEnd} — ${p.name}: ${p.goal}`)
    .join("\n");

  const windowSummary = windowDays
    .map((d) => `Day ${d.dayNumber}: [${d.theme}] ${d.objective}`)
    .join("\n");

  const reportsSummary = (recentReports || []).length
    ? recentReports
        .map((r) => `Day ${r.dayNumber} report — did: ${r.report?.summary || "(none)"}; blockers: ${r.report?.blockers || "none"}; revenue: $${r.report?.revenue ?? "?"}; users: ${r.report?.users ?? "?"}`)
        .join("\n")
    : "No reports yet — this is the start of the program.";

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: seibelPersona(durationDays),
    messages: [
      {
        role: "user",
        content: `Founder: ${program.startupName} — ${program.oneLiner} (stage: ${program.stage})

${durationDays}-DAY ARC:
${phaseSummary}

RECENT CHECK-INS:
${reportsSummary}

Now write detailed daily plans for these upcoming days:
${windowSummary}

Adapt to the recent check-ins: if they hit a blocker, address it; if something worked, double down; if they're behind on revenue, get more aggressive on sales. Respond ONLY with valid JSON:

{
  "days": [
    {
      "day": <number>,
      "theme": "you may refine the theme",
      "objective": "you may sharpen the objective",
      "tasks": [ { "text": "a specific action the founder can do today" } ],
      "partnerNote": "1-2 sentences in Michael Seibel's direct voice — coaching for this day",
      "rationale": "one sentence on why this matters right now"
    }
  ]
}

Rules:
- One entry per day listed above, same day numbers.
- 3 to 5 tasks per day. Each task is concrete and doable in a day.
- partnerNote sounds like Seibel: direct, tactical, a little demanding.
- Tie the day to revenue, users, or growth rate wherever possible.`,
      },
    ],
  });

  return parseJSON(msg.content[0].text.trim());
}

// Persist generated detail onto the matching YCDay rows, scoped to one program.
export async function applyDetail(programId, detail) {
  await Promise.all(
    (detail.days || []).map((d) => {
      const data = {
        tasks: (d.tasks || []).map((t) => ({ text: typeof t === "string" ? t : t.text, done: false })),
        partnerNote: d.partnerNote || null,
        rationale: d.rationale || null,
        detailed: true,
      };
      if (d.theme) data.theme = d.theme;
      if (d.objective) data.objective = d.objective;

      return prisma.yCDay
        .update({ where: { programId_dayNumber: { programId, dayNumber: d.day } }, data })
        .catch((e) => console.error(`Failed to update day ${d.day}:`, e.message));
    })
  );
}

// Rework a single day's plan based on the founder's live request ("I'm at a conference
// today", "double down on outreach", "I already shipped this"). Returns { reply, day }.
export async function adjustDay({ program, day, request }) {
  const durationDays = program.durationDays || 90;
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: seibelPersona(durationDays),
    messages: [
      {
        role: "user",
        content: `Founder: ${program.startupName} — ${program.oneLiner} (stage: ${program.stage})

Today is Day ${day.dayNumber} of ${durationDays}. The current plan for today:
Theme: ${day.theme}
Objective: ${day.objective}
Tasks:
${tasks.map((t, i) => `${i + 1}. ${t.text}${t.done ? " (already done)" : ""}`).join("\n") || "(none yet)"}

The founder just told you: "${request}"

Rework TODAY's plan around what they said. Keep tasks they've already completed. Stay demanding — adapt to their reality without letting them off the hook on customers and revenue. Respond ONLY with valid JSON:

{
  "reply": "1-3 sentences in your direct voice reacting to their request",
  "theme": "3-5 word theme",
  "objective": "one sentence objective for today",
  "tasks": [ { "text": "specific action", "done": false } ],
  "partnerNote": "1-2 sentences of coaching for the reworked day"
}

Rules:
- 3 to 5 tasks. Include any already-done tasks first with done=true, exactly as they were.
- Every new task must be doable today given what the founder said.`,
      },
    ],
  });

  const data = parseJSON(msg.content[0].text.trim());

  // Never trust the model to preserve completed work: re-attach any already-done
  // task it dropped, and restore the done flag on any it re-listed as fresh.
  let newTasks = Array.isArray(data.tasks) && data.tasks.length
    ? data.tasks.map((t) => ({ text: typeof t === "string" ? t : t.text, done: !!t.done }))
    : tasks;
  const doneTasks = tasks.filter((t) => t.done);
  newTasks = newTasks.map((t) => (doneTasks.some((dt) => dt.text === t.text) ? { ...t, done: true } : t));
  const missingDone = doneTasks.filter((dt) => !newTasks.some((t) => t.text === dt.text));
  newTasks = [...missingDone, ...newTasks];

  return {
    reply: data.reply || "Done — plan updated.",
    theme: data.theme || day.theme,
    objective: data.objective || day.objective,
    tasks: newTasks,
    partnerNote: data.partnerNote || day.partnerNote,
  };
}

// Generate Michael Seibel's reaction to a daily check-in.
export async function generateCheckinFeedback({ program, day, report }) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: seibelPersona(program.durationDays || 90),
    messages: [
      {
        role: "user",
        content: `Founder ${program.startupName} just checked in on Day ${day.dayNumber} (theme: ${day.theme}).

What they did: ${report.summary || "(nothing reported)"}
Blockers: ${report.blockers || "none"}
Revenue this point: $${report.revenue ?? "unknown"}
Users/customers: ${report.users ?? "unknown"}
How they feel: ${report.mood || "unspecified"}

Respond as Michael Seibel with 2-4 sentences of direct, specific feedback. Acknowledge what they did, call out the most important thing to fix or push on next, and keep them focused on revenue. Plain text only, no JSON.`,
      },
    ],
  });

  return msg.content[0].text.trim();
}
