import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

  const existing = await prisma.postVote.findUnique({
    where: { postId_userId: { postId: post.id, userId: me.id } },
  });

  let delta = 0;

  if (value === 0 || existing?.value === value) {
    // Remove vote (toggle off)
    if (existing) {
      await prisma.postVote.delete({ where: { id: existing.id } });
      delta = -existing.value;
    }
  } else if (existing) {
    // Change vote direction
    delta = value - existing.value;
    await prisma.postVote.update({ where: { id: existing.id }, data: { value } });
  } else {
    // New vote
    delta = value;
    await prisma.postVote.create({ data: { postId: post.id, userId: me.id, value } });
  }

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { voteScore: { increment: delta } },
    select: { voteScore: true },
  });

  const newVote = value === 0 || existing?.value === value ? 0 : value;
  return Response.json({ voteScore: updated.voteScore, myVote: newVote });
}
