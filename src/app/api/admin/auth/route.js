import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "p@55w0rd123";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return Response.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 86400 * 1000);

    await prisma.adminSession.create({ data: { token, expiresAt } });

    const cookieStore = cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return Response.json({ success: true, message: "Admin login successful" });
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json({ success: false, message: "Login failed" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token");

    if (!token) return Response.json({ authenticated: false });

    const session = await prisma.adminSession.findUnique({ where: { token: token.value } });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.adminSession.delete({ where: { token: token.value } });
      return Response.json({ authenticated: false });
    }

    return Response.json({ authenticated: true, username: ADMIN_USERNAME });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json({ authenticated: false });
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token");

    if (token) {
      await prisma.adminSession.deleteMany({ where: { token: token.value } });
      cookieStore.delete("admin_token");
    }

    return Response.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ success: false, message: "Logout failed" }, { status: 500 });
  }
}
