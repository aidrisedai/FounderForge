import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { fetchTranscript } from "@/lib/transcript";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { youtubeId } = params;

  try {
    const video = await prisma.domainVideo.findUnique({ where: { youtubeId } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (video.extractedProblems && video.transcriptCachedAt) {
      const age = Date.now() - new Date(video.transcriptCachedAt).getTime();
      if (age < 7 * 24 * 60 * 60 * 1000) {
        return NextResponse.json(video.extractedProblems);
      }
    }

    const transcript = await fetchTranscript(youtubeId);
    const context = transcript
      ? `Video transcript:\n${transcript}`
      : `Video title: "${video.title}"\nVideo description: ${video.description || "(none)"}`;

    const prompt = `You are an expert startup advisor helping a new founder discover problems worth solving.

${context}

Based on the above, extract insights for a founder exploring this space. Respond ONLY with valid JSON in this exact shape:

{
  "problems": [
    { "title": "short problem title", "description": "1-2 sentence explanation of the pain point and who feels it" }
  ],
  "questions": [
    "Question to prompt the founder to reflect on whether they've experienced this"
  ],
  "domainContext": "2-sentence summary of what this space is about and why it matters now"
}

Include 3-5 problems and 3 questions. Focus on real, specific pain points — not vague trends.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        thinking: { type: "disabled" },
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic error:", await res.text().catch(() => ""));
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    const apiData = await res.json();
    const raw = (apiData.content || []).map((c) => c.text || "").join("").trim();

    let analysis;
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      analysis = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      analysis = { problems: [], questions: [], domainContext: "" };
    }

    await prisma.domainVideo.update({
      where: { youtubeId },
      data: {
        transcript: transcript || null,
        extractedProblems: analysis,
        transcriptCachedAt: new Date(),
      },
    });

    return NextResponse.json(analysis);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
