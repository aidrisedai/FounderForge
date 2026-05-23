import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const problems = await prisma.discoveredProblem.findMany({
      where: { userId: session.user.id },
      include: {
        video: { select: { title: true, youtubeId: true, thumbnailUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(problems);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load problems" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { problemText, notes, videoId, domainId } = await req.json();

    if (!problemText || typeof problemText !== "string" || problemText.trim().length < 10) {
      return NextResponse.json({ error: "Problem description too short" }, { status: 400 });
    }
    if (problemText.length > 2000) {
      return NextResponse.json({ error: "Problem description too long" }, { status: 400 });
    }

    const problem = await prisma.discoveredProblem.create({
      data: {
        userId: session.user.id,
        problemText: problemText.trim(),
        notes: notes?.trim().slice(0, 1000) || null,
        videoId: videoId || null,
        domainId: domainId || null,
      },
      include: {
        video: { select: { title: true, youtubeId: true, thumbnailUrl: true } },
      },
    });

    return NextResponse.json(problem, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save problem" }, { status: 500 });
  }
}
