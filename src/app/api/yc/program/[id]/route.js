import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// DELETE: archive a program (draft or sprint). Frees one of the MAX_PROGRAMS
// slots; the data is kept with status "abandoned" rather than hard-deleted.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const result = await prisma.yCProgram.updateMany({
      where: { id, userId: session.user.id, status: { not: "abandoned" } },
      data: { status: "abandoned" },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to archive program" }, { status: 500 });
  }
}
