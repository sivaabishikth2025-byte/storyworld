import { SESSION_COOKIE } from "@/lib/auth/cookies"
import { verifySession } from "@/lib/auth/session"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ user: null })
  const user = verifySession(token)
  if (!user) {
    jar.delete(SESSION_COOKIE)
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user })
}
