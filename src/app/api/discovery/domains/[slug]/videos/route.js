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

    // Return cached videos first
    let videos = await prisma.domainVideo.findMany({
      where: { domainId: domain.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    // If fewer than 4 cached, refresh from YouTube
    if (videos.length < 4) {
      const query = domain.keywords[0] || `${domain.name} startup problems`;
      try {
        const results = await searchVideos(query, 12);
        // Upsert each video
        for (const v of results) {
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
