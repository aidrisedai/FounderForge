import { requireAdmin } from "@/lib/admin-middleware";
import { getAllUsers } from "@/lib/admin-storage-db";

export async function GET(req) {
  // Check admin authentication using admin tokens
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const users = await getAllUsers();
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
