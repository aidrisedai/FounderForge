import { requireAdmin } from "@/lib/admin-middleware";
import prisma from "@/lib/prisma";
import { CURRICULUM } from "@/lib/curriculum";

export async function GET(request) {
  // Check admin authentication using admin tokens
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return Response.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        projects: {
          include: {
            conversations: {
              include: { messages: { orderBy: { createdAt: "asc" } } },
            },
          },
        },
        personality: true,
        memory: {
          include: {
            insights: true,
            milestones: true,
            decisions: true,
            patterns: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const allConversations = [];

    for (const project of user.projects) {
      for (const conv of project.conversations) {
        if (conv.messages.length === 0) continue;

        let taskInfo = null;
        let stepInfo = null;
        for (const step of CURRICULUM) {
          const task = step.tasks.find((t) => t.id === conv.taskId);
          if (task) { taskInfo = task; stepInfo = step; break; }
        }

        allConversations.push({
          projectId: project.id,
          projectName: project.name,
          taskId: conv.taskId,
          taskTitle: taskInfo?.title || conv.taskId,
          stepTitle: stepInfo?.title || "Unknown",
          stepId: stepInfo?.id || null,
          messageCount: conv.messages.length,
          messages: conv.messages.map((m) => ({ role: m.role, content: m.content })),
          deliverable: project.deliverables?.[conv.taskId] || null,
          completed: stepInfo
            ? (project.completedTasks?.[stepInfo.id] || 0) > stepInfo.tasks.indexOf(taskInfo)
            : false,
        });
      }
    }

    allConversations.sort((a, b) => b.messageCount - a.messageCount);

    let completedTasks = 0;
    let totalDeliverables = 0;
    user.projects.forEach((p) => {
      Object.values(p.completedTasks || {}).forEach((c) => { completedTasks += c; });
      totalDeliverables += Object.keys(p.deliverables || {}).length;
    });

    return Response.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        projects: user.projects.map((p) => ({
          id: p.id,
          name: p.name,
          completedTasks: p.completedTasks,
          deliverables: p.deliverables,
        })),
        conversations: allConversations,
        personality: user.personality || null,
        memory: user.memory ? {
          insights: user.memory.insights,
          milestones: user.memory.milestones,
          decisions: user.memory.decisions,
          patterns: user.memory.patterns,
          profile: user.memory.profile,
          lastActive: user.memory.lastActive?.toISOString(),
        } : null,
        stats: {
          totalProjects: user.projects.length,
          totalConversations: allConversations.length,
          totalMessages: allConversations.reduce((s, c) => s + c.messageCount, 0),
          completedTasks,
          totalDeliverables,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return Response.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}
