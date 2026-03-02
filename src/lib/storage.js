import prisma from "./prisma";

export async function getUserData(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      projects: {
        include: {
          conversations: {
            include: { messages: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });

  if (!user) return { projects: [] };

  const projects = user.projects.map((p) => {
    const taskMessages = {};
    for (const conv of p.conversations) {
      taskMessages[conv.taskId] = conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }
    return {
      id: p.id,
      name: p.name,
      completedTasks: p.completedTasks,
      deliverables: p.deliverables,
      taskMessages,
    };
  });

  return { projects };
}

export async function setUserData(email, data) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const incomingProjects = data.projects || [];

  for (const p of incomingProjects) {
    const project = await prisma.project.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        completedTasks: p.completedTasks || {},
        deliverables: p.deliverables || {},
      },
      create: {
        id: p.id,
        name: p.name,
        userId: user.id,
        completedTasks: p.completedTasks || {},
        deliverables: p.deliverables || {},
      },
    });

    if (p.taskMessages) {
      for (const [taskId, messages] of Object.entries(p.taskMessages)) {
        const conv = await prisma.conversation.upsert({
          where: { projectId_taskId: { projectId: project.id, taskId } },
          update: {},
          create: { projectId: project.id, taskId },
        });

        const existingCount = await prisma.message.count({
          where: { conversationId: conv.id },
        });

        if (messages.length > existingCount) {
          const newMessages = messages.slice(existingCount);
          await prisma.message.createMany({
            data: newMessages.map((m) => ({
              conversationId: conv.id,
              role: m.role,
              content: m.content,
            })),
          });
        }
      }
    }
  }

  const existingIds = (
    await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
  ).map((p) => p.id);

  const incomingIds = incomingProjects.map((p) => p.id);
  const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

  if (toDelete.length > 0) {
    await prisma.project.deleteMany({ where: { id: { in: toDelete } } });
  }
}
