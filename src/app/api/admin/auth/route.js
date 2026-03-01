import { cookies } from "next/headers";
import crypto from "crypto";

// Admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "p@55w0rd123";

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// POST - Admin login
export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Verify credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateToken();
      const cookieStore = cookies();
      
      // Set admin session cookie (expires in 24 hours)
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400, // 24 hours
        path: "/"
      });
      
      // Store token in memory for validation (in production, use Redis or database)
      global.adminTokens = global.adminTokens || new Set();
      global.adminTokens.add(token);
      
      return Response.json({ 
        success: true, 
        message: "Admin login successful" 
      });
    }
    
    return Response.json({ 
      success: false, 
      message: "Invalid credentials" 
    }, { status: 401 });
    
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json({ 
      success: false, 
      message: "Login failed" 
    }, { status: 500 });
  }
}

// GET - Check admin authentication status
export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token");
    
    if (!token) {
      return Response.json({ authenticated: false });
    }
    
    // Verify token is valid
    global.adminTokens = global.adminTokens || new Set();
    const isValid = global.adminTokens.has(token.value);
    
    return Response.json({ 
      authenticated: isValid,
      username: isValid ? ADMIN_USERNAME : null
    });
    
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json({ authenticated: false });
  }
}

// DELETE - Admin logout
export async function DELETE(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token");
    
    if (token) {
      // Remove token from memory
      global.adminTokens = global.adminTokens || new Set();
      global.adminTokens.delete(token.value);
      
      // Delete cookie
      cookieStore.delete("admin_token");
    }
    
    return Response.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
    
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ 
      success: false, 
      message: "Logout failed" 
    }, { status: 500 });
  }
}