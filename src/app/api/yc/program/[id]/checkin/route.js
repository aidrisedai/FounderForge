import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateDetail, generateCheckinFeedback, applyDetail } from "@/lib/ycCoach";

const DETAIL_WINDOW = 7;

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const program = await prisma.yCProgram.findFirst({
      where: { id, userId: session.user.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    if (program.status !== "active") {
      return NextResponse.json({ error: "Program is not active" }, { status: 400 });
    }

    const body = await req.json();
    const { summary = "", blockers = "", revenue, users, mood = "" } = body;

    const dayNumber = program.currentDay;
    const currentDay = program.days.find((d) => d.dayNumber === dayNumber);
    if (!currentDay) return NextResponse.json({ error: "Current day not found" }, { status: 404 });

    const report = {
      summary: String(summary).slice(0, 2000),
      blockers: String(blockers).slice(0, 2000),
      revenue: revenue != null && revenue !== "" ? Math.max(0, parseInt(revenue, 10) || 0) : null,
      users: users != null && users !== "" ? Math.max(0, parseInt(users, 10) || 0) : null,
      mood: String(mood).slice(0, 200),
    };

    // 1. Get Seibel's feedback on this check-in
    let feedback = "";
    try {
      feedback = await generateCheckinFeedback({ program, day: currentDay, report });
    } catch (e) {
      console.error("Feedback generation failed:", e.message);
    }
    report.feedback = feedback;

    // 2. Mark current day done, advance the program
    await prisma.yCDay.update({
      where: { id: currentDay.id },
      data: { status: "done", report, reportedAt: new Date() },
    });

    const durationDays = program.durationDays || 90;
    const isComplete = dayNumber >= durationDays;
    const nextDay = dayNumber + 1;

    await prisma.yCProgram.update({
      where: { id: program.id },
      data: {
        currentDay: isComplete ? durationDays : nextDay,
        status: isComplete ? "completed" : "active",
      },
    });

    if (!isComplete) {
      // 3. Mark the next day active
      await prisma.yCDay.updateMany({
        where: { programId: program.id, dayNumber: nextDay },
        data: { status: "active" },
      });

      // 4. Adaptively (re)generate detail for the upcoming window, factoring in recent reports
      const recentReports = program.days
        .filter((d) => d.report && d.dayNumber >= dayNumber - 2 && d.dayNumber <= dayNumber)
        .map((d) => ({ dayNumber: d.dayNumber, report: d.report }));
      recentReports.push({ dayNumber, report });

      const windowDays = program.days.filter(
        (d) => d.dayNumber >= nextDay && d.dayNumber < nextDay + DETAIL_WINDOW
      );

      if (windowDays.length) {
        try {
          const detail = await generateDetail({ program, windowDays, recentReports });
          await applyDetail(program.id, detail);
        } catch (e) {
          console.error("Adaptive detail generation failed:", e.message);
        }
      }
    }

    const fresh = await prisma.yCProgram.findUnique({
      where: { id: program.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    return NextResponse.json({ program: fresh, feedback, completed: isComplete });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
