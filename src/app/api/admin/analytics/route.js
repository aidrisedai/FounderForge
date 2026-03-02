import { requireAdmin } from "@/lib/admin-middleware";
import { getAnalyticsSummary } from "@/lib/admin-storage-db";

export async function GET(req) {
  // Check admin authentication using admin tokens
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const analytics = await getAnalyticsSummary();
    return Response.json(analytics);
  } catch (error) {
    return Response.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
