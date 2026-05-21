import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const connection = await prisma.connection.findUnique({ where: { id: params.id } });
  if (!connection) return Response.json({ error: "Connection not found" }, { status: 404 });

  // Only the receiver can accept/decline; either party can withdraw a PENDING request
  const { action } = await req.json(); // "accept" | "decline" | "withdraw"

  if (action === "accept" || action === "decline") {
    if (connection.receiverId !== me.id) {
      return Response.json({ error: "Only the receiver can accept or decline" }, { status: 403 });
    }
    const updated = await prisma.connection.update({
      where: { id: params.id },
      data: { status: action === "accept" ? "ACCEPTED" : "DECLINED" },
    });
    return Response.json({ connection: updated });
  }

  if (action === "withdraw") {
    if (connection.requesterId !== me.id && connection.receiverId !== me.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.connection.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
