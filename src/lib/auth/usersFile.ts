import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import type { StoredUser } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    await readFile(USERS_FILE, "utf8")
  } catch {
    await writeFile(USERS_FILE, "[]", "utf8")
  }
}

async function readUsers(): Promise<StoredUser[]> {
  await ensureStore()
  const raw = await readFile(USERS_FILE, "utf8")
  return JSON.parse(raw) as StoredUser[]
}

async function writeUsers(users: StoredUser[]) {
  await ensureStore()
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8")
}

export async function findFileUserByEmail(email: string) {
  const users = await readUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

export async function createFileUser(user: StoredUser) {
  const users = await readUsers()
  if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error("An account with this email already exists.")
  }
  users.push(user)
  await writeUsers(users)
  return user
}
