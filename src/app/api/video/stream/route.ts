import { streamVideo } from "@/lib/aws/nova"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key")
  if (!key || key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ error: "bad key" }, { status: 400 })
  }
  try {
    const object = await streamVideo(key)
    const body = object.Body
    if (!body) return NextResponse.json({ error: "empty" }, { status: 404 })
    return new Response(body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType || "video/mp4",
        "Cache-Control": "private, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "stream failed"
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
