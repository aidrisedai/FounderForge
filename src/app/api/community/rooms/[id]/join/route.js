import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const room = await prisma.groupRoom.findUnique({ where: { id: params.id } });
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  if (!room.isPublic) return Response.json({ error: "Room is private" }, { status: 403 });

  const existing = await prisma.groupMembership.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: me.id } },
  });
  if (existing) return Response.json({ ok: true, alreadyMember: true });

  await prisma.groupMembership.create({ data: { roomId: room.id, userId: me.id, role: "MEMBER" } });
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  await prisma.groupMembership.deleteMany({ where: { roomId: params.id, userId: me.id } });
  return Response.json({ ok: true });
}
