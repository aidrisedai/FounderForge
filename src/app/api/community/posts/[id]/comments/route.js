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
  const commentBody = typeof body.body === "string" ? body.body.trim().slice(0, 4000) : "";
  if (!commentBody) return Response.json({ error: "Comment body required" }, { status: 400 });

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { postId: post.id, authorId: me.id, body: commentBody },
      include: { author: { select: { id: true, name: true, image: true } } },
    }),
    prisma.post.update({ where: { id: post.id }, data: { commentCount: { increment: 1 } } }),
  ]);

  return Response.json({ comment }, { status: 201 });
}
