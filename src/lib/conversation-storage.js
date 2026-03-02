import prisma from "@/lib/prisma";

export async function getConversation(projectId, taskId) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        projectId_taskId: {
          projectId,
          taskId,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    return conversation?.messages || [];
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return [];
  }
}

export async function saveMessage(projectId, taskId, role, content) {
  try {
    // First ensure conversation exists
    const conversation = await prisma.conversation.upsert({
      where: {
        projectId_taskId: {
          projectId,
          taskId,
        },
      },
      create: {
        projectId,
        taskId,
      },
      update: {},
    });
    
    // Save the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role,
        content,
      },
    });
    
    return message;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}

export async function getProjectConversations(projectId) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    return conversations;
  } catch (error) {
    console.error("Error fetching project conversations:", error);
    return [];
  }
}

export async function getUserConversations(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          include: {
            conversations: {
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    
    if (!user) return [];
    
    const allConversations = [];
    user.projects.forEach(project => {
      project.conversations.forEach(conversation => {
        allConversations.push({
          projectId: project.id,
          projectName: project.name,
          taskId: conversation.taskId,
          messages: conversation.messages,
        });
      });
    });
    
    return allConversations;
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    return [];
  }
}