import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      channel: { select: { slug: true, name: true, icon: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  const myVote = me ? await prisma.postVote.findUnique({
    where: { postId_userId: { postId: post.id, userId: me.id } },
  }) : null;

  return Response.json({ post, myVote: myVote?.value ?? 0, myId: me?.id });
}
