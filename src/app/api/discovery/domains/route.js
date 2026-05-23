import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, icon: true },
    });
    return NextResponse.json(domains);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load domains" }, { status: 500 });
  }
}
