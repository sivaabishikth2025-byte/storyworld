import { resolveAct } from "@/lib/director"
import { generateAct } from "@/lib/llm"
import type { StoryContent, WorldStat } from "@/lib/types"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = (await req.json()) as {
    prompt: string
    actionId: string
    choiceId?: string
    worldState: Record<string, WorldStat>
    flags: Record<string, boolean>
    story: StoryContent
  }
  const local = resolveAct(body.actionId, body.choiceId, body.worldState, body.flags || {})
  const extra = await generateAct(body.prompt, body.actionId, body.choiceId, local.worldState, body.story)
  if (extra?.worldState) {
    local.worldState = { ...local.worldState, ...extra.worldState }
  }
  if (extra?.log && !local.log) local.log = extra.log
  return NextResponse.json(local)
}
