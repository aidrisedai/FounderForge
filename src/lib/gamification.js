import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

// Level definitions
export const LEVELS = [
  { level: 1, name: "Dreamer", minXP: 0, maxXP: 100 },
  { level: 2, name: "Explorer", minXP: 100, maxXP: 250 },
  { level: 3, name: "Builder", minXP: 250, maxXP: 500 },
  { level: 4, name: "Innovator", minXP: 500, maxXP: 1000 },
  { level: 5, name: "Achiever", minXP: 1000, maxXP: 2000 },
  { level: 6, name: "Pioneer", minXP: 2000, maxXP: 3500 },
  { level: 7, name: "Visionary", minXP: 3500, maxXP: 5500 },
  { level: 8, name: "Champion", minXP: 5500, maxXP: 8000 },
  { level: 9, name: "Master", minXP: 8000, maxXP: 12000 },
  { level: 10, name: "Legend", minXP: 12000, maxXP: Infinity }
];

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: "fast_starter",
    name: "Fast Starter",
    description: "Complete your first task in under 30 minutes",
    icon: "⚡",
    category: "speed",
    requirement: { type: "speed", taskTime: 30 },
    xpReward: 50
  },
  {
    id: "on_fire",
    name: "On Fire",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    category: "consistency",
    requirement: { type: "streak", days: 7 },
    xpReward: 100
  },
  {
    id: "lightning_speed",
    name: "Lightning Speed",
    description: "Complete 5 tasks in one day",
    icon: "⚡",
    category: "speed",
    requirement: { type: "daily_tasks", count: 5 },
    xpReward: 75
  },
  {
    id: "stage_master",
    name: "Stage Master",
    description: "Complete an entire stage",
    icon: "🎯",
    category: "milestone",
    requirement: { type: "stage_complete" },
    xpReward: 150
  },
  {
    id: "quality_focused",
    name: "Quality Focused",
    description: "Submit 10 high-quality deliverables",
    icon: "⭐",
    category: "quality",
    requirement: { type: "deliverables", count: 10 },
    xpReward: 100
  },
  {
    id: "consistent_achiever",
    name: "Consistent Achiever",
    description: "Complete at least one task for 30 days",
    icon: "🏆",
    category: "consistency",
    requirement: { type: "streak", days: 30 },
    xpReward: 200
  },
  {
    id: "project_launcher",
    name: "Project Launcher",
    description: "Create and work on 3 different projects",
    icon: "🚀",
    category: "milestone",
    requirement: { type: "projects", count: 3 },
    xpReward: 75
  },
  {
    id: "halfway_hero",
    name: "Halfway Hero",
    description: "Reach the halfway point in the curriculum",
    icon: "🌟",
    category: "milestone",
    requirement: { type: "curriculum_progress", percentage: 50 },
    xpReward: 150
  }
];

// File-based storage paths
const STATS_DIR = path.join(process.cwd(), "data", "gamification", "stats");
const ACHIEVEMENTS_DIR = path.join(process.cwd(), "data", "gamification", "achievements");
const LEADERBOARD_DIR = path.join(process.cwd(), "data", "gamification", "leaderboard");

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(STATS_DIR, { recursive: true });
  await fs.mkdir(ACHIEVEMENTS_DIR, { recursive: true });
  await fs.mkdir(LEADERBOARD_DIR, { recursive: true });
}

