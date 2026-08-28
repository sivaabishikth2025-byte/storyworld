import { downloadVideoBytes } from "@/lib/aws/nova"
import { generateWorld, uploadVideoAsset } from "@/lib/marble"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: Request) {
  const body = (await req.json()) as {
    story?: string
    prompt?: string
    title?: string
    videoKey?: string | null
    model?: "marble-1.1" | "marble-1.1-plus"
  }

  const story = (body.story || body.prompt || "").trim()
  if (!story) return NextResponse.json({ error: "Need the story to generate a world." }, { status: 400 })

  const title = (body.title || "STORYWORLD").slice(0, 80)
  const model = body.model === "marble-1.1-plus" ? "marble-1.1-plus" : "marble-1.1"
  let mode: "video" | "text" = "text"
  let mediaAssetId: string | undefined
  let warning: string | null = null

  const videoKey = (body.videoKey || "").trim()
  if (videoKey && !videoKey.includes("..") && !videoKey.startsWith("/")) {
    try {
      const bytes = await downloadVideoBytes(videoKey)
      mediaAssetId = await uploadVideoAsset(bytes, `${title.replace(/[^\w]+/g, "-").slice(0, 40) || "film"}.mp4`)
      mode = "video"
    } catch (err) {
      warning = err instanceof Error ? err.message : "Video upload to Marble failed"
      mediaAssetId = undefined
      mode = "text"
    }
  }

  try {
    let op = await generateWorld({ story, title, mediaAssetId, model })
    if (!op.operation_id && mediaAssetId) {
      warning = `${warning ? `${warning} · ` : ""}Video world start failed. Falling back to text.`
      op = await generateWorld({ story, title, model })
      mode = "text"
    }
    if (!op.operation_id) throw new Error("Marble did not return an operation id")
    return NextResponse.json({
      operationId: op.operation_id,
      mode,
      model,
      warning,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Marble generate failed"
    if (mediaAssetId && /video|media|duration|size/i.test(message)) {
      try {
        const op = await generateWorld({ story, title, model })
        return NextResponse.json({
          operationId: op.operation_id,
          mode: "text",
          model,
          warning: `Video-to-world refused (${message}). Generating from the story text instead.`,
        })
      } catch (fallbackErr) {
        return NextResponse.json(
          { error: fallbackErr instanceof Error ? fallbackErr.message : message },
          { status: 502 },
        )
      }
    }
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
