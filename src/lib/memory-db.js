import prisma from "@/lib/prisma";

// Initialize or load user memory
export async function loadUserMemory(userEmail) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        memory: {
          include: {
            insights: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
            milestones: {
              orderBy: { createdAt: 'desc' },
              take: 30,
            },
            decisions: {
              orderBy: { createdAt: 'desc' },
              take: 30,
            },
            patterns: {
              orderBy: { lastSeen: 'desc' },
            },
            sessions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.memory) {
      // Create new memory for user
      const memory = await prisma.memory.create({
        data: {
          userId: user.id,
          profile: {
            goals: [],
            challenges: [],
            strengths: [],
            preferences: [],
            background: null,
          },
        },
        include: {
          insights: true,
          milestones: true,
          decisions: true,
          patterns: true,
          sessions: true,
        },
      });
      return transformMemory(memory);
    }

    return transformMemory(user.memory);
  } catch (error) {
    console.error("Error loading memory:", error);
    return createEmptyMemory(userEmail);
  }
}

// Transform database memory to match existing format
function transformMemory(dbMemory) {
  return {
    userId: dbMemory.userId,
    createdAt: dbMemory.createdAt.toISOString(),
    lastActive: dbMemory.lastActive.toISOString(),
    profile: dbMemory.profile || {
      goals: [],
      challenges: [],
      strengths: [],
      preferences: [],
      background: null,
    },
    projects: {}, // TODO: Load from project-specific data
    insights: dbMemory.insights?.map(i => ({
      id: i.id,
      timestamp: i.createdAt.toISOString(),
      content: i.content,
      context: i.context || {},
      importance: i.importance,
    })) || [],
    decisions: dbMemory.decisions?.map(d => ({
      id: d.id,
      timestamp: d.createdAt.toISOString(),
      decision: d.decision,
      reasoning: d.reasoning,
      projectId: d.projectId,
      outcome: d.outcome,
    })) || [],
    patterns: {
      commonQuestions: dbMemory.patterns?.filter(p => p.type === 'commonQuestions').map(p => ({
        pattern: p.pattern,
        frequency: p.frequency,
        firstSeen: p.firstSeen.toISOString(),
        lastSeen: p.lastSeen.toISOString(),
      })) || [],
      stickingPoints: dbMemory.patterns?.filter(p => p.type === 'stickingPoints').map(p => ({
        pattern: p.pattern,
        frequency: p.frequency,
        firstSeen: p.firstSeen.toISOString(),
        lastSeen: p.lastSeen.toISOString(),
      })) || [],
      successPatterns: dbMemory.patterns?.filter(p => p.type === 'successPatterns').map(p => ({
        pattern: p.pattern,
        frequency: p.frequency,
        firstSeen: p.firstSeen.toISOString(),
        lastSeen: p.lastSeen.toISOString(),
      })) || [],
    },
    milestones: dbMemory.milestones?.map(m => ({
      id: m.id,
      timestamp: m.createdAt.toISOString(),
      milestone: m.milestone,
      projectId: m.projectId,
      celebrated: m.celebrated,
    })) || [],
    sessions: dbMemory.sessions?.map(s => ({
      id: s.id,
      timestamp: s.createdAt.toISOString(),
      duration: s.duration,
      tasksCompleted: s.tasksCompleted,
      keyPoints: s.keyPoints,
      nextSteps: s.nextSteps,
      mood: s.mood,
    })) || [],
  };
}

function createEmptyMemory(userId) {
  return {
    userId,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    profile: {
      goals: [],
      challenges: [],
      strengths: [],
      preferences: [],
      background: null,
    },
    projects: {},
    insights: [],
    decisions: [],
    patterns: {
      commonQuestions: [],
      stickingPoints: [],
      successPatterns: [],
    },
    milestones: [],
    sessions: [],
  };
}

// Save user memory (updates existing memory)
export async function saveUserMemory(userEmail, memoryData) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update memory last active
    await prisma.memory.update({
      where: { userId: user.id },
      data: {
        lastActive: new Date(),
        profile: memoryData.profile,
      },
    });

    return memoryData;
  } catch (error) {
    console.error("Error saving memory:", error);
    throw error;
  }
}

// Update project-specific memory
export function updateProjectMemory(memory, projectId, update) {
  if (!memory.projects[projectId]) {
    memory.projects[projectId] = {
      id: projectId,
      createdAt: new Date().toISOString(),
      context: {},
      keyLearnings: [],
      challenges: [],
      progress: {},
    };
  }
  
  memory.projects[projectId] = {
    ...memory.projects[projectId],
    ...update,
    lastUpdated: new Date().toISOString(),
  };
  
  return memory;
}

