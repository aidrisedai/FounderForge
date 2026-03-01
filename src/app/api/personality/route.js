import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import * as fs from "fs/promises";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "personalities");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating personality data directory:", error);
  }
}

async function getUserPersonalityFile(email) {
  await ensureDataDir();
  const sanitized = email.replace(/[^a-zA-Z0-9.-]/g, "_");
  return path.join(DATA_DIR, `${sanitized}.json`);
}

// GET - Retrieve user's personality profile
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = await getUserPersonalityFile(session.user.email);
    
    try {
      const data = await fs.readFile(filePath, "utf-8");
      const personality = JSON.parse(data);
      return Response.json({ personality });
    } catch (error) {
      // No personality profile yet
      return Response.json({ personality: null });
    }
  } catch (error) {
    console.error("Error fetching personality:", error);
    return Response.json({ error: "Failed to fetch personality" }, { status: 500 });
  }
}

// POST - Save or update personality profile
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { personality, completed } = await request.json();
    
    if (!personality) {
      return Response.json({ error: "No personality data provided" }, { status: 400 });
    }

    const filePath = await getUserPersonalityFile(session.user.email);
    
    const data = {
      personality,
      completed: completed || false,
      updatedAt: new Date().toISOString(),
      userEmail: session.user.email,
      userName: session.user.name
    };
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return Response.json({ success: true, personality: data.personality });
  } catch (error) {
    console.error("Error saving personality:", error);
    return Response.json({ error: "Failed to save personality" }, { status: 500 });
  }
}

// DELETE - Remove personality profile
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = await getUserPersonalityFile(session.user.email);
    
    try {
      await fs.unlink(filePath);
      return Response.json({ success: true });
    } catch (error) {
      // File doesn't exist, that's okay
      return Response.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting personality:", error);
    return Response.json({ error: "Failed to delete personality" }, { status: 500 });
  }
}