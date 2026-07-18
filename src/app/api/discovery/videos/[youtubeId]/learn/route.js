import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Card format the tutor must return — never change this structure.
const CARD_FORMAT = `
Respond ONLY with valid JSON:
{
  "cards": [
    {
      "type": "concept|list|debate|question|feedback",
      "title": "short title",
      "body": "body text (concept/question/feedback types)",
      "items": [{"num":1,"title":"...","desc":"..."}],
      "sides": {"a":{"label":"...","text":"..."},"b":{"label":"...","text":"..."}},
      "replies": ["quick reply ≤6 words", "another option"],
      "advance": false
    }
  ]
}
Rules:
- Return 1 card by default. Return 2 only when one is feedback and one is the next question.
- Keep body text to 12-25 words unless a final synthesis truly needs more.
- No paragraphs. No lectures. No startup jargon unless the user already used it.
- Ask exactly one question per turn.
- Open with vivid human scenes: a person, a moment, a broken workaround.
- "concept": use body. One sharp idea only.
- "list": use items (2-3). No body needed.
- "debate": use sides only. No body.
- "question": use body as the Socratic prompt. Italicised for the user.
- "feedback": use body to validate/correct the student's last answer in one warm sentence.
- replies: 2-3 short clickable responses. Optional but preferred on question cards.
- advance: set true ONLY when this topic phase is complete and the student should move on.
- Be Socratic: ask before lecturing. Pull insight from the student first.
`;

function buildSystemPrompt(video, analysis) {
  const problems = (analysis.problems || []).map((p, i) =>
    `Problem ${i + 1} — ${p.title}: ${p.description}`
  ).join("\n");

  return `You are a Socratic tutor inside FounderForge, an app that helps aspiring founders find startup problems worth solving. You are guiding a founder through the key ideas from this video:

VIDEO: "${video.title}" by ${video.channelTitle}

DOMAIN CONTEXT: ${analysis.domainContext || ""}

PROBLEMS SURFACED FROM THIS VIDEO:
${problems}

REFLECTION QUESTIONS:
${(analysis.questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}

YOUR TEACHING APPROACH:
- Be a design-minded startup guide, not a classroom lecturer.
- Help the founder notice pain, name patterns, and turn curiosity into a sharp problem.
- One idea at a time. One question at a time.
- Use concrete nouns and human moments over frameworks.
- When a student's answer reveals a gap, correct gently with a feedback card.
- Move toward helping the founder see which problem THEY could solve.
- Use debate cards only for genuine expert disagreements.
- Use list cards sparingly for 2-3 crisp options.

${CARD_FORMAT}`;
}

function buildPhasePrompt(phase, analysis) {
  const problems = analysis.problems || [];

  if (phase === "orientation") {
    return `Open with one vivid human moment from this world, then ask where the founder has seen similar friction. One card under 25 words. Use replies with 2-3 options. Do NOT advance yet.`;
  }

  const problemIndex = parseInt(phase.replace("problem-", ""), 10);
  if (!isNaN(problemIndex) && problems[problemIndex]) {
    const p = problems[problemIndex];
    return `Explore this specific problem with the founder: "${p.title}". Start from this scene if available: "${p.humanMoment || p.description}". Ask what they have personally seen. Then uncover who suffers most, the ugly workaround, and why now. After 2-3 meaningful exchanges, set advance:true on the last card.`;
  }

  if (phase === "synthesis") {
    return `Final phase. Help the founder choose the one live wire: which problem made them lean in, and why it might be theirs to chase. Ask one question first. Then give a concise feedback card pointing them toward saving a Problem Spark. Set advance:true on the last card.`;
  }

  return `Continue the Socratic conversation based on the student's last message. When the current topic is fully explored, set advance:true.`;
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { youtubeId } = params;

  try {
    const video = await prisma.domainVideo.findUnique({ where: { youtubeId } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const { messages = [], phase = "orientation" } = await req.json();

    const analysis = video.extractedProblems || { problems: [], questions: [], domainContext: "" };
    const systemPrompt = buildSystemPrompt(video, analysis);
    const phaseInstruction = buildPhasePrompt(phase, analysis);

    // Inject the phase instruction as the last system turn
    const apiMessages = [
      ...messages,
      { role: "user", content: `[TUTOR INSTRUCTION — not shown to student]: ${phaseInstruction}` },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const raw = response.content[0].text.trim();
    let result;
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      result = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Fallback if JSON parse fails
      result = {
        cards: [{
          type: "concept",
          title: "Let's keep going",
          body: raw.slice(0, 300),
          replies: ["Tell me more", "Got it"],
          advance: false,
        }],
      };
    }

    // Build sequence of phases for the client
    const problems = analysis.problems || [];
    const sequence = [
      "orientation",
      ...problems.map((_, i) => `problem-${i}`),
      "synthesis",
    ];

    return NextResponse.json({ ...result, sequence });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Learning session failed" }, { status: 500 });
  }
}
