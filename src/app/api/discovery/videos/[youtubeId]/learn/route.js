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
- "concept": use body. 2-3 sentences max.
- "list": use items (3-5). No body needed.
- "debate": use sides only. No body.
- "question": use body as the Socratic prompt. Italicised for the user.
- "feedback": use body to validate/correct the student's last answer.
- replies: 2-3 short clickable responses. Optional but preferred on question cards.
- advance: set true ONLY when this topic phase is complete and the student should move on.
- Return 1-3 cards per response. Start with a question or concept, not a wall of text.
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
- Use Socratic method. Ask before lecturing.
- One idea at a time. Never dump everything at once.
- Connect abstract concepts to real founder situations.
- When a student's answer reveals a gap, correct gently with a feedback card.
- Move toward helping the founder see which problem THEY could solve.
- Use debate cards for genuine expert disagreements in this space.
- Use list cards for frameworks or step-by-step thinking.

${CARD_FORMAT}`;
}

function buildPhasePrompt(phase, analysis) {
  const problems = analysis.problems || [];

  if (phase === "orientation") {
    return `Start the session. Give a brief concept card setting up the domain (1-2 sentences), then immediately ask a Socratic question to find out if the student has personal experience with this space. Use replies with 2-3 options. Do NOT advance yet.`;
  }

  const problemIndex = parseInt(phase.replace("problem-", ""), 10);
  if (!isNaN(problemIndex) && problems[problemIndex]) {
    const p = problems[problemIndex];
    return `Now explore this specific problem with the student: "${p.title}". Start by presenting a real scenario or asking if they've experienced this pain. Then go deeper — who suffers most, what workarounds exist, what a solution might look like. After the student has engaged meaningfully (2-3 exchanges), set advance:true on the last card.`;
  }

  if (phase === "synthesis") {
    return `This is the final phase. Ask the student which of the ${problems.length} problems we explored resonates most with them personally — and why. Then ask what kind of solution they might imagine. Give a final feedback card affirming their thinking and pointing toward next steps in FounderForge. Set advance:true on the last card.`;
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
