import { getServerSession } from "next-auth";
import { getUserData, setUserData } from "@/lib/storage";

export async function GET(req) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getUserData(session.user.email);
  return Response.json(data);
}

export async function POST(req) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await setUserData(session.user.email, body);
  return Response.json({ ok: true });
}
