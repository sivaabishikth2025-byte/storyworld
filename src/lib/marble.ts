import { withProxiedThumbnail } from "./worldImages"

const MARBLE_API = "https://api.worldlabs.ai/marble/v1"
const MAX_VIDEO_BYTES = 100 * 1024 * 1024

export type MarbleModel = "marble-1.1" | "marble-1.1-plus"

export type MarbleOperation = {
  operation_id: string
  done: boolean
  error?: { message?: string; code?: string } | string | null
  metadata?: {
    progress?: { status?: string; description?: string }
    world_id?: string
  } | null
  response?: MarbleWorld | null
}

export type MarbleWorld = {
  id?: string
  display_name?: string | null
  world_marble_url?: string | null
  assets?: {
    caption?: string | null
    thumbnail_url?: string | null
    splats?: {
      spz_urls?: Record<string, string>
      semantics_metadata?: {
        metric_scale_factor?: number
        ground_plane_offset?: number
      }
    }
    mesh?: {
      collider_mesh_url?: string | null
      hq_mesh_url?: string | null
    }
    imagery?: { pano_url?: string | null }
  }
}

function apiKey() {
  const key = process.env.WLT_API_KEY?.trim()
  if (!key) throw new Error("WLT_API_KEY missing. Add it to .env.local from platform.worldlabs.ai/api-keys")
  return key
}

async function marble<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MARBLE_API}${path}`, {
    ...init,
    headers: {
      "WLT-Api-Key": apiKey(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const text = await res.text()
  let json: T | null = null
  try {
    json = text ? (JSON.parse(text) as T) : null
  } catch {
    json = null
  }
  if (!res.ok) {
    const err = json as { error?: { message?: string }; message?: string } | null
    const message = err?.error?.message || err?.message || text.slice(0, 400) || res.statusText
    throw new Error(`Marble ${res.status}: ${message}`)
  }
  return json as T
}

export function worldPromptFromStory(story: string, title?: string) {
  const place = story.replace(/\s+/g, " ").trim().slice(0, 1600)
  const name = title?.trim()
  return [name ? `${name}.` : "", place, "A complete photoreal walkable 3D environment matching this scene's architecture, lighting, and atmosphere."]
    .filter(Boolean)
    .join(" ")
}

export async function uploadVideoAsset(bytes: Uint8Array, fileName = "film.mp4") {
  if (bytes.byteLength > MAX_VIDEO_BYTES) {
    throw new Error(`Film is ${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB. Marble video input max is 100MB.`)
  }
  const prepared = await marble<{
    media_asset?: { id?: string; media_asset_id?: string }
    media_asset_id?: string
    upload_info?: {
      upload_url?: string
      upload_method?: string
      required_headers?: Record<string, string>
    }
  }>("/media-assets:prepare_upload", {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      kind: "video",
      extension: "mp4",
    }),
  })

  const mediaId = prepared.media_asset?.id || prepared.media_asset?.media_asset_id || prepared.media_asset_id
  const uploadUrl = prepared.upload_info?.upload_url
  if (!mediaId || !uploadUrl) throw new Error("Marble prepare_upload did not return a media asset id")

  const put = await fetch(uploadUrl, {
    method: prepared.upload_info?.upload_method || "PUT",
    headers: prepared.upload_info?.required_headers || {},
    body: bytes as BodyInit,
  })
  if (!put.ok) {
    const detail = await put.text().catch(() => "")
    throw new Error(`Marble video upload failed (${put.status}) ${detail.slice(0, 200)}`)
  }
  return mediaId
}

export async function generateWorld(opts: {
  story: string
  title?: string
  mediaAssetId?: string
  model?: MarbleModel
}) {
  const displayName = (opts.title || "STORYWORLD").slice(0, 80)
  const textPrompt = worldPromptFromStory(opts.story, opts.title)
  const model = opts.model || "marble-1.1"

  const body = opts.mediaAssetId
    ? {
        display_name: displayName,
        model,
        world_prompt: {
          type: "video",
          text_prompt: textPrompt,
          video_prompt: {
            source: "media_asset",
            media_asset_id: opts.mediaAssetId,
          },
        },
      }
    : {
        display_name: displayName,
        model,
        world_prompt: {
          type: "text",
          text_prompt: textPrompt,
        },
      }

  return marble<MarbleOperation>("/worlds:generate", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getOperation(operationId: string) {
  return marble<MarbleOperation>(`/operations/${encodeURIComponent(operationId)}`)
}

export async function getWorld(worldId: string) {
  const data = await marble<{ world?: MarbleWorld } & MarbleWorld>(`/worlds/${encodeURIComponent(worldId)}`)
  return data.world || data
}

export type GalleryWorld = {
  worldId: string
  displayName: string
  thumbnailUrl: string | null
  caption: string | null
  marbleUrl: string
  createdAt?: string | null
}

export async function listWorlds(limit = 24) {
  const data = await marble<{ worlds?: Array<Record<string, unknown>> }>("/worlds:list", {
    method: "POST",
    body: JSON.stringify({}),
  })
  const worlds = (data.worlds || [])
    .filter((w) => w.assets)
    .slice(0, limit)
    .map((w) => {
      const id = String(w.world_id || w.id || "")
      const assets = w.assets as MarbleWorld["assets"]
      return withProxiedThumbnail({
        worldId: id,
        displayName: String(w.display_name || "Untitled world"),
        thumbnailUrl: assets?.thumbnail_url || assets?.imagery?.pano_url || null,
        caption: assets?.caption || null,
        marbleUrl: String(w.world_marble_url || `https://marble.worldlabs.ai/world/${id}`),
        createdAt: (w.created_at as string) || null,
      })
    })
  return worlds
}

export function operationError(op: MarbleOperation) {
  if (!op.error) return null
  if (typeof op.error === "string") return op.error
  return op.error.message || "Marble world generation failed"
}

export function pickSplatUrl(world: MarbleWorld, kind: "full_res" | "500k" | "100k" = "full_res") {
  const urls = world.assets?.splats?.spz_urls || {}
  return urls[kind] || urls.full_res || urls["500k"] || urls["100k"] || Object.values(urls)[0] || null
}

export function clientWorldPayload(world: MarbleWorld, worldId: string) {
  const meta = world.assets?.splats?.semantics_metadata
  const splatUrl = pickSplatUrl(world, "full_res")
  return {
    worldId,
    caption: world.assets?.caption || null,
    marbleUrl: world.world_marble_url || `https://marble.worldlabs.ai/world/${worldId}`,
    splatUrl: splatUrl || `/api/world/asset?worldId=${encodeURIComponent(worldId)}&kind=spzfull`,
    colliderUrl: world.assets?.mesh?.collider_mesh_url || null,
    scale: Number(meta?.metric_scale_factor) || 1,
    ground: Number(meta?.ground_plane_offset) || 0,
  }
}
