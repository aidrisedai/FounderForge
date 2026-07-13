import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateDetail, applyDetail } from "@/lib/ycCoach";

const DETAIL_WINDOW = 7;

// POST: lock in the reviewed plan — materialize the days, flesh out the first
// window in detail, and set the program live on Day 1.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const program = await prisma.yCProgram.findFirst({
      where: { id, userId: session.user.id },
      include: { days: true },
    });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    if (program.status !== "planning") {
      return NextResponse.json({ error: "Program has already started" }, { status: 400 });
    }

    const planDays = Array.isArray(program.planDays) ? program.planDays : [];
    if (!planDays.length) {
      return NextResponse.json({ error: "No plan to start — recreate the program" }, { status: 400 });
    }

    // Materialize days (idempotent: clear any stale rows first)
    if (program.days.length) {
      await prisma.yCDay.deleteMany({ where: { programId: program.id } });
    }
    await prisma.yCDay.createMany({
      data: planDays.map((d) => ({
        programId: program.id,
        dayNumber: d.day,
        theme: d.theme,
        objective: d.objective,
        tasks: [],
        status: d.day === 1 ? "active" : "pending",
      })),
    });

    await prisma.yCProgram.update({
      where: { id: program.id },
      data: { status: "active", currentDay: 1, startDate: new Date(), planDays: Prisma.DbNull },
    });

    // Flesh out the first window of days in detail
    const withDays = await prisma.yCProgram.findUnique({
      where: { id: program.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    const windowDays = withDays.days.filter((d) => d.dayNumber <= DETAIL_WINDOW);
    try {
      const detail = await generateDetail({ program: withDays, windowDays, recentReports: [] });
      await applyDetail(program.id, detail);
    } catch (detailErr) {
      console.error("Detail generation failed (skeleton still saved):", detailErr.message);
    }

    const fresh = await prisma.yCProgram.findUnique({
      where: { id: program.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    return NextResponse.json({ program: fresh });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to start program" }, { status: 500 });
  }
}