// Get user stats (database or file-based)
export async function getUserStats(userId) {
  try {
    // Try database first
    if (prisma) {
      const stats = await prisma.userStats.findUnique({ where: { userId } });
      if (stats) return stats;
      
      // Create default stats if not found
      return await prisma.userStats.create({
        data: { userId, xp: 0, level: 1, points: 0, streak: 0 }
      });
    }
  } catch (error) {
    console.log("Database not available, using file storage");
  }

  // Fallback to file storage
  await ensureDirectories();
  const statsFile = path.join(STATS_DIR, `${userId}.json`);
  
  try {
    const data = await fs.readFile(statsFile, "utf8");
    return JSON.parse(data);
  } catch {
    // Create default stats
    const defaultStats = {
      userId,
      xp: 0,
      level: 1,
      points: 0,
      streak: 0,
      tasksCompleted: 0,
      totalTimeSpent: 0,
      averageSpeed: 0,
      perfectDays: 0,
      lastActiveDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await fs.writeFile(statsFile, JSON.stringify(defaultStats, null, 2));
    return defaultStats;
  }
}

// Update user stats
export async function updateUserStats(userId, updates) {
  try {
    // Try database first
    if (prisma) {
      return await prisma.userStats.update({
        where: { userId },
        data: updates
      });
    }
  } catch (error) {
    console.log("Database not available, using file storage");
  }

  // Fallback to file storage
  await ensureDirectories();
  const statsFile = path.join(STATS_DIR, `${userId}.json`);
  const currentStats = await getUserStats(userId);
  const updatedStats = { ...currentStats, ...updates, updatedAt: new Date().toISOString() };
  await fs.writeFile(statsFile, JSON.stringify(updatedStats, null, 2));
  return updatedStats;
}

// Calculate XP for task completion
export function calculateTaskXP(taskType, timeSpent, isFirstAttempt = true) {
  let baseXP = 0;
  
  // Base XP by task type
  switch (taskType) {
    case "simple": baseXP = 10; break;
    case "moderate": baseXP = 25; break;
    case "complex": baseXP = 50; break;
    default: baseXP = 20;
  }
  
  // Speed bonus (if completed under expected time)
  const expectedTime = taskType === "simple" ? 30 : taskType === "complex" ? 120 : 60;
  if (timeSpent < expectedTime) {
    const speedBonus = Math.floor((expectedTime - timeSpent) / expectedTime * 10);
    baseXP += speedBonus;
  }
  
  // First attempt bonus
  if (isFirstAttempt) {
    baseXP += 5;
  }
  
  return baseXP;
}

// Get current level from XP
export function getLevelFromXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// Award XP and check for level up
export async function awardXP(userId, xpAmount, reason) {
  const stats = await getUserStats(userId);
  const newXP = stats.xp + xpAmount;
  const oldLevel = getLevelFromXP(stats.xp);
  const newLevel = getLevelFromXP(newXP);
  
  const updates = {
    xp: newXP,
    points: stats.points + xpAmount,
    level: newLevel.level
  };
  
  const updatedStats = await updateUserStats(userId, updates);
  
  const leveledUp = newLevel.level > oldLevel.level;
  
  return {
    stats: updatedStats,
    xpAwarded: xpAmount,
    leveledUp,
    newLevel: leveledUp ? newLevel : null,
    reason
  };
}

// Update streak
export async function updateStreak(userId) {
  const stats = await getUserStats(userId);
  const lastActive = new Date(stats.lastActiveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastActive.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  
  let newStreak = stats.streak;
  if (daysDiff === 0) {
    // Same day, streak continues
  } else if (daysDiff === 1) {
    // Next day, increment streak
    newStreak = stats.streak + 1;
  } else {
    // Streak broken
    newStreak = 1;
  }
  
  await updateUserStats(userId, {
    streak: newStreak,
    lastActiveDate: new Date().toISOString()
  });
  
  return newStreak;
}

// Get user achievements
export async function getUserAchievements(userId) {
  try {
    // Try database first
    if (prisma) {
      const achievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true }
      });
      return achievements;
    }
  } catch (error) {
    console.log("Database not available, using file storage");
  }

  // Fallback to file storage
  await ensureDirectories();
  const achievementsFile = path.join(ACHIEVEMENTS_DIR, `${userId}.json`);
  
  try {
    const data = await fs.readFile(achievementsFile, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Award achievement
export async function awardAchievement(userId, achievementId) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;
  
  // Check if already earned
  const userAchievements = await getUserAchievements(userId);
  if (userAchievements.some(ua => ua.achievementId === achievementId)) {
    return null; // Already earned
  }
  
  try {
    // Try database first
    if (prisma) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          earnedAt: new Date()
        }
      });
      
      // Award XP for achievement
      await awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`);
      
      return { userAchievement, achievement };
    }
  } catch (error) {
    console.log("Database not available, using file storage");
  }
  
  // Fallback to file storage
  await ensureDirectories();
  const achievementsFile = path.join(ACHIEVEMENTS_DIR, `${userId}.json`);
  
  const newAchievement = {
    achievementId,
    userId,
    earnedAt: new Date().toISOString(),
    celebrated: false
  };
  
  userAchievements.push(newAchievement);
  await fs.writeFile(achievementsFile, JSON.stringify(userAchievements, null, 2));
  
  // Award XP
  await awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`);
  
  return { userAchievement: newAchievement, achievement };
}

