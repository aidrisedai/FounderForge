// Enhanced Memory System for FounderForge
// Provides context persistence, conversation memory, and intelligent recall

import * as fs from "fs/promises";
import * as path from "path";

const MEMORY_DIR = path.join(process.cwd(), "data", "memory");

async function ensureMemoryDir() {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating memory directory:", error);
  }
}

function getMemoryFile(userId) {
  const sanitized = userId.replace(/[^a-zA-Z0-9.-]/g, "_");
  return path.join(MEMORY_DIR, `${sanitized}_memory.json`);
}

// Initialize or load user memory
export async function loadUserMemory(userId) {
  await ensureMemoryDir();
  const filePath = getMemoryFile(userId);
  
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    // Initialize new memory structure
    return {
      userId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      
      // Core memories about the user
      profile: {
        goals: [],
        challenges: [],
        strengths: [],
        preferences: [],
        background: null
      },
      
      // Project-specific memories
      projects: {},
      
      // Key insights and breakthroughs
      insights: [],
      
      // Important decisions made
      decisions: [],
      
      // Conversation patterns
      patterns: {
        commonQuestions: [],
        stickingPoints: [],
        successPatterns: []
      },
      
      // Progress milestones
      milestones: [],
      
      // Session summaries
      sessions: []
    };
  }
}

// Save user memory
export async function saveUserMemory(userId, memory) {
  await ensureMemoryDir();
  const filePath = getMemoryFile(userId);
  
  memory.lastActive = new Date().toISOString();
  
  await fs.writeFile(filePath, JSON.stringify(memory, null, 2));
  return memory;
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
      progress: {}
    };
  }
  
  memory.projects[projectId] = {
    ...memory.projects[projectId],
    ...update,
    lastUpdated: new Date().toISOString()
  };
  
  return memory;
}

// Add an insight or breakthrough
export function addInsight(memory, insight, context = {}) {
  memory.insights.push({
    id: `insight_${Date.now()}`,
    timestamp: new Date().toISOString(),
    content: insight,
    context,
    importance: context.importance || "normal"
  });
  
  // Keep only last 50 insights
  if (memory.insights.length > 50) {
    memory.insights = memory.insights.slice(-50);
  }
  
  return memory;
}

// Record a key decision
export function recordDecision(memory, decision, reasoning, projectId = null) {
  memory.decisions.push({
    id: `decision_${Date.now()}`,
    timestamp: new Date().toISOString(),
    decision,
    reasoning,
    projectId,
    outcome: null // Can be updated later
  });
  
  // Keep only last 30 decisions
  if (memory.decisions.length > 30) {
    memory.decisions = memory.decisions.slice(-30);
  }
  
  return memory;
}

