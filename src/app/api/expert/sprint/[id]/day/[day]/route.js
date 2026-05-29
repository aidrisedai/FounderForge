import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, day } = params;
  const dayNumber = parseInt(day, 10);
  const { taskIndex, done } = await req.json();

  try {
    const sprint = await prisma.expertSprint.findUnique({ where: { id }, select: { userId: true } });
    if (!sprint || sprint.userId !== session.user.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sprintDay = await prisma.expertSprintDay.findUnique({
      where: { sprintId_dayNumber: { sprintId: id, dayNumber } },
    });
    if (!sprintDay) return NextResponse.json({ error: "Day not found" }, { status: 404 });

    const tasks = Array.isArray(sprintDay.tasks) ? [...sprintDay.tasks] : [];
    if (taskIndex >= 0 && taskIndex < tasks.length) {
      tasks[taskIndex] = { ...tasks[taskIndex], done };
    }

    await prisma.expertSprintDay.update({
      where: { sprintId_dayNumber: { sprintId: id, dayNumber } },
      data: { tasks },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
