import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const post = await prisma.feedPost.findUnique({ where: { id: params.id } });
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const commentBody = typeof body.body === "string" ? body.body.trim().slice(0, 2000) : "";
  if (!commentBody) return Response.json({ error: "Body required" }, { status: 400 });

  const comment = await prisma.feedComment.create({
    data: { feedPostId: post.id, authorId: me.id, body: commentBody },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return Response.json({ comment }, { status: 201 });
}
