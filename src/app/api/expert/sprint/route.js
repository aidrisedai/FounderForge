import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { generateSprintSkeleton, generateSprintDetail, applySprintDetail, ROLE_CONFIG } from "@/lib/expertCoach";

const DETAIL_WINDOW = 5;
const MAX_SPRINTS = 6;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sprints = await prisma.expertSprint.findMany({
      where: { userId: session.user.id, status: { not: "abandoned" } },
      include: { days: { orderBy: { dayNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: MAX_SPRINTS,
    });
    return NextResponse.json({ sprints });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load sprints" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { role, roleName: customRoleName, goal, timeline, startupContext } = await req.json();

    if (!goal?.trim()) return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    if (!role) return NextResponse.json({ error: "Role is required" }, { status: 400 });

    const count = await prisma.expertSprint.count({
      where: { userId: session.user.id, status: { not: "abandoned" } },
    });
    if (count >= MAX_SPRINTS) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_SPRINTS} active expert hires. Archive one to add another.` },
        { status: 400 }
      );
    }

    const config = ROLE_CONFIG[role] || ROLE_CONFIG.custom;
    const effectiveRoleName = role === "custom" && customRoleName?.trim() ? customRoleName.trim() : config.roleName;
    const days = Math.max(7, Math.min(90, parseInt(timeline, 10) || 30));

    const { phases, days: dayPlan } = await generateSprintSkeleton({
      role,
      roleName: effectiveRoleName,
      goal: goal.trim(),
      timeline: days,
      startupContext: startupContext?.trim() || "",
    });

    const sprint = await prisma.expertSprint.create({
      data: {
        userId: session.user.id,
        role,
        roleName: effectiveRoleName,
        expertName: config.expertName,
        goal: goal.trim(),
        timeline: days,
        startupContext: startupContext?.trim() || null,
        currentDay: 1,
        phases,
        days: {
          create: dayPlan.map((d) => ({
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

    const windowDays = sprint.days.filter((d) => d.dayNumber <= DETAIL_WINDOW);
    try {
      const detail = await generateSprintDetail({ sprint, windowDays, recentReports: [] });
      await applySprintDetail(sprint.id, detail);
    } catch (err) {
      console.error("Detail generation failed (skeleton saved):", err.message);
    }

    const fresh = await prisma.expertSprint.findUnique({
      where: { id: sprint.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    return NextResponse.json(fresh, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create sprint" }, { status: 500 });
  }
}
