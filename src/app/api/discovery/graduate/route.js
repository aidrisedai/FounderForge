import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { problemId } = await req.json();
    if (!problemId) return NextResponse.json({ error: "problemId required" }, { status: 400 });

    const problem = await prisma.discoveredProblem.findFirst({
      where: { id: problemId, userId: session.user.id },
    });
    if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    if (problem.graduated) {
      return NextResponse.json({ error: "Already graduated", projectId: problem.projectId }, { status: 409 });
    }

    const firstBet = [
      "Problem Spark from Idea Discovery:",
      problem.problemText,
      problem.notes ? `Founder notes: ${problem.notes}` : null,
      "Next step: turn this spark into a fully evidence-backed Problem Hypothesis in Task 1.1.",
    ].filter(Boolean).join("\n\n");

    // Create a new project from the problem and bridge it into the first curriculum task.
    // We prefill Task 1.1 as draft context, but do not mark it complete.
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name: problem.problemText.slice(0, 100),
        completedTasks: {},
        deliverables: { "1.1": firstBet },
      },
    });

    // Mark problem as graduated
    await prisma.discoveredProblem.update({
      where: { id: problemId },
      data: { graduated: true, projectId: project.id },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to graduate" }, { status: 500 });
  }
}
