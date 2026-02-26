import fs from 'fs/promises';
import path from 'path';

const ADMIN_DATA_DIR = path.join(process.cwd(), '.data', 'admin');
const ANALYTICS_FILE = path.join(ADMIN_DATA_DIR, 'analytics.json');
const ACTIVITIES_DIR = path.join(ADMIN_DATA_DIR, 'activities');

async function ensureAdminDirs() {
  await fs.mkdir(ADMIN_DATA_DIR, { recursive: true });
  await fs.mkdir(ACTIVITIES_DIR, { recursive: true });
}

export async function logUserActivity(userId, projectId, activity) {
  await ensureAdminDirs();
  
  const timestamp = new Date().toISOString();
  const activityLog = {
    userId,
    projectId,
    timestamp,
    ...activity
  };
  
  const dayFile = path.join(ACTIVITIES_DIR, `${new Date().toISOString().split('T')[0]}.json`);
  
  try {
    const existing = await fs.readFile(dayFile, 'utf8');
    const activities = JSON.parse(existing);
    activities.push(activityLog);
    await fs.writeFile(dayFile, JSON.stringify(activities, null, 2));
  } catch {
    await fs.writeFile(dayFile, JSON.stringify([activityLog], null, 2));
  }
  
  return activityLog;
}

export async function getAnalyticsSummary() {
  await ensureAdminDirs();
  
  try {
    const files = await fs.readdir(ACTIVITIES_DIR);
    let allActivities = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(ACTIVITIES_DIR, file), 'utf8');
        const activities = JSON.parse(content);
        allActivities = allActivities.concat(activities);
      }
    }
    
    const userSet = new Set();
    const projectSet = new Set();
    let totalMessages = 0;
    let totalCompletedTasks = 0;
    const stageProgress = {};
    
    allActivities.forEach(activity => {
      userSet.add(activity.userId);
      if (activity.projectId) projectSet.add(activity.projectId);
      if (activity.type === 'message') totalMessages++;
      if (activity.type === 'task_completed') {
        totalCompletedTasks++;
        const stage = activity.stage || '1';
        stageProgress[stage] = (stageProgress[stage] || 0) + 1;
      }
    });
    
    return {
      totalUsers: userSet.size,
      totalProjects: projectSet.size,
      totalMessages,
      totalCompletedTasks,
      stageProgress,
      recentActivities: allActivities.slice(-100).reverse()
    };
  } catch {
    return {
      totalUsers: 0,
      totalProjects: 0,
      totalMessages: 0,
      totalCompletedTasks: 0,
      stageProgress: {},
      recentActivities: []
    };
  }
}

export async function getUserActivities(userId) {
  await ensureAdminDirs();
  
  const files = await fs.readdir(ACTIVITIES_DIR);
  let userActivities = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(ACTIVITIES_DIR, file), 'utf8');
      const activities = JSON.parse(content);
      const filtered = activities.filter(a => a.userId === userId);
      userActivities = userActivities.concat(filtered);
    }
  }
  
  return userActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getAllUsers() {
  const usersDir = path.join(process.cwd(), '.data', 'users');
  
  try {
    const files = await fs.readdir(usersDir);
    const users = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const userId = file.replace('.json', '');
        const content = await fs.readFile(path.join(usersDir, file), 'utf8');
        const userData = JSON.parse(content);
        
        const userActivities = await getUserActivities(userId);
        const lastActive = userActivities[0]?.timestamp || null;
        
        users.push({
          userId,
          projectCount: userData.projects?.length || 0,
          projects: userData.projects || [],
          lastActive,
          totalActivities: userActivities.length
        });
      }
    }
    
    return users.sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));
  } catch {
    return [];
  }
}

export async function getConversations(userId, projectId, taskId) {
  const usersDir = path.join(process.cwd(), '.data', 'users');
  const userFile = path.join(usersDir, `${userId}.json`);
  
  try {
    const content = await fs.readFile(userFile, 'utf8');
    const userData = JSON.parse(content);
    const project = userData.projects?.find(p => p.id === projectId);
    
    if (!project) return [];
    
    if (taskId && project.taskMessages?.[taskId]) {
      return project.taskMessages[taskId];
    }
    
    const allConversations = [];
    if (project.taskMessages) {
      Object.entries(project.taskMessages).forEach(([task, messages]) => {
        allConversations.push({
          taskId: task,
          messages,
          deliverable: project.deliverables?.[task]
        });
      });
    }
    
    return allConversations;
  } catch {
    return [];
  }
}