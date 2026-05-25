import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Michael Seibel coaching persona — the voice behind every plan and check-in.
export const SEIBEL_PERSONA = `You are Michael Seibel, Managing Director and Group Partner at Y Combinator, coaching a founder who has just been accepted into a YC batch. You co-founded Justin.tv/Twitch and Socialcam, and you have worked with thousands of YC startups.

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

The founder has 90 days to reach a $1M annual revenue run-rate (about $83K MRR). Treat this like a real YC batch sprint: push hard, stay concrete, give them specific actions — never vague platitudes. Every task should be something a founder can actually DO that day.`;

function parseJSON(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(start, end + 1));
}

// Generate the full 90-day skeleton: phases + a theme/objective for every single day.
export async function generateSkeleton({ startupName, oneLiner, stage, startingRevenue }) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SEIBEL_PERSONA,
    messages: [
      {
        role: "user",
        content: `Build a 90-day plan to get this startup to a $1M revenue run-rate.

STARTUP: ${startupName}
WHAT IT IS: ${oneLiner}
STAGE: ${stage}
CURRENT MONTHLY REVENUE: $${startingRevenue}

Produce a complete arc. Respond ONLY with valid JSON in this exact shape:

{
  "phases": [
    { "name": "short phase name", "dayStart": 1, "dayEnd": 14, "goal": "what the founder must achieve in this phase", "milestone": "the concrete proof this phase is done" }
  ],
  "days": [
    { "day": 1, "theme": "3-5 word theme", "objective": "one specific sentence on what to accomplish today" }
  ]
}

Rules:
- 5 to 7 phases that together cover days 1 through 90 with no gaps.
- The "days" array MUST contain exactly 90 entries, day 1 through day 90, in order.
- Early phase: talk to users, launch, first paying customers (do things that don't scale).
- Middle phase: find a repeatable acquisition + sales motion, tighten the product.
- Late phase: scale what works, push the growth rate toward the revenue goal.
- Each objective is concrete and action-oriented, not abstract. Tie to revenue/users/growth.
- Keep each theme and objective tight. This is a skeleton; daily detail comes later.`,
      },
    ],
  });

  const data = parseJSON(msg.content[0].text.trim());

  // Ensure exactly 90 day entries; fill any gaps from the containing phase.
  const byDay = {};
  for (const d of data.days || []) byDay[d.day] = d;
  const phases = data.phases || [];
  const findPhase = (day) => phases.find((p) => day >= p.dayStart && day <= p.dayEnd) || phases[phases.length - 1];

  const days = [];
  for (let day = 1; day <= 90; day++) {
    if (byDay[day]) {
      days.push({ day, theme: byDay[day].theme || "Build & talk to users", objective: byDay[day].objective || "Make progress on the key metric and talk to a customer." });
    } else {
      const ph = findPhase(day);
      days.push({ day, theme: ph?.name || "Build & talk to users", objective: ph?.goal || "Make progress on the key metric and talk to a customer." });
    }
  }

  return { phases, days };
}

// Generate detailed tasks + a Seibel note for a window of days, factoring in recent reports.
export async function generateDetail({ program, windowDays, recentReports }) {
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
    system: SEIBEL_PERSONA,
    messages: [
      {
        role: "user",
        content: `Founder: ${program.startupName} — ${program.oneLiner} (stage: ${program.stage})

90-DAY ARC:
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
  for (const d of detail.days || []) {
    const data = {
      tasks: (d.tasks || []).map((t) => ({ text: typeof t === "string" ? t : t.text, done: false })),
      partnerNote: d.partnerNote || null,
      rationale: d.rationale || null,
      detailed: true,
    };
    if (d.theme) data.theme = d.theme;
    if (d.objective) data.objective = d.objective;

    await prisma.yCDay
      .update({ where: { programId_dayNumber: { programId, dayNumber: d.day } }, data })
      .catch((e) => console.error(`Failed to update day ${d.day}:`, e.message));
  }
}

// Generate Michael Seibel's reaction to a daily check-in.
export async function generateCheckinFeedback({ program, day, report }) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SEIBEL_PERSONA,
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
