import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateSkeleton, generateDetail, applyDetail } from "@/lib/ycCoach";

const DETAIL_WINDOW = 7;
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

// POST: create a new 90-day program (max 5, no longer abandons existing ones)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { startupName, oneLiner, stage, startingRevenue } = await req.json();

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

    // 1. Generate the 90-day skeleton
    const { phases, days } = await generateSkeleton({
      startupName: startupName.trim(),
      oneLiner: oneLiner.trim(),
      stage: stage || "idea",
      startingRevenue: startRev,
    });

    // 2. Create the program + all 90 skeleton days
    const program = await prisma.yCProgram.create({
      data: {
        userId: session.user.id,
        startupName: startupName.trim(),
        oneLiner: oneLiner.trim(),
        stage: stage || "idea",
        startingRevenue: startRev,
        currentDay: 1,
        phases,
        days: {
          create: days.map((d) => ({
            dayNumber: d.day,
            theme: d.theme,
            objective: d.objective,
            tasks: [],
            status: d.day === 1 ? "active" : "pending",
          })),
        },
      },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    // 3. Flesh out the first window of days in detail
    const windowDays = program.days.filter((d) => d.dayNumber <= DETAIL_WINDOW);
    try {
      const detail = await generateDetail({ program, windowDays, recentReports: [] });
      await applyDetail(program.id, detail);
    } catch (detailErr) {
      console.error("Detail generation failed (skeleton still saved):", detailErr.message);
    }

    const fresh = await prisma.yCProgram.findUnique({
      where: { id: program.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    return NextResponse.json(fresh, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}

