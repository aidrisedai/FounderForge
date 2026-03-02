import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET - Retrieve user's personality profile
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { personality: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.personality) {
      return Response.json({ personality: null });
    }

    return Response.json({
      personality: {
        workStyle: user.personality.workStyle,
        experience: user.personality.experience,
        motivation: user.personality.motivation,
        learning: user.personality.learning,
        pace: user.personality.pace,
        completed: user.personality.completed,
      },
    });
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updatedPersonality = await prisma.personality.upsert({
      where: { userId: user.id },
      update: {
        workStyle: personality.workStyle || null,
        experience: personality.experience || null,
        motivation: personality.motivation || null,
        learning: personality.learning || null,
        pace: personality.pace || null,
        completed: completed || false,
      },
      create: {
        userId: user.id,
        workStyle: personality.workStyle || null,
        experience: personality.experience || null,
        motivation: personality.motivation || null,
        learning: personality.learning || null,
        pace: personality.pace || null,
        completed: completed || false,
      },
    });
    
    return Response.json({ 
      success: true, 
      personality: {
        workStyle: updatedPersonality.workStyle,
        experience: updatedPersonality.experience,
        motivation: updatedPersonality.motivation,
        learning: updatedPersonality.learning,
        pace: updatedPersonality.pace,
        completed: updatedPersonality.completed,
      },
    });
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.personality.delete({
      where: { userId: user.id },
    });
    
    return Response.json({ success: true });
  } catch (error) {
    // Personality doesn't exist, that's okay
    if (error.code === 'P2025') {
      return Response.json({ success: true });
    }
    console.error("Error deleting personality:", error);
    return Response.json({ error: "Failed to delete personality" }, { status: 500 });
  }
}