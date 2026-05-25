import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// PATCH: toggle a task's done state for a given day
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, day } = params;
  const dayNumber = parseInt(day, 10);

  try {
    const program = await prisma.yCProgram.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    const { taskIndex, done } = await req.json();

    const ycDay = await prisma.yCDay.findUnique({
      where: { programId_dayNumber: { programId: id, dayNumber } },
    });
    if (!ycDay) return NextResponse.json({ error: "Day not found" }, { status: 404 });

    const tasks = Array.isArray(ycDay.tasks) ? [...ycDay.tasks] : [];
    if (taskIndex < 0 || taskIndex >= tasks.length) {
      return NextResponse.json({ error: "Invalid task index" }, { status: 400 });
    }
    tasks[taskIndex] = { ...tasks[taskIndex], done: !!done };

    const updated = await prisma.yCDay.update({
      where: { id: ycDay.id },
      data: { tasks },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
