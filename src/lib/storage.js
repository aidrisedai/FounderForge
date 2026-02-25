import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Simple file-based storage per user. Replace with a database in production.
const DATA_DIR = join(process.cwd(), ".data", "users");

async function ensureDir() {
  try { await mkdir(DATA_DIR, { recursive: true }); } catch {}
}

function userFile(userId) {
  // Sanitize userId for filename
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(DATA_DIR, `${safe}.json`);
}

export async function getUserData(userId) {
  await ensureDir();
  try {
    const raw = await readFile(userFile(userId), "utf-8");
    return JSON.parse(raw);
  } catch {
    return { projects: [] };
  }
}

export async function setUserData(userId, data) {
  await ensureDir();
  await writeFile(userFile(userId), JSON.stringify(data, null, 2));
}
