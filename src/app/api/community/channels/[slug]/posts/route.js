import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "new"; // "new" | "top"

  const channel = await prisma.channel.findUnique({ where: { slug: params.slug } });
  if (!channel) return Response.json({ error: "Channel not found" }, { status: 404 });

  const posts = await prisma.post.findMany({
    where: { channelId: channel.id },
    orderBy: sort === "top" ? { voteScore: "desc" } : { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

  // Attach current user's vote to each post
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  const myVotes = me ? await prisma.postVote.findMany({
    where: { userId: me.id, postId: { in: posts.map((p) => p.id) } },
  }) : [];
  const voteMap = Object.fromEntries(myVotes.map((v) => [v.postId, v.value]));

  return Response.json({
    channel,
    posts: posts.map((p) => ({ ...p, myVote: voteMap[p.id] ?? 0 })),
  });
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return Response.json({ error: "User not found" }, { status: 404 });

  const channel = await prisma.channel.findUnique({ where: { slug: params.slug } });
  if (!channel) return Response.json({ error: "Channel not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 300) : "";
  const postBody = typeof body.body === "string" ? body.body.trim().slice(0, 10000) : "";
  if (!title) return Response.json({ error: "Title required" }, { status: 400 });
  if (!postBody) return Response.json({ error: "Body required" }, { status: 400 });

  const post = await prisma.post.create({
    data: { channelId: channel.id, authorId: me.id, title, body: postBody },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return Response.json({ post }, { status: 201 });
}