// Add an insight or breakthrough
export async function addInsight(memory, insight, context = {}) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: memory.userId },
      include: { memory: true },
    });

    if (!user?.memory) {
      return memory;
    }

    await prisma.insight.create({
      data: {
        memoryId: user.memory.id,
        content: insight,
        context: context,
        importance: context.importance || "normal",
      },
    });

    memory.insights.push({
      id: `insight_${Date.now()}`,
      timestamp: new Date().toISOString(),
      content: insight,
      context,
      importance: context.importance || "normal",
    });
    
    // Keep only last 50 insights in local memory
    if (memory.insights.length > 50) {
      memory.insights = memory.insights.slice(-50);
    }
  } catch (error) {
    console.error("Error adding insight:", error);
  }
  
  return memory;
}

// Record a key decision
export async function recordDecision(memory, decision, reasoning, projectId = null) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: memory.userId },
      include: { memory: true },
    });

    if (!user?.memory) {
      return memory;
    }

    await prisma.decision.create({
      data: {
        memoryId: user.memory.id,
        decision,
        reasoning,
        projectId,
      },
    });

    memory.decisions.push({
      id: `decision_${Date.now()}`,
      timestamp: new Date().toISOString(),
      decision,
      reasoning,
      projectId,
      outcome: null,
    });
    
    // Keep only last 30 decisions in local memory
    if (memory.decisions.length > 30) {
      memory.decisions = memory.decisions.slice(-30);
    }
  } catch (error) {
    console.error("Error recording decision:", error);
  }
  
  return memory;
}

// Track conversation patterns
export async function updatePatterns(memory, type, pattern) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: memory.userId },
      include: { memory: true },
    });

    if (!user?.memory) {
      return memory;
    }

    // Check if pattern already exists
    const existing = await prisma.pattern.findFirst({
      where: {
        memoryId: user.memory.id,
        type,
        pattern,
      },
    });

    if (existing) {
      await prisma.pattern.update({
        where: { id: existing.id },
        data: {
          frequency: existing.frequency + 1,
          lastSeen: new Date(),
        },
      });
    } else {
      await prisma.pattern.create({
        data: {
          memoryId: user.memory.id,
          type,
          pattern,
          frequency: 1,
        },
      });
    }

    // Update local memory structure
    if (!memory.patterns[type]) {
      memory.patterns[type] = [];
    }
    
    const existingLocal = memory.patterns[type].find(p => 
      p.pattern === pattern || p.content === pattern
    );
    
    if (existingLocal) {
      existingLocal.frequency = (existingLocal.frequency || 1) + 1;
      existingLocal.lastSeen = new Date().toISOString();
    } else {
      memory.patterns[type].push({
        pattern,
        frequency: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
    }
    
    // Keep only top 20 patterns per type
    if (memory.patterns[type].length > 20) {
      memory.patterns[type] = memory.patterns[type]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20);
    }
  } catch (error) {
    console.error("Error updating patterns:", error);
  }
  
  return memory;
}

// Add a milestone
export async function addMilestone(memory, milestone, projectId = null) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: memory.userId },
      include: { memory: true },
    });

    if (!user?.memory) {
      return memory;
    }

    await prisma.milestone.create({
      data: {
        memoryId: user.memory.id,
        milestone,
        projectId,
      },
    });

    memory.milestones.push({
      id: `milestone_${Date.now()}`,
      timestamp: new Date().toISOString(),
      milestone,
      projectId,
      celebrated: false,
    });
    
    // Keep only last 30 milestones
    if (memory.milestones.length > 30) {
      memory.milestones = memory.milestones.slice(-30);
    }
  } catch (error) {
    console.error("Error adding milestone:", error);
  }
  
  return memory;
}

// Create session summary
export async function createSessionSummary(memory, summary) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: memory.userId },
      include: { memory: true },
    });

    if (!user?.memory) {
      return memory;
    }

    await prisma.session.create({
      data: {
        memoryId: user.memory.id,
        duration: summary.duration,
        tasksCompleted: summary.tasksCompleted || [],
        keyPoints: summary.keyPoints || [],
        nextSteps: summary.nextSteps || [],
        mood: summary.mood,
      },
    });

    memory.sessions.push({
      id: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...summary,
    });
    
    // Keep only last 10 sessions
    if (memory.sessions.length > 10) {
      memory.sessions = memory.sessions.slice(-10);
    }
  } catch (error) {
    console.error("Error creating session summary:", error);
  }
  
  return memory;
}

// Export all other functions from the original memory.js
export {
  getRelevantContext,
  extractMemoriesForMentor,
  generateMemorySummary,
  checkMemoryHealth,
  pruneMemory,
  exportMemory,
} from "./memory";