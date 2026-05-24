import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { searchVideos } from "@/lib/youtube";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = params;

  try {
    const domain = await prisma.domain.findUnique({ where: { slug } });
    if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Return cached videos first
    let videos = await prisma.domainVideo.findMany({
      where: { domainId: domain.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    // Only fetch from YouTube if this domain has never been populated,
    // or the user explicitly requests a refresh.
    if (videos.length === 0 || forceRefresh) {
      const query = domain.keywords[0] || `${domain.name} startup problems`;
      try {
        const results = await searchVideos(query, 12);

        // Collect all youtubeIds returned so we can check for existing assignments in one query
        const ids = results.map((v) => v.youtubeId);
        const existing = await prisma.domainVideo.findMany({
          where: { youtubeId: { in: ids } },
          select: { youtubeId: true, domainId: true },
        });
        const existingMap = Object.fromEntries(existing.map((e) => [e.youtubeId, e.domainId]));

        for (const v of results) {
          const assignedDomain = existingMap[v.youtubeId];
          if (assignedDomain && assignedDomain !== domain.id) {
            // Already belongs to a different domain — skip to prevent cross-domain duplicates
            continue;
          }
          await prisma.domainVideo.upsert({
            where: { youtubeId: v.youtubeId },
            update: { title: v.title, description: v.description, thumbnailUrl: v.thumbnailUrl, channelTitle: v.channelTitle },
            create: { ...v, domainId: domain.id },
          });
        }

        videos = await prisma.domainVideo.findMany({
          where: { domainId: domain.id },
          orderBy: { createdAt: "desc" },
          take: 12,
        });
      } catch (ytErr) {
        console.error("YouTube search error:", ytErr.message);
      }
    }

    return NextResponse.json({ domain, videos });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }
}
