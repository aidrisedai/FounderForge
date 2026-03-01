import { requireAdmin } from "@/lib/admin-middleware";
import * as fs from "fs/promises";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "users");
const PERSONALITY_DIR = path.join(process.cwd(), "data", "personalities");
const MEMORY_DIR = path.join(process.cwd(), "data", "memory");

async function getAllUserData() {
  const users = [];
  
  try {
    // Get all user files
    const files = await fs.readdir(DATA_DIR).catch(() => []);
    
    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const filePath = path.join(DATA_DIR, file);
          const data = await fs.readFile(filePath, "utf-8");
          const userData = JSON.parse(data);
          
          // Extract email from filename
          const email = file.replace(".json", "").replace(/_/g, "@").replace(/-at-/g, "@");
          
          // Get personality data if exists
          let personality = null;
          try {
            const personalityFile = path.join(PERSONALITY_DIR, file);
            const personalityData = await fs.readFile(personalityFile, "utf-8");
            personality = JSON.parse(personalityData).personality;
          } catch {}
          
          // Get memory summary if exists
          let memorySummary = null;
          try {
            const memoryFile = path.join(MEMORY_DIR, file.replace(".json", "_memory.json"));
            const memoryData = await fs.readFile(memoryFile, "utf-8");
            const memory = JSON.parse(memoryData);
            memorySummary = {
              insights: memory.insights?.length || 0,
              milestones: memory.milestones?.length || 0,
              lastActive: memory.lastActive
            };
          } catch {}
          
          // Calculate progress
          let totalTasks = 0;
          let completedTasks = 0;
          
          if (userData.projects && userData.projects.length > 0) {
            userData.projects.forEach(project => {
              const completed = project.completedTasks || {};
              Object.values(completed).forEach(count => {
                completedTasks += count;
              });
            });
            totalTasks = 38; // Total tasks in curriculum
          }
          
          users.push({
            email,
            projects: userData.projects?.length || 0,
            activeProject: userData.projects?.[0]?.name || "None",
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            completedTasks,
            totalTasks,
            personality: personality ? true : false,
            memorySummary,
            lastActive: memorySummary?.lastActive || "Unknown",
            rawData: userData
          });
          
        } catch (error) {
          console.error(`Error reading user file ${file}:`, error);
        }
      }
    }
    
    // Sort by last active
    users.sort((a, b) => {
      if (a.lastActive === "Unknown") return 1;
      if (b.lastActive === "Unknown") return -1;
      return new Date(b.lastActive) - new Date(a.lastActive);
    });
    
  } catch (error) {
    console.error("Error reading user data:", error);
  }
  
  return users;
}

// GET - Get all users data
export async function GET(request) {
  // Check admin authentication
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    const users = await getAllUserData();
    
    return Response.json({ 
      success: true,
      users,
      totalUsers: users.length,
      activeUsers: users.filter(u => {
        if (!u.lastActive || u.lastActive === "Unknown") return false;
        const daysSinceActive = (Date.now() - new Date(u.lastActive)) / (1000 * 60 * 60 * 24);
        return daysSinceActive < 7;
      }).length
    });
    
  } catch (error) {
    console.error("Error fetching all users:", error);
    return Response.json({ 
      error: "Failed to fetch users" 
    }, { status: 500 });
  }
}