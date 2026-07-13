import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { adjustDay } from "@/lib/ycCoach";

// POST: rework today's plan around a live request from the founder
// ("I only have 2 hours today", "swap outreach for shipping the fix", ...).
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, day } = params;
  const dayNumber = parseInt(day, 10);

  try {
    const { request } = await req.json();
    const trimmed = String(request || "").trim().slice(0, 1000);
    if (!trimmed) return NextResponse.json({ error: "Tell Michael what to change" }, { status: 400 });

    const program = await prisma.yCProgram.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    if (program.status !== "active") {
      return NextResponse.json({ error: "Program is not active" }, { status: 400 });
    }
    if (dayNumber !== program.currentDay) {
      return NextResponse.json({ error: "You can only adjust today's plan" }, { status: 400 });
    }

    const ycDay = await prisma.yCDay.findUnique({
      where: { programId_dayNumber: { programId: id, dayNumber } },
    });
    if (!ycDay) return NextResponse.json({ error: "Day not found" }, { status: 404 });

    const result = await adjustDay({ program, day: ycDay, request: trimmed });

    const updated = await prisma.yCDay.update({
      where: { id: ycDay.id },
      data: {
        theme: result.theme,
        objective: result.objective,
        tasks: result.tasks,
        partnerNote: result.partnerNote,
        detailed: true,
      },
    });

    return NextResponse.json({ day: updated, reply: result.reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to adjust the day" }, { status: 500 });
  }
}
