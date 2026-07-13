import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { refinePlan } from "@/lib/ycCoach";

// POST: one turn of the plan-review conversation. The founder sends feedback on the
// draft plan; Seibel replies and, when warranted, revises the skeleton in place.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const program = await prisma.yCProgram.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    if (program.status !== "planning") {
      return NextResponse.json({ error: "Plan review is only available before the sprint starts" }, { status: 400 });
    }

    const { message } = await req.json();
    const userMessage = String(message || "").trim().slice(0, 2000);
    if (!userMessage) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const chatHistory = Array.isArray(program.planChat) ? program.planChat : [];
    const plan = { phases: program.phases || [], days: program.planDays || [] };

    const { reply, plan: updatedPlan } = await refinePlan({ program, plan, chatHistory, userMessage });

    const newChat = [
      ...chatHistory,
      { role: "user", content: userMessage },
      { role: "assistant", content: reply },
    ].slice(-40);

    const fresh = await prisma.yCProgram.update({
      where: { id: program.id },
      data: {
        planChat: newChat,
        ...(updatedPlan ? { phases: updatedPlan.phases, planDays: updatedPlan.days } : {}),
      },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    return NextResponse.json({ program: fresh, reply, planChanged: !!updatedPlan });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Plan update failed" }, { status: 500 });
  }
}
