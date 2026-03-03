import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  getUserStats, 
  getUserAchievements, 
  getLeaderboard,
  LEVELS,
  ACHIEVEMENTS 
} from "@/lib/gamification";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    const userId = session.user.email;

    if (type === "leaderboard") {
      const period = searchParams.get("period") || "all";
      const leaderboard = await getLeaderboard(period);
      
      // Find current user's rank
      const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;
      
      return NextResponse.json({
        leaderboard,
        userRank: userRank > 0 ? userRank : null,
        totalPlayers: leaderboard.length
      });
    }

    // Get user's complete gamification data
    const stats = await getUserStats(userId);
    const achievements = await getUserAchievements(userId);
    const leaderboard = await getLeaderboard("all");
    
    // Find user's rank
    const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;
    
    // Get current level info
    const currentLevel = LEVELS.find(l => l.level === stats.level) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === stats.level + 1);
    
    // Calculate progress to next level
    const xpInCurrentLevel = stats.xp - currentLevel.minXP;
    const xpNeededForLevel = (nextLevel?.minXP || currentLevel.maxXP) - currentLevel.minXP;
    const progressPercentage = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
    
    // Get earned achievement details
    const earnedAchievements = achievements.map(ua => {
      const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
      return {
        ...achievement,
        earnedAt: ua.earnedAt,
        celebrated: ua.celebrated
      };
    });
    
    // Get unearned achievements
    const unearnedAchievements = ACHIEVEMENTS.filter(
      a => !achievements.some(ua => ua.achievementId === a.id)
    );

    return NextResponse.json({
      stats: {
        ...stats,
        currentLevel,
        nextLevel,
        progressPercentage,
        xpToNextLevel: nextLevel ? nextLevel.minXP - stats.xp : 0
      },
      achievements: {
        earned: earnedAchievements,
        unearned: unearnedAchievements,
        total: ACHIEVEMENTS.length,
        earnedCount: earnedAchievements.length
      },
      leaderboard: {
        rank: userRank > 0 ? userRank : null,
        totalPlayers: leaderboard.length,
        topPlayers: leaderboard.slice(0, 10)
      }
    });
  } catch (error) {
    console.error("Error fetching gamification stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}