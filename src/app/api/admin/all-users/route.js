import { requireAdmin } from "@/lib/admin-middleware";
import prisma from "@/lib/prisma";
import { CURRICULUM } from "@/lib/curriculum";

const TOTAL_TASKS = CURRICULUM.reduce((sum, s) => sum + s.tasks.length, 0);

export async function GET(request) {
  // Check admin authentication using admin tokens
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const dbUsers = await prisma.user.findMany({
      include: {
        projects: true,
        personality: true,
        memory: { include: { insights: true, milestones: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const users = dbUsers.map((user) => {
      let completedTasks = 0;
      user.projects.forEach((p) => {
        Object.values(p.completedTasks || {}).forEach((count) => {
          completedTasks += count;
        });
      });

      const lastActive = user.activities[0]?.createdAt?.toISOString() || user.updatedAt?.toISOString() || null;

      return {
        email: user.email,
        name: user.name,
        projects: user.projects.length,
        activeProject: user.projects[0]?.name || "None",
        progress: TOTAL_TASKS > 0 ? Math.round((completedTasks / TOTAL_TASKS) * 100) : 0,
        completedTasks,
        totalTasks: TOTAL_TASKS,
        personality: !!user.personality?.completed,
        memorySummary: user.memory ? {
          insights: user.memory.insights.length,
          milestones: user.memory.milestones.length,
          lastActive: user.memory.lastActive?.toISOString(),
        } : null,
        lastActive,
        rawData: { projects: user.projects },
      };
    });

    const activeUsers = users.filter((u) => {
      if (!u.lastActive) return false;
      return (Date.now() - new Date(u.lastActive)) / (1000 * 60 * 60 * 24) < 7;
    }).length;

    return Response.json({ success: true, users, totalUsers: users.length, activeUsers });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
