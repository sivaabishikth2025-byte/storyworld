import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/cookies"
import { signSession } from "@/lib/auth/session"
import { createUser } from "@/lib/auth/users"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { email, name, password } = (await req.json()) as {
      email?: string
      name?: string
      password?: string
    }
    if (!email?.trim() || !name?.trim() || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }
    const user = await createUser({ email, name, password })
    const token = signSession({ id: user.id, email: user.email, name: user.name })
    const jar = await cookies()
    jar.set(SESSION_COOKIE, token, sessionCookieOptions())
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed."
    const status = /already exists/i.test(message) ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
