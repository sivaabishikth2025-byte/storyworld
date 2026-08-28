import { clientWorldPayload, getWorld } from "@/lib/marble"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(req: Request) {
  const worldId = new URL(req.url).searchParams.get("worldId") || ""
  if (!worldId || worldId.includes("..")) {
    return NextResponse.json({ error: "missing worldId" }, { status: 400 })
  }
  try {
    const world = await getWorld(worldId)
    const id = world.id || worldId
    return NextResponse.json({
      worldId: id,
      marbleUrl: clientWorldPayload(world, id).marbleUrl,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "load failed" }, { status: 502 })
  }
}
