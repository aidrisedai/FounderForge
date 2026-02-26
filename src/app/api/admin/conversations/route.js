import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getConversations, getUserActivities } from "@/lib/admin-storage";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return Response.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }
  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');
  
  try {
    if (userId && projectId) {
      const conversations = await getConversations(userId, projectId, taskId);
      return Response.json(conversations);
    } else if (userId) {
      const activities = await getUserActivities(userId);
      return Response.json(activities);
    } else {
      return Response.json({ error: "Missing required parameters" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}