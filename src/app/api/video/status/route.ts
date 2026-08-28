import { getVideoJob } from "@/lib/aws/nova"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(req: Request) {
  const arn = new URL(req.url).searchParams.get("arn")
  if (!arn) return NextResponse.json({ error: "missing arn" }, { status: 400 })
  try {
    const job = await getVideoJob(arn)
    return NextResponse.json(job)
  } catch (err) {
    const message = err instanceof Error ? err.message : "status failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
