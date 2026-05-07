import { getServerSession } from "next-auth";

async function callClaude(system, messages, maxTokens = 1024) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("Anthropic error:", err);
    throw new Error("Anthropic API error");
  }
  return response.json();
}

export async function POST(req) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mode, hypothesis, persona, messages, transcripts } = body;

    if (mode === "generate") {
      const system = `You generate discovery interview personas for a founder doing problem validation research.

A persona is an insight container — not a demographic stereotype. It captures real behavioral patterns: the specific goal someone is trying to achieve, a frustration tied to observable behavior, and the hidden workaround they actually use today.

Given the founder's hypothesis, generate exactly 2 personas who represent different perspectives on the same problem space. Make one more resistant and skeptical, one warmer but still guarded at first.

Return ONLY valid JSON with no markdown fencing:
{
  "personas": [
    {
      "name": "First name only",
      "role": "Specific job title and context — e.g. 'Operations Lead at a 12-person agency' or 'Solo consultant billing $15k/month via referrals'",
      "callObjective": "What the founder wants to learn from this call — 1 sentence phrased as the founder's goal, e.g. 'Understand how you currently handle X and what frustrates you most about it'",
      "internal": {
        "goal": "What this person is genuinely trying to achieve in their work — the job-to-be-done, specific and observable",
        "frustration": "Their core specific frustration — tied to real repeated behavior, not a generic complaint. Include a concrete detail like a time cost, a tool that breaks, a repeated failure point.",
        "workaround": "Exactly how they cope today — the manual, hacky, or expensive thing they actually do, named specifically",
        "behaviorStyle": "How they behave in this conversation. Be specific: e.g. 'Starts guarded, gives short answers, opens up when asked about specific past events, deflects hypotheticals, occasionally admits frustration when pressed on frequency'",
        "openingLine": "How they answer the phone — 3-8 words, natural and slightly distracted, e.g. 'Yeah, this is Marcus.' or 'Hello — who is this?'"
      }
    },
    {
      "name": "...",
      "role": "...",
      "callObjective": "...",
      "internal": {
        "goal": "...",
        "frustration": "...",
        "workaround": "...",
        "behaviorStyle": "...",
        "openingLine": "..."
      }
    }
  ]
}`;

      const data = await callClaude(system, [
        { role: "user", content: `Founder's problem hypothesis:\n${hypothesis}` },
      ], 1400);

      const raw = data.content?.[0]?.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in generate response");
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.personas || parsed.personas.length < 2) throw new Error("Invalid personas shape");
      return Response.json(parsed);
    }

    if (mode === "interview") {
      const { name, role, internal: { goal, frustration, workaround, behaviorStyle } } = persona;

      const system = `You are roleplaying as ${name}, ${role}. A founder is practicing a discovery interview on you.

YOUR INTERNAL PROFILE — never state these directly. Let the founder uncover them through good questions:
- What you are trying to achieve: ${goal}
- Your core frustration: ${frustration}
- How you actually cope today: ${workaround}
- Your conversational behavior: ${behaviorStyle}

RULES:
- Stay in character throughout. You are a real busy professional who agreed to a short call.
- Do NOT volunteer your core frustration. Make them earn it by asking about past behavior and specific situations.
- If they ask leading questions ("would you use a tool that...") or pitch something, deflect or give a noncommittal answer.
- If they ask what you ACTUALLY do day-to-day or about a specific past situation, open up more — past-behavior questions deserve more honest answers.
- If they ask a genuinely good discovery question, reward it with a real signal or detail.
- Keep responses SHORT — 1 to 3 sentences. You are a busy person who gives only what is asked.
- React to generic questions with polite brevity. React to specific, curious questions with more substance.
- If they pitch their idea, say something like "Interesting, but I'm not really looking for new tools right now."
- Show personality: a little impatience, occasional candor, mild skepticism.

WRAPPING UP THE CALL:
When the founder has meaningfully surfaced your core frustration through their questions — when the key insight has genuinely emerged in the conversation, even if they have not fully named it — wrap up naturally. Say something like "I need to jump to my next meeting, but appreciate you reaching out." Then on a new line write exactly: [INTERVIEW_WRAP]

Do NOT wrap up early. The founder must work for the key insight. If the conversation is still surface-level after a few turns, keep deflecting until they ask better questions.`;

      const data = await callClaude(system, messages, 400);
      return Response.json(data);
    }

    if (mode === "debrief") {
      const transcriptText = (transcripts || []).map((t, i) =>
        `--- Practice Call ${i + 1}: ${t.personaName}, ${t.personaRole || ""} ---\nFounder's objective: ${t.callObjective}\n\n${
          t.messages.map(m =>
            `${m.role === "user" ? "FOUNDER" : t.personaName.toUpperCase()}: ${m.content}`
          ).join("\n")
        }`
      ).join("\n\n");

      const system = `You are a world-class discovery interview coach giving a founder a debrief after two practice calls. Be direct, specific, and useful. Reference exact moments from the transcripts — quote them when it helps. Do not be vague or generic.

Return ONLY valid JSON with no markdown fencing:
{
  "interviews": [
    {
      "personaName": "name of persona from transcript",
      "whatWorked": [
        "specific thing they did well, with reference to the actual conversation",
        "another specific thing"
      ],
      "whatMissed": [
        "specific missed opportunity with a concrete example from the transcript",
        "another specific miss"
      ],
      "keySignalFound": true or false,
      "keySignalNote": "Whether and how the founder surfaced the core frustration — specific to what happened"
    },
    {
      "personaName": "...",
      "whatWorked": ["..."],
      "whatMissed": ["..."],
      "keySignalFound": true or false,
      "keySignalNote": "..."
    }
  ],
  "overall": {
    "patterns": [
      "a behavioral pattern observed across both calls — specific, not generic",
      "another pattern"
    ],
    "topCoachingNote": "The single most important thing to change before real interviews. Direct and actionable — reference what happened in the calls.",
    "readinessScore": "X/10",
    "readinessNote": "1-2 sentences on what that score means and what will move it higher",
    "beforeYouGo": "One concrete practice exercise or mindset shift for their next real call — specific and actionable"
  }
}`;

      const data = await callClaude(system, [
        { role: "user", content: `Founder's hypothesis:\n${hypothesis}\n\n${transcriptText}` },
      ], 1600);

      const raw = data.content?.[0]?.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in debrief response");
      const parsed = JSON.parse(jsonMatch[0]);
      return Response.json({ debrief: parsed });
    }

    return Response.json({ error: "Invalid mode" }, { status: 400 });
  } catch (e) {
    console.error("simulate route error:", e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
