import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  loadUserMemory,
  saveUserMemory,
  updateProjectMemory,
  addInsight,
  recordDecision,
  updatePatterns,
  addMilestone,
  createSessionSummary,
  getRelevantContext,
  generateMemorySummary,
  checkMemoryHealth,
  pruneMemory,
  exportMemory
} from "@/lib/memory";

// GET - Retrieve memory or specific context
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    const memory = await loadUserMemory(userId);

    switch (action) {
      case "context":
        // Get relevant context for current task
        const context = getRelevantContext(memory, projectId, taskId);
        return Response.json({ context });

      case "summary":
        // Get memory summary
        const summary = generateMemorySummary(memory);
        return Response.json({ summary });

      case "health":
        // Check memory health
        const health = checkMemoryHealth(memory);
        return Response.json({ health });

      case "export":
        // Export memory for download
        const exported = exportMemory(memory);
        return Response.json(exported);

      default:
        // Return full memory
        return Response.json({ memory });
    }
  } catch (error) {
    console.error("Error fetching memory:", error);
    return Response.json({ error: "Failed to fetch memory" }, { status: 500 });
  }
}

// POST - Update memory
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    let memory = await loadUserMemory(userId);

    switch (action) {
      case "updateProject":
        memory = updateProjectMemory(memory, data.projectId, data.update);
        break;

      case "addInsight":
        memory = addInsight(memory, data.insight, data.context);
        break;

      case "recordDecision":
        memory = recordDecision(memory, data.decision, data.reasoning, data.projectId);
        break;

      case "updatePattern":
        memory = updatePatterns(memory, data.type, data.pattern);
        break;

      case "addMilestone":
        memory = addMilestone(memory, data.milestone, data.projectId);
        break;

      case "sessionSummary":
        memory = createSessionSummary(memory, data.summary);
        break;

      case "updateProfile":
        memory.profile = { ...memory.profile, ...data.profile };
        break;

      case "prune":
        memory = pruneMemory(memory);
        break;

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await saveUserMemory(userId, memory);
    return Response.json({ success: true, memory });
  } catch (error) {
    console.error("Error updating memory:", error);
    return Response.json({ error: "Failed to update memory" }, { status: 500 });
  }
}

// DELETE - Clear specific memory sections
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const projectId = searchParams.get("projectId");

    const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    let memory = await loadUserMemory(userId);

    switch (section) {
      case "project":
        if (projectId && memory.projects[projectId]) {
          delete memory.projects[projectId];
        }
        break;

      case "insights":
        memory.insights = [];
        break;

      case "decisions":
        memory.decisions = [];
        break;

      case "patterns":
        memory.patterns = {
          commonQuestions: [],
          stickingPoints: [],
          successPatterns: []
        };
        break;

      case "sessions":
        memory.sessions = [];
        break;

      case "all":
        // Reset to fresh memory
        memory = await loadUserMemory(userId + "_reset");
        break;

      default:
        return Response.json({ error: "Invalid section" }, { status: 400 });
    }

    await saveUserMemory(userId, memory);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error clearing memory:", error);
    return Response.json({ error: "Failed to clear memory" }, { status: 500 });
  }
}