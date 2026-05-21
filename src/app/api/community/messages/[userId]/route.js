import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/community/messages/[userId] — fetch conversation
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const otherId = params.userId;

  // Verify they are connected
  const conn = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: me.id, receiverId: otherId },
        { requesterId: otherId, receiverId: me.id },
      ],
    },
  });
  if (!conn) return Response.json({ error: "Not connected" }, { status: 403 });

  const [messages, otherUser] = await Promise.all([
    prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: me.id, receiverId: otherId },
          { senderId: otherId, receiverId: me.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, name: true, image: true, founderProfile: true },
    }),
  ]);

  // Mark incoming messages as read
  await prisma.directMessage.updateMany({
    where: { senderId: otherId, receiverId: me.id, read: false },
    data: { read: true },
  });

  return Response.json({ messages, otherUser, myId: me.id });
}

// POST /api/community/messages/[userId] — send a message
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const otherId = params.userId;
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.content !== "string") return Response.json({ error: "Content required" }, { status: 400 });
  const content = body.content.trim().slice(0, 4000);
  if (!content) return Response.json({ error: "Content required" }, { status: 400 });

  const conn = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: me.id, receiverId: otherId },
        { requesterId: otherId, receiverId: me.id },
      ],
    },
  });
  if (!conn) return Response.json({ error: "Not connected" }, { status: 403 });

  const message = await prisma.directMessage.create({
    data: { senderId: me.id, receiverId: otherId, content },
  });

  return Response.json({ message }, { status: 201 });
}
