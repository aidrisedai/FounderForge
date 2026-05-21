import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const VALID_TYPES = ["like", "celebrate", "insightful"];

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const type = VALID_TYPES.includes(body.type) ? body.type : "like";

  const existing = await prisma.feedReaction.findUnique({
    where: { feedPostId_userId: { feedPostId: params.id, userId: me.id } },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.feedReaction.delete({ where: { id: existing.id } });
      return Response.json({ removed: true, type });
    }
    const updated = await prisma.feedReaction.update({ where: { id: existing.id }, data: { type } });
    return Response.json({ reaction: updated });
  }

  const reaction = await prisma.feedReaction.create({
    data: { feedPostId: params.id, userId: me.id, type },
  });
  return Response.json({ reaction }, { status: 201 });
}
