import { requireAdmin } from "@/lib/admin-middleware";
import { getConversations, getUserActivities } from "@/lib/admin-storage-db";

export async function GET(req) {
  // Check admin authentication using admin tokens
  const authError = await requireAdmin();
  if (authError) return authError;

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
