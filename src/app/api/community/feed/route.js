import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  // Collect IDs of accepted connections to show their posts in feed
  const connections = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: me.id }, { receiverId: me.id }],
    },
    select: { requesterId: true, receiverId: true },
  });
  const connectedIds = connections.map((c) => c.requesterId === me.id ? c.receiverId : c.requesterId);

  // Show own posts + connections' posts. Fall back to all public posts if no connections.
  const authorIds = [me.id, ...connectedIds];

  const posts = await prisma.feedPost.findMany({
    where: connectedIds.length > 0 ? { authorId: { in: authorIds } } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, image: true, founderProfile: { select: { bio: true } } } },
      reactions: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return Response.json({ posts, myId: me.id });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const postBody = typeof body.body === "string" ? body.body.trim().slice(0, 3000) : "";
  if (!postBody) return Response.json({ error: "Body required" }, { status: 400 });
  const milestone = typeof body.milestone === "string" ? body.milestone.trim().slice(0, 200) || null : null;
  const taskId = typeof body.taskId === "string" ? body.taskId : null;
  const stepId = typeof body.stepId === "number" ? body.stepId : null;

  const post = await prisma.feedPost.create({
    data: { authorId: me.id, body: postBody, milestone, taskId, stepId },
    include: {
      author: { select: { id: true, name: true, image: true, founderProfile: { select: { bio: true } } } },
      reactions: true,
      comments: true,
    },
  });

  return Response.json({ post }, { status: 201 });
}
