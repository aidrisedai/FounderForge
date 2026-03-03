const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACHIEVEMENTS = [
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

async function initAchievements() {
  console.log('Initializing achievements...');
  
  for (const achievement of ACHIEVEMENTS) {
    try {
      await prisma.achievement.upsert({
        where: { name: achievement.name },
        update: achievement,
        create: achievement
      });
      console.log(`✓ Created/updated achievement: ${achievement.name}`);
    } catch (error) {
      console.error(`Error creating achievement ${achievement.name}:`, error.message);
    }
  }
  
  console.log('Achievements initialized successfully!');
  await prisma.$disconnect();
}

initAchievements().catch((error) => {
  console.error('Failed to initialize achievements:', error);
  process.exit(1);
});