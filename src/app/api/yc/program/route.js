import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateSkeleton, clampDuration } from "@/lib/ycCoach";

const MAX_PROGRAMS = 5;

// GET: all non-abandoned programs for the user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const programs = await prisma.yCProgram.findMany({
      where: { userId: session.user.id, status: { not: "abandoned" } },
      include: { days: { orderBy: { dayNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: MAX_PROGRAMS,
    });
    return NextResponse.json({ programs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load programs" }, { status: 500 });
  }
}

// POST: create a new program in "planning" status. Seibel drafts the skeleton; the
// founder reviews and refines it (via /plan) before locking it in (via /start).
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { startupName, oneLiner, stage, startingRevenue, durationDays } = await req.json();

    if (!startupName?.trim() || !oneLiner?.trim()) {
      return NextResponse.json({ error: "Startup name and description are required" }, { status: 400 });
    }

    // Enforce 5-project limit
    const count = await prisma.yCProgram.count({
      where: { userId: session.user.id, status: { not: "abandoned" } },
    });
    if (count >= MAX_PROGRAMS) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_PROGRAMS} active projects. Archive one to create a new one.` },
        { status: 400 }
      );
    }

    const startRev = Math.max(0, parseInt(startingRevenue, 10) || 0);
    const duration = clampDuration(durationDays);

    // 1. Generate the sprint skeleton
    const { phases, days } = await generateSkeleton({
      startupName: startupName.trim(),
      oneLiner: oneLiner.trim(),
      stage: stage || "idea",
      startingRevenue: startRev,
      durationDays: duration,
    });

    // 2. Create the program as a draft — days are materialized when the founder starts
    const program = await prisma.yCProgram.create({
      data: {
        userId: session.user.id,
        startupName: startupName.trim(),
        oneLiner: oneLiner.trim(),
        stage: stage || "idea",
        startingRevenue: startRev,
        durationDays: duration,
        currentDay: 1,
        status: "planning",
        phases,
        planDays: days,
        planChat: [],
      },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