// Check for new achievements
export async function checkAchievements(userId, context) {
  const earned = [];
  const stats = await getUserStats(userId);
  const userAchievements = await getUserAchievements(userId);
  const earnedIds = userAchievements.map(ua => ua.achievementId);
  
  for (const achievement of ACHIEVEMENTS) {
    if (earnedIds.includes(achievement.id)) continue;
    
    let shouldAward = false;
    
    switch (achievement.requirement.type) {
      case "speed":
        if (context.taskTime && context.taskTime < achievement.requirement.taskTime) {
          shouldAward = true;
        }
        break;
      case "streak":
        if (stats.streak >= achievement.requirement.days) {
          shouldAward = true;
        }
        break;
      case "daily_tasks":
        if (context.dailyTaskCount >= achievement.requirement.count) {
          shouldAward = true;
        }
        break;
      case "stage_complete":
        if (context.stageCompleted) {
          shouldAward = true;
        }
        break;
      case "deliverables":
        if (context.totalDeliverables >= achievement.requirement.count) {
          shouldAward = true;
        }
        break;
      case "projects":
        if (context.projectCount >= achievement.requirement.count) {
          shouldAward = true;
        }
        break;
      case "curriculum_progress":
        if (context.curriculumProgress >= achievement.requirement.percentage) {
          shouldAward = true;
        }
        break;
    }
    
    if (shouldAward) {
      const result = await awardAchievement(userId, achievement.id);
      if (result) earned.push(result);
    }
  }
  
  return earned;
}

// Get leaderboard
export async function getLeaderboard(period = "all") {
  try {
    // Try database first
    if (prisma) {
      if (period === "all") {
        const users = await prisma.userStats.findMany({
          orderBy: { xp: "desc" },
          take: 100,
          include: { user: { select: { name: true, email: true, image: true } } }
        });
        return users.map((u, idx) => ({
          rank: idx + 1,
          userId: u.userId,
          name: u.user.name || u.user.email,
          xp: u.xp,
          level: u.level,
          streak: u.streak
        }));
      } else {
        const entries = await prisma.leaderboardEntry.findMany({
          where: { period },
          orderBy: { rank: "asc" },
          take: 100,
          include: { user: { select: { name: true, email: true } } }
        });
        return entries.map(e => ({
          rank: e.rank,
          userId: e.userId,
          name: e.user.name || e.user.email,
          xpEarned: e.xpEarned
        }));
      }
    }
  } catch (error) {
    console.log("Database not available, using file storage");
  }
  
  // Fallback to file storage
  await ensureDirectories();
  const leaderboardFile = path.join(LEADERBOARD_DIR, `${period}.json`);
  
  try {
    const data = await fs.readFile(leaderboardFile, "utf8");
    return JSON.parse(data);
  } catch {
    // Read all user stats and generate leaderboard
    const statsFiles = await fs.readdir(STATS_DIR);
    const allStats = [];
    
    for (const file of statsFiles) {
      if (file.endsWith(".json")) {
        const data = await fs.readFile(path.join(STATS_DIR, file), "utf8");
        allStats.push(JSON.parse(data));
      }
    }
    
    allStats.sort((a, b) => b.xp - a.xp);
    
    const leaderboard = allStats.slice(0, 100).map((s, idx) => ({
      rank: idx + 1,
      userId: s.userId,
      name: s.name || s.userId,
      xp: s.xp,
      level: s.level,
      streak: s.streak
    }));
    
    await fs.writeFile(leaderboardFile, JSON.stringify(leaderboard, null, 2));
    return leaderboard;
  }
}

// Update leaderboard (called periodically)
export async function updateLeaderboard(period) {
  const leaderboard = await getLeaderboard("all");
  
  // Store snapshot
  await ensureDirectories();
  const leaderboardFile = path.join(LEADERBOARD_DIR, `${period}.json`);
  await fs.writeFile(leaderboardFile, JSON.stringify(leaderboard, null, 2));
  
  // If using database, also store in LeaderboardEntry table
  try {
    if (prisma) {
      for (const entry of leaderboard) {
        await prisma.leaderboardEntry.upsert({
          where: { userId_period: { userId: entry.userId, period } },
          create: {
            userId: entry.userId,
            period,
            xpEarned: entry.xp,
            rank: entry.rank
          },
          update: {
            xpEarned: entry.xp,
            rank: entry.rank
          }
        });
      }
    }
  } catch (error) {
    console.log("Could not update database leaderboard");
  }
}