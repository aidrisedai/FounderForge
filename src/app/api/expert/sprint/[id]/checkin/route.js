import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateCheckinFeedback, generateSprintDetail, applySprintDetail } from "@/lib/expertCoach";

const DETAIL_WINDOW = 5;

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sprint = await prisma.expertSprint.findUnique({
      where: { id: params.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    if (!sprint || sprint.userId !== session.user.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { summary, blockers, metric, mood } = await req.json();
    const currentDay = sprint.days.find((d) => d.dayNumber === sprint.currentDay);
    if (!currentDay) return NextResponse.json({ error: "Current day not found" }, { status: 404 });

    let feedback = null;
    try {
      feedback = await generateCheckinFeedback({
        sprint,
        day: currentDay,
        report: { summary, blockers, metric, mood },
      });
    } catch (err) {
      console.error("Feedback generation failed:", err.message);
    }

    const report = { summary, blockers: blockers || null, metric: metric || null, mood: mood || null, feedback };
    const nextDay = sprint.currentDay + 1;
    const isComplete = nextDay > sprint.timeline;

    await prisma.$transaction([
      prisma.expertSprintDay.update({
        where: { sprintId_dayNumber: { sprintId: sprint.id, dayNumber: sprint.currentDay } },
        data: { status: "done", report, reportedAt: new Date() },
      }),
      ...(isComplete ? [] : [
        prisma.expertSprintDay.update({
          where: { sprintId_dayNumber: { sprintId: sprint.id, dayNumber: nextDay } },
          data: { status: "active" },
        }),
      ]),
      prisma.expertSprint.update({
        where: { id: sprint.id },
        data: {
          currentDay: isComplete ? sprint.timeline : nextDay,
          status: isComplete ? "completed" : "active",
        },
      }),
    ]);

    if (!isComplete) {
      const freshSprint = await prisma.expertSprint.findUnique({
        where: { id: sprint.id },
        include: { days: { orderBy: { dayNumber: "asc" } } },
      });
      const windowEnd = Math.min(sprint.timeline, nextDay + DETAIL_WINDOW - 1);
      const windowDays = freshSprint.days.filter(
        (d) => d.dayNumber >= nextDay && d.dayNumber <= windowEnd && !d.detailed
      );
      if (windowDays.length > 0) {
        const recentReports = sprint.days
          .filter((d) => d.report)
          .slice(-3)
          .map((d) => ({ day: d.dayNumber, summary: d.report.summary }));
        try {
          const detail = await generateSprintDetail({ sprint: freshSprint, windowDays, recentReports });
          await applySprintDetail(sprint.id, detail);
        } catch (err) {
          console.error("Window detail failed:", err.message);
        }
      }
    }

    const result = await prisma.expertSprint.findUnique({
      where: { id: sprint.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    return NextResponse.json({ sprint: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to process check-in" }, { status: 500 });
  }
}
