import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const VALID_LOOKING_FOR = ["peer", "co-founder", "advisor", "investor"];
const BIO_MAX = 1000;

function clean(value, max = 500) {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

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

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const bio = clean(body.bio, BIO_MAX);
  const linkedIn = clean(body.linkedIn, 300);
  const twitter = clean(body.twitter, 100);
  const website = clean(body.website, 300);
  const openToConnect = typeof body.openToConnect === "boolean" ? body.openToConnect : true;
  const lookingFor = Array.isArray(body.lookingFor)
    ? body.lookingFor.filter((x) => typeof x === "string" && VALID_LOOKING_FOR.includes(x)).slice(0, VALID_LOOKING_FOR.length)
    : [];

  const data = { bio, linkedIn, twitter, website, openToConnect, lookingFor };

  const profile = await prisma.founderProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return Response.json({ profile });
}
