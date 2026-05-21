import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const [publicRooms, myMemberships] = await Promise.all([
    prisma.groupRoom.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, messages: true } },
        creator: { select: { id: true, name: true, image: true } },
      },
      take: 50,
    }),
    prisma.groupMembership.findMany({
      where: { userId: me.id },
      include: {
        room: {
          include: {
            _count: { select: { members: true, messages: true } },
            creator: { select: { id: true, name: true, image: true } },
          },
        },
      },
    }),
  ]);

  const myRoomIds = new Set(myMemberships.map((m) => m.roomId));

  return Response.json({
    publicRooms: publicRooms.map((r) => ({ ...r, isMember: myRoomIds.has(r.id) })),
    myRooms: myMemberships.map((m) => ({ ...m.room, isMember: true, role: m.role })),
    myId: me.id,
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : null;
  const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : true;
  if (!name) return Response.json({ error: "Name required" }, { status: 400 });

  const [room] = await prisma.$transaction([
    prisma.groupRoom.create({ data: { name, description, isPublic, creatorId: me.id } }),
  ]);

  await prisma.groupMembership.create({ data: { roomId: room.id, userId: me.id, role: "ADMIN" } });

  return Response.json({ room }, { status: 201 });
}