// Track conversation patterns
export function updatePatterns(memory, type, pattern) {
  if (!memory.patterns[type]) {
    memory.patterns[type] = [];
  }
  
  // Check if pattern already exists
  const existing = memory.patterns[type].find(p => 
    p.pattern === pattern || p.content === pattern
  );
  
  if (existing) {
    existing.frequency = (existing.frequency || 1) + 1;
    existing.lastSeen = new Date().toISOString();
  } else {
    memory.patterns[type].push({
      pattern: pattern,
      frequency: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
  }
  
  // Keep only top 10 patterns per type
  memory.patterns[type] = memory.patterns[type]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
  
  return memory;
}

// Add a milestone
export function addMilestone(memory, milestone, projectId = null) {
  memory.milestones.push({
    id: `milestone_${Date.now()}`,
    timestamp: new Date().toISOString(),
    milestone,
    projectId,
    celebrated: false
  });
  
  // Keep only last 20 milestones
  if (memory.milestones.length > 20) {
    memory.milestones = memory.milestones.slice(-20);
  }
  
  return memory;
}

// Create session summary
export function createSessionSummary(memory, summary) {
  const session = {
    id: `session_${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration: summary.duration || null,
    tasksCompleted: summary.tasksCompleted || [],
    keyPoints: summary.keyPoints || [],
    nextSteps: summary.nextSteps || [],
    mood: summary.mood || "productive"
  };
  
  memory.sessions.push(session);
  
  // Keep only last 10 sessions
  if (memory.sessions.length > 10) {
    memory.sessions = memory.sessions.slice(-10);
  }
  
  return memory;
}

// Get relevant context for current task
export function getRelevantContext(memory, projectId, taskId) {
  const context = {
    project: memory.projects[projectId] || null,
    recentInsights: memory.insights.slice(-5),
    recentDecisions: memory.decisions
      .filter(d => !projectId || d.projectId === projectId)
      .slice(-3),
    patterns: {
      challenges: memory.patterns.stickingPoints || [],
      successes: memory.patterns.successPatterns || []
    },
    lastSession: memory.sessions[memory.sessions.length - 1] || null
  };
  
  return context;
}

// Extract important memories for mentor context
export function extractMemoriesForMentor(memory, projectId = null) {
  const memories = [];
  
  // Add profile info if available
  if (memory.profile.background) {
    memories.push(`Background: ${memory.profile.background}`);
  }
  
  if (memory.profile.goals.length > 0) {
    memories.push(`Goals: ${memory.profile.goals.slice(-3).join(", ")}`);
  }
  
  if (memory.profile.challenges.length > 0) {
    memories.push(`Known challenges: ${memory.profile.challenges.slice(-3).join(", ")}`);
  }
  
  // Add recent insights
  const recentInsights = memory.insights
    .filter(i => i.importance === "high")
    .slice(-2);
  
  if (recentInsights.length > 0) {
    memories.push(`Recent insights: ${recentInsights.map(i => i.content).join("; ")}`);
  }
  
  // Add project-specific context
  if (projectId && memory.projects[projectId]) {
    const project = memory.projects[projectId];
    if (project.keyLearnings.length > 0) {
      memories.push(`Project learnings: ${project.keyLearnings.slice(-2).join("; ")}`);
    }
  }
  
  // Add patterns if frequent
  const frequentChallenges = (memory.patterns.stickingPoints || [])
    .filter(p => p.frequency > 2)
    .slice(0, 2);
  
  if (frequentChallenges.length > 0) {
    memories.push(`Recurring challenges: ${frequentChallenges.map(p => p.pattern).join(", ")}`);
  }
  
  return memories.join("\n");
}

// Clean up old or irrelevant memories
export function pruneMemory(memory) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const cutoffDate = oneMonthAgo.toISOString();
  
  // Prune old insights with normal importance
  memory.insights = memory.insights.filter(i => 
    i.importance === "high" || i.timestamp > cutoffDate
  );
  
  // Prune old session summaries
  memory.sessions = memory.sessions.filter(s => 
    s.timestamp > cutoffDate
  );
  
  // Keep only active project memories
  for (const projectId in memory.projects) {
    if (memory.projects[projectId].lastUpdated < cutoffDate) {
      // Archive instead of delete
      memory.projects[projectId].archived = true;
    }
  }
  
  return memory;
}

// Check if memory needs attention
export function checkMemoryHealth(memory) {
  const health = {
    isHealthy: true,
    issues: [],
    suggestions: []
  };
  
  // Check if memory is getting too large
  const memorySize = JSON.stringify(memory).length;
  if (memorySize > 500000) { // 500KB
    health.issues.push("Memory size is large");
    health.suggestions.push("Consider pruning old memories");
    health.isHealthy = false;
  }
  
  // Check for stale data
  const lastActive = new Date(memory.lastActive);
  const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
  if (daysSinceActive > 30) {
    health.issues.push("Memory is stale");
    health.suggestions.push("Review and update user context");
  }
  
  // Check for too many uncelebrated milestones
  const uncelebrated = memory.milestones.filter(m => !m.celebrated).length;
  if (uncelebrated > 3) {
    health.suggestions.push(`Celebrate ${uncelebrated} achievements!`);
  }
  
  return health;
}

// Generate memory summary for user
export function generateMemorySummary(memory) {
  const summary = {
    totalProjects: Object.keys(memory.projects).length,
    activeProjects: Object.values(memory.projects).filter(p => !p.archived).length,
    totalInsights: memory.insights.length,
    totalDecisions: memory.decisions.length,
    totalMilestones: memory.milestones.length,
    lastActive: memory.lastActive,
    topChallenges: (memory.patterns.stickingPoints || []).slice(0, 3),
    topSuccesses: (memory.patterns.successPatterns || []).slice(0, 3),
    recentMilestones: memory.milestones.slice(-3)
  };
  
  return summary;
}

// Export memory for user download
export function exportMemory(memory) {
  return {
    exported: new Date().toISOString(),
    version: "1.0",
    ...memory
  };
}

// Import memory from backup
export function importMemory(importedData, currentMemory) {
  // Merge imported data with current memory
  const merged = {
    ...currentMemory,
    profile: {
      ...currentMemory.profile,
      ...importedData.profile
    },
    projects: {
      ...currentMemory.projects,
      ...importedData.projects
    },
    insights: [...currentMemory.insights, ...importedData.insights]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i), // Remove duplicates
    decisions: [...currentMemory.decisions, ...importedData.decisions]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
    milestones: [...currentMemory.milestones, ...importedData.milestones]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
    patterns: {
      commonQuestions: mergePatterns(
        currentMemory.patterns.commonQuestions || [],
        importedData.patterns.commonQuestions || []
      ),
      stickingPoints: mergePatterns(
        currentMemory.patterns.stickingPoints || [],
        importedData.patterns.stickingPoints || []
      ),
      successPatterns: mergePatterns(
        currentMemory.patterns.successPatterns || [],
        importedData.patterns.successPatterns || []
      )
    }
  };
  
  return pruneMemory(merged);
}

// Helper to merge pattern arrays
function mergePatterns(current, imported) {
  const merged = [...current];
  
  for (const pattern of imported) {
    const existing = merged.find(p => p.pattern === pattern.pattern);
    if (existing) {
      existing.frequency += pattern.frequency;
      existing.lastSeen = pattern.lastSeen > existing.lastSeen ? pattern.lastSeen : existing.lastSeen;
    } else {
      merged.push(pattern);
    }
  }
  
  return merged.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
}