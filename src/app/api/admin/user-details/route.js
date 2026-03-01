import { requireAdmin } from "@/lib/admin-middleware";
import * as fs from "fs/promises";
import * as path from "path";
import { CURRICULUM } from "@/lib/curriculum";

const DATA_DIR = path.join(process.cwd(), ".data", "users");
const PERSONALITY_DIR = path.join(process.cwd(), "data", "personalities");
const MEMORY_DIR = path.join(process.cwd(), "data", "memory");

// GET - Get detailed user data including conversations
export async function GET(request) {
  // Check admin authentication
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    if (!email) {
      return Response.json({ 
        error: "Email parameter required" 
      }, { status: 400 });
    }
    
    // Sanitize email for filename
    const sanitized = email.replace(/[^a-zA-Z0-9.-]/g, "_");
    const userFile = path.join(DATA_DIR, `${sanitized}.json`);
    
    // Get user data
    let userData = null;
    try {
      const data = await fs.readFile(userFile, "utf-8");
      userData = JSON.parse(data);
    } catch {
      return Response.json({ 
        error: "User not found" 
      }, { status: 404 });
    }
    
    // Get personality data
    let personality = null;
    try {
      const personalityFile = path.join(PERSONALITY_DIR, `${sanitized}.json`);
      const data = await fs.readFile(personalityFile, "utf-8");
      personality = JSON.parse(data);
    } catch {}
    
    // Get memory data
    let memory = null;
    try {
      const memoryFile = path.join(MEMORY_DIR, `${sanitized}_memory.json`);
      const data = await fs.readFile(memoryFile, "utf-8");
      memory = JSON.parse(data);
    } catch {}
    
    // Process conversations from all projects
    const allConversations = [];
    
    if (userData.projects) {
      userData.projects.forEach(project => {
        const taskMessages = project.taskMessages || {};
        
        Object.entries(taskMessages).forEach(([taskId, messages]) => {
          // Find the task in curriculum
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
          
          if (taskInfo && messages.length > 0) {
            allConversations.push({
              projectId: project.id,
              projectName: project.name,
              taskId,
              taskTitle: taskInfo.title,
              stepTitle: stepInfo.title,
              stepId: stepInfo.id,
              messageCount: messages.length,
              messages,
              deliverable: project.deliverables?.[taskId] || null,
              completed: (project.completedTasks?.[stepInfo.id] || 0) > stepInfo.tasks.indexOf(taskInfo)
            });
          }
        });
      });
    }
    
    // Sort conversations by most recent first
    allConversations.sort((a, b) => b.messages.length - a.messages.length);
    
    // Calculate overall stats
    const stats = {
      totalProjects: userData.projects?.length || 0,
      totalConversations: allConversations.length,
      totalMessages: allConversations.reduce((sum, c) => sum + c.messageCount, 0),
      completedTasks: 0,
      totalDeliverables: 0
    };
    
    if (userData.projects) {
      userData.projects.forEach(project => {
        const completed = project.completedTasks || {};
        Object.values(completed).forEach(count => {
          stats.completedTasks += count;
        });
        
        const deliverables = project.deliverables || {};
        stats.totalDeliverables += Object.keys(deliverables).length;
      });
    }
    
    return Response.json({
      success: true,
      user: {
        email,
        projects: userData.projects || [],
        conversations: allConversations,
        personality,
        memory: memory ? {
          insights: memory.insights || [],
          milestones: memory.milestones || [],
          decisions: memory.decisions || [],
          patterns: memory.patterns || {},
          profile: memory.profile || {},
          lastActive: memory.lastActive
        } : null,
        stats
      }
    });
    
  } catch (error) {
    console.error("Error fetching user details:", error);
    return Response.json({ 
      error: "Failed to fetch user details" 
    }, { status: 500 });
  }
}