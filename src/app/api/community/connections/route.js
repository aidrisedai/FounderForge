import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const [sent, received] = await Promise.all([
    prisma.connection.findMany({
      where: { requesterId: me.id },
      include: {
        receiver: {
          select: {
            id: true, name: true, image: true,
            founderProfile: true,
            stats: { select: { level: true, xp: true } },
            projects: { select: { name: true }, orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.connection.findMany({
      where: { receiverId: me.id },
      include: {
        requester: {
          select: {
            id: true, name: true, image: true,
            founderProfile: true,
            stats: { select: { level: true, xp: true } },
            projects: { select: { name: true }, orderBy: { updatedAt: "desc" }, take: 1 },
          },
        },
      },
    }),
  ]);

  const connections = [
    ...sent.map((c) => ({ ...c, otherUser: c.receiver, direction: "sent" })),
    ...received.map((c) => ({ ...c, otherUser: c.requester, direction: "received" })),
  ];

  return Response.json({ connections });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { receiverId } = body;
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) || null : null;

  if (!receiverId || typeof receiverId !== "string") return Response.json({ error: "receiverId required" }, { status: 400 });
  if (receiverId === me.id) return Response.json({ error: "Cannot connect with yourself" }, { status: 400 });

  // Validate receiver exists and has an open community profile
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    include: { founderProfile: true },
  });
  if (!receiver) return Response.json({ error: "Receiver not found" }, { status: 404 });
  if (!receiver.founderProfile?.openToConnect) return Response.json({ error: "Receiver is not open to connections" }, { status: 403 });

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: me.id, receiverId },
        { requesterId: receiverId, receiverId: me.id },
      ],
    },
  });
  if (existing) return Response.json({ error: "Connection already exists" }, { status: 409 });

  const connection = await prisma.connection.create({
    data: { requesterId: me.id, receiverId, message, status: "PENDING" },
  });

  return Response.json({ connection }, { status: 201 });
}
