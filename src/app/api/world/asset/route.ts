import { getWorld, pickSplatUrl } from "@/lib/marble"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const KINDS = new Set(["spz500k", "spz100k", "spzfull", "collider", "pano", "thumb"])

export async function GET(req: Request) {
  const url = new URL(req.url)
  const worldId = url.searchParams.get("worldId") || ""
  const kind = url.searchParams.get("kind") || "spz500k"
  if (!worldId || worldId.includes("..") || !KINDS.has(kind)) {
    return NextResponse.json({ error: "bad asset request" }, { status: 400 })
  }

  try {
    const world = await getWorld(worldId)
    const remote = resolveAsset(world, kind)
    if (!remote) return NextResponse.json({ error: "asset not ready" }, { status: 404 })

    const res = await fetch(remote, {
      headers: { Accept: "image/*,*/*" },
      cache: "no-store",
    })
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: `asset fetch ${res.status}` }, { status: 502 })
    }

    const cacheControl = kind === "thumb" || kind === "pano" ? "public, max-age=86400, stale-while-revalidate=604800" : "private, max-age=3600"

    return new Response(res.body, {
      headers: {
        "Content-Type": contentType(kind, res.headers.get("content-type")),
        "Cache-Control": cacheControl,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "asset failed" }, { status: 502 })
  }
}

function resolveAsset(
  world: Awaited<ReturnType<typeof getWorld>>,
  kind: string,
) {
  if (kind === "spz500k") return pickSplatUrl(world, "500k")
  if (kind === "spz100k") return pickSplatUrl(world, "100k")
  if (kind === "spzfull") return pickSplatUrl(world, "full_res")
  if (kind === "collider") return world.assets?.mesh?.collider_mesh_url || null
  if (kind === "pano") return world.assets?.imagery?.pano_url || null
  if (kind === "thumb") return world.assets?.thumbnail_url || null
  return null
}

function contentType(kind: string, upstream: string | null) {
  if (kind.startsWith("spz")) return "application/octet-stream"
  if (kind === "collider") return "model/gltf-binary"
  if (kind === "pano" || kind === "thumb") return upstream || "image/jpeg"
  return upstream || "application/octet-stream"
}
