import prisma from "@/lib/prisma";

export async function getUserData(userEmail) {
  try {
    // Get user with their projects
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return { projects: [] };
    }

    // Transform to match the existing format
    return {
      projects: user.projects.map(project => ({
        id: project.id,
        name: project.name,
        completedTasks: project.completedTasks,
        deliverables: project.deliverables,
      })),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { projects: [] };
  }
}

export async function setUserData(userEmail, data) {
  try {
    // First ensure the user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update or create projects
    for (const project of data.projects) {
      if (project.id) {
        // Update existing project
        await prisma.project.upsert({
          where: { id: project.id },
          update: {
            name: project.name,
            completedTasks: project.completedTasks || {},
            deliverables: project.deliverables || {},
          },
          create: {
            id: project.id,
            name: project.name,
            userId: user.id,
            completedTasks: project.completedTasks || {},
            deliverables: project.deliverables || {},
          },
        });
      } else {
        // Create new project
        await prisma.project.create({
          data: {
            name: project.name,
            userId: user.id,
            completedTasks: project.completedTasks || {},
            deliverables: project.deliverables || {},
          },
        });
      }
    }

    // Delete projects that are no longer in the list
    const projectIds = data.projects.filter(p => p.id).map(p => p.id);
    await prisma.project.deleteMany({
      where: {
        userId: user.id,
        id: { notIn: projectIds },
      },
    });
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
}
