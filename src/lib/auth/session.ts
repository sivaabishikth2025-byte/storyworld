import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto"

export type SessionUser = {
  id: string
  email: string
  name: string
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14

export function getAuthSecret() {
  return process.env.AUTH_SECRET || "storyworld-dev-secret-change-in-production"
}

export function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(16).toString("hex")
  const hash = scryptSync(password, s, 64).toString("hex")
  return `${s}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [s, hash] = stored.split(":")
  if (!s || !hash) return false
  const next = scryptSync(password, s, 64).toString("hex")
  return timingSafeEqual(Buffer.from(next), Buffer.from(hash))
}

export function signSession(user: SessionUser) {
  const payload = {
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", getAuthSecret()).update(data).digest("base64url")
  return `${data}.${sig}`
}

export function verifySession(token: string): SessionUser | null {
  const [data, sig] = token.split(".")
  if (!data || !sig) return null
  const expected = createHmac("sha256", getAuthSecret()).update(data).digest("base64url")
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionUser & { exp?: number }
    if (!payload.exp || payload.exp < Date.now()) return null
    return { id: payload.id, email: payload.email, name: payload.name }
  } catch {
    return null
  }
}
