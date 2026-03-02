import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function verifyAdmin() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token");

    if (!token) return false;

    const session = await prisma.adminSession.findUnique({ where: { token: token.value } });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.adminSession.delete({ where: { token: token.value } });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Admin verification error:", error);
    return false;
  }
}

export async function requireAdmin() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return Response.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  return null;
}
