import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const channels = await prisma.channel.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return Response.json({ channels });
}
