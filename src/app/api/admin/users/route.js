import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getAllUsers } from "@/lib/admin-storage";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return Response.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }
  
  try {
    const users = await getAllUsers();
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}