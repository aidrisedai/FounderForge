import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { founderProfile: true },
  });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  return Response.json({ profile: user.founderProfile });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const { bio, linkedIn, twitter, website, openToConnect, lookingFor } = await req.json();

  const profile = await prisma.founderProfile.upsert({
    where: { userId: user.id },
    update: { bio, linkedIn, twitter, website, openToConnect, lookingFor },
    create: { userId: user.id, bio, linkedIn, twitter, website, openToConnect, lookingFor: lookingFor || [] },
  });

  return Response.json({ profile });
}
