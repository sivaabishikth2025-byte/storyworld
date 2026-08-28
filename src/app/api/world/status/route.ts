import { clientWorldPayload, getOperation, getWorld, operationError } from "@/lib/marble"
import { worldThumbnailUrl } from "@/lib/worldImages"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(req: Request) {
  const operationId = new URL(req.url).searchParams.get("id")
  if (!operationId) return NextResponse.json({ error: "missing id" }, { status: 400 })

  try {
    const op = await getOperation(operationId)
    const failed = operationError(op)
    const progress = op.metadata?.progress?.description || op.metadata?.progress?.status || null
    const worldId = op.metadata?.world_id || op.response?.id || null

    if (failed) {
      return NextResponse.json({
        done: true,
        error: failed,
        progress,
        operationId: op.operation_id,
      })
    }

    if (!op.done) {
      return NextResponse.json({
        done: false,
        progress,
        worldId,
        operationId: op.operation_id,
      })
    }

    const world = op.response?.id ? op.response : worldId ? await getWorld(worldId) : null
    const id = world?.id || worldId
    if (!world || !id) {
      return NextResponse.json({ done: true, error: "Marble finished but returned no world assets." }, { status: 502 })
    }

    return NextResponse.json({
      done: true,
      progress: progress || "World generation completed",
      operationId: op.operation_id,
      worldId: id,
      title: world.display_name || null,
      thumbnailUrl: worldThumbnailUrl(id),
      marbleUrl: clientWorldPayload(world, id).marbleUrl,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "status failed" }, { status: 502 })
  }
}
