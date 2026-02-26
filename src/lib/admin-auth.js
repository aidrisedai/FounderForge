import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }
    
    return handler(req, res);
  };
}