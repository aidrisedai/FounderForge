import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  calculateTaskXP,
  awardXP,
  updateStreak,
  checkAchievements,
  getUserStats,
  updateUserStats
} from "@/lib/gamification";
import { CURRICULUM } from "@/lib/curriculum";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskId, projectId, timeSpent, deliverable } = await request.json();
    const userId = session.user.email;
    
    // Find task in curriculum to determine complexity
    let taskInfo = null;
    let stepInfo = null;
    for (const step of CURRICULUM) {
      const task = step.tasks.find(t => t.id === taskId);
      if (task) {
        taskInfo = task;
        stepInfo = step;
        break;
      }
    }
    
    // Determine task complexity
    const taskComplexity = taskInfo?.difficulty || "moderate";
    
    // Calculate XP earned
    const xpEarned = calculateTaskXP(taskComplexity, timeSpent || 60, true);
    
    // Award XP
    const xpResult = await awardXP(userId, xpEarned, `Completed task: ${taskInfo?.title || taskId}`);
    
    // Update streak
    const newStreak = await updateStreak(userId);
    
    // Update task completion count
    const stats = await getUserStats(userId);
    await updateUserStats(userId, {
      tasksCompleted: stats.tasksCompleted + 1,
      totalTimeSpent: stats.totalTimeSpent + (timeSpent || 60),
      averageSpeed: (stats.totalTimeSpent + (timeSpent || 60)) / (stats.tasksCompleted + 1)
    });
    
    // Prepare context for achievement checking
    const context = {
      taskTime: timeSpent,
      dailyTaskCount: await getDailyTaskCount(userId),
      stageCompleted: await checkStageCompleted(userId, projectId, stepInfo?.id),
      totalDeliverables: await getTotalDeliverables(userId),
      projectCount: await getProjectCount(userId),
      curriculumProgress: await getCurriculumProgress(userId)
    };
    
    // Check for new achievements
    const newAchievements = await checkAchievements(userId, context);
    
    return NextResponse.json({
      success: true,
      xpEarned,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      currentStats: xpResult.stats,
      newStreak,
      achievements: newAchievements
    });
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json({ error: "Failed to complete task" }, { status: 500 });
  }
}

// Helper functions
async function getDailyTaskCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    if (prisma) {
      const count = await prisma.activity.count({
        where: {
          userId,
          type: "task_complete",
          createdAt: { gte: today }
        }
      });
      return count;
    }
  } catch {
    // Fallback to estimate
    return 1;
  }
  return 1;
}

async function checkStageCompleted(userId, projectId, stageId) {
  if (!stageId || !projectId) return false;
  
  try {
    if (prisma) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      
      if (!project) return false;
      
      const stage = CURRICULUM.find(s => s.id === stageId);
      if (!stage) return false;
      
      const completedInStage = project.completedTasks?.[stageId] || 0;
      return completedInStage >= stage.tasks.length;
    }
  } catch {
    return false;
  }
  return false;
}

async function getTotalDeliverables(userId) {
  try {
    if (prisma) {
      const projects = await prisma.project.findMany({
        where: { userId }
      });
      
      let total = 0;
      projects.forEach(p => {
        total += Object.keys(p.deliverables || {}).length;
      });
      return total;
    }
  } catch {
    return 0;
  }
  return 0;
}

async function getProjectCount(userId) {
  try {
    if (prisma) {
      const count = await prisma.project.count({
        where: { userId }
      });
      return count;
    }
  } catch {
    return 1;
  }
  return 1;
}

async function getCurriculumProgress(userId) {
  try {
    if (prisma) {
      const projects = await prisma.project.findMany({
        where: { userId }
      });
      
      let totalTasks = 0;
      let completedTasks = 0;
      
      CURRICULUM.forEach(stage => {
        totalTasks += stage.tasks.length;
        projects.forEach(p => {
          completedTasks += p.completedTasks?.[stage.id] || 0;
        });
      });
      
      return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    }
  } catch {
    return 0;
  }
  return 0;
}