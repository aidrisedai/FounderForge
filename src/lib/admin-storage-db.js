import prisma from "@/lib/prisma";

export async function logUserActivity(userEmail, projectId, activity) {
  try {
    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    
    if (!user) {
      console.error("User not found:", userEmail);
      return null;
    }
    
    // Create activity log
    const activityLog = await prisma.activity.create({
      data: {
        userId: user.id,
        type: activity.type,
        projectId: projectId || null,
        stage: activity.stage || null,
        task: activity.task || null,
        details: activity,
      },
    });
    
    return activityLog;
  } catch (error) {
    console.error("Error logging activity:", error);
    return null;
  }
}

export async function getAnalyticsSummary() {
  try {
    // Get counts
    const [totalUsers, totalProjects, totalMessages, totalCompletedTasks] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.activity.count({ where: { type: 'message' } }),
      prisma.activity.count({ where: { type: 'task_completed' } }),
    ]);
    
    // Get stage progress
    const stageActivities = await prisma.activity.findMany({
      where: { 
        type: 'task_completed',
        stage: { not: null },
      },
      select: { stage: true },
    });
    
    const stageProgress = {};
    stageActivities.forEach(activity => {
      const stage = activity.stage.toString();
      stageProgress[stage] = (stageProgress[stage] || 0) + 1;
    });
    
    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
    
    return {
      totalUsers,
      totalProjects,
      totalMessages,
      totalCompletedTasks,
      stageProgress,
      recentActivities: recentActivities.map(a => ({
        userId: a.user.email,
        projectId: a.projectId,
        timestamp: a.createdAt.toISOString(),
        type: a.type,
        stage: a.stage,
        task: a.task,
        ...(a.details as object || {}),
      })),
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    return {
      totalUsers: 0,
      totalProjects: 0,
      totalMessages: 0,
      totalCompletedTasks: 0,
      stageProgress: {},
      recentActivities: [],
    };
  }
}

export async function getUserActivities(userEmail) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    
    if (!user) return [];
    
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    return activities.map(a => ({
      userId: userEmail,
      projectId: a.projectId,
      timestamp: a.createdAt.toISOString(),
      type: a.type,
      stage: a.stage,
      task: a.task,
      ...(a.details as object || {}),
    }));
  } catch (error) {
    console.error("Error getting user activities:", error);
    return [];
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        projects: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    return users.map(user => ({
      userId: user.email,
      projectCount: user.projects.length,
      projects: user.projects.map(p => ({
        id: p.id,
        name: p.name,
        completedTasks: p.completedTasks,
        deliverables: p.deliverables,
      })),
      lastActive: user.activities[0]?.createdAt?.toISOString() || null,
      totalActivities: user.activities.length,
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export async function getConversations(userEmail, projectId, taskId) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    
    if (!user) return [];
    
    if (taskId) {
      // Get specific conversation
      const conversation = await prisma.conversation.findUnique({
        where: {
          projectId_taskId: {
            projectId,
            taskId,
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          project: true,
        },
      });
      
      if (!conversation) return [];
      
      return conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
    }
    
    // Get all conversations for project
    const conversations = await prisma.conversation.findMany({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        project: true,
      },
    });
    
    return conversations.map(conv => ({
      taskId: conv.taskId,
      messages: conv.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      deliverable: conv.project.deliverables?.[conv.taskId] || null,
    }));
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
}