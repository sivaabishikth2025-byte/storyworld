import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/cookies"
import { signSession, verifyPassword } from "@/lib/auth/session"
import { findUserByEmail } from "@/lib/auth/users"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string }
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }
    const user = await findUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }
    const token = signSession({ id: user.id, email: user.email, name: user.name })
    const jar = await cookies()
    jar.set(SESSION_COOKIE, token, sessionCookieOptions())
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Login failed." }, { status: 500 })
  }
}
