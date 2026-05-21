import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const stepFilter = searchParams.get("step"); // optional numeric filter

  const founders = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      founderProfile: { openToConnect: true },
    },
    include: {
      founderProfile: true,
      stats: { select: { xp: true, level: true } },
      projects: {
        select: { completedTasks: true, name: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
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
      const project = f.projects[0];
      const completedSteps = project?.completedTasks
        ? Object.entries(project.completedTasks)
            .filter(([, v]) => v > 0)
            .map(([k]) => Number(k))
        : [];
      const currentStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 1;

      const sentConn = f.sentConnections[0];
      const receivedConn = f.receivedConnections[0];
      const connection = sentConn || receivedConn || null;
      const connectionStatus = connection?.status || null;
      const connectionId = connection?.id || null;
      const iRequested = !!receivedConn;

      return {
        id: f.id,
        name: f.name,
        image: f.image,
        profile: f.founderProfile,
        stats: f.stats,
        startupName: project?.name || null,
        currentStep,
        connectionStatus,
        connectionId,
        iRequested,
      };
    })
    .filter((f) => {
      if (!stepFilter) return true;
      return String(f.currentStep) === String(stepFilter);
    });

  return Response.json({ founders: result });
}
