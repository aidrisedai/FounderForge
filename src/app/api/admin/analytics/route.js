import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getAnalyticsSummary } from "@/lib/admin-storage";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return Response.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }
  
  try {
    const analytics = await getAnalyticsSummary();
    return Response.json(analytics);
  } catch (error) {
    return Response.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}