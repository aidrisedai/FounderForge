import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const membership = await prisma.groupMembership.findUnique({
    where: { roomId_userId: { roomId: params.id, userId: me.id } },
  });
  if (!membership) return Response.json({ error: "Not a member" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // createdAt ISO string for pagination

  const messages = await prisma.groupMessage.findMany({
    where: {
      roomId: params.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  return Response.json({ messages: messages.reverse(), myId: me.id });
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const membership = await prisma.groupMembership.findUnique({
    where: { roomId_userId: { roomId: params.id, userId: me.id } },
  });
  if (!membership) return Response.json({ error: "Not a member" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 4000) : "";
  if (!content) return Response.json({ error: "Content required" }, { status: 400 });

  const message = await prisma.groupMessage.create({
    data: { roomId: params.id, senderId: me.id, content },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  return Response.json({ message }, { status: 201 });
}
