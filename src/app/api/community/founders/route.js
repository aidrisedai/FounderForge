import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

function activeStepForProject(completedTasks) {
  // Highest step the founder has made progress on. Defaults to 1 for new projects.
  if (!completedTasks || Object.keys(completedTasks).length === 0) return 1;
  const stepsWithProgress = Object.entries(completedTasks)
    .filter(([, v]) => Number(v) > 0)
    .map(([k]) => Number(k));
  return stepsWithProgress.length > 0 ? Math.max(...stepsWithProgress) : 1;
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const stepFilter = searchParams.get("step");

  const founders = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      founderProfile: { openToConnect: true },
    },
    include: {
      founderProfile: true,
      stats: { select: { xp: true, level: true } },
      // Include ALL projects so we can show every stage a founder is active in
      projects: {
        select: { id: true, name: true, completedTasks: true },
        orderBy: { updatedAt: "desc" },
      },
      sentConnections: {
        where: { receiverId: me.id },
        select: { status: true, id: true },
      },
      receivedConnections: {
        where: { requesterId: me.id },
        select: { status: true, id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = founders
    .map((f) => {
      // Build a per-project stage list
      const projectStages = f.projects.map((p) => ({
        id: p.id,
        name: p.name,
        activeStep: activeStepForProject(p.completedTasks),
      }));

      const allSteps = projectStages.map((p) => p.activeStep);

      const sentConn = f.sentConnections[0];
      const receivedConn = f.receivedConnections[0];
      const connection = sentConn || receivedConn || null;

      return {
        id: f.id,
        name: f.name,
        image: f.image,
        profile: f.founderProfile,
        stats: f.stats,
        projectStages,   // [{name, activeStep}] — one entry per project
        allSteps,        // flat array for filter matching
        connectionStatus: connection?.status || null,
        connectionId: connection?.id || null,
        iRequested: !!receivedConn,
      };
    })
    .filter((f) => {
      if (!stepFilter) return true;
      // Show this founder if ANY of their projects is at the requested step
      return f.allSteps.includes(Number(stepFilter));
    });

  return Response.json({ founders: result });
}
