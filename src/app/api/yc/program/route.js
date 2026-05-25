import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateSkeleton, generateDetail, applyDetail } from "@/lib/ycCoach";

const DETAIL_WINDOW = 7; // how many upcoming days to flesh out at a time

// GET: the user's active program with all days
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const program = await prisma.yCProgram.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { days: { orderBy: { dayNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(program || null);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load program" }, { status: 500 });
  }
}

// POST: create a new 90-day program and generate the plan
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { startupName, oneLiner, stage, startingRevenue } = await req.json();

    if (!startupName?.trim() || !oneLiner?.trim()) {
      return NextResponse.json({ error: "Startup name and description are required" }, { status: 400 });
    }

    // Abandon any existing active program (one active program per user)
    await prisma.yCProgram.updateMany({
      where: { userId: session.user.id, status: "active" },
      data: { status: "abandoned" },
    });

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
