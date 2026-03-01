import { cookies } from "next/headers";

export async function verifyAdmin() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token");
    
    if (!token) {
      return false;
    }
    
    // Check if token is valid (in production, verify against database/Redis)
    global.adminTokens = global.adminTokens || new Set();
    return global.adminTokens.has(token.value);
    
  } catch (error) {
    console.error("Admin verification error:", error);
    return false;
  }
}

export async function requireAdmin() {
  const isAdmin = await verifyAdmin();
  
  if (!isAdmin) {
    return Response.json({ 
      error: "Unauthorized - Admin access required" 
    }, { status: 401 });
  }
  
  return null; // Continue with request
}