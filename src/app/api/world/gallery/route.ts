import { listWorlds } from "@/lib/marble"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") || "24")
  try {
    const worlds = await listWorlds(Math.min(48, Math.max(1, limit)))
    return NextResponse.json({ worlds })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "gallery failed" }, { status: 502 })
  }
}
