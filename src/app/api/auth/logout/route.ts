import { SESSION_COOKIE } from "@/lib/auth/cookies"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
