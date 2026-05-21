import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/community/messages — list of conversation threads
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: me.id }, { receiverId: me.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  });

  // Group into threads keyed by other user id, keep latest message per thread
  const threads = {};
  for (const msg of messages) {
    const otherId = msg.senderId === me.id ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === me.id ? msg.receiver : msg.sender;
    if (!threads[otherId]) {
      threads[otherId] = { otherUser, lastMessage: msg, unread: 0 };
    }
    if (!msg.read && msg.receiverId === me.id) {
      threads[otherId].unread++;
    }
  }

  return Response.json({ threads: Object.values(threads) });
}
