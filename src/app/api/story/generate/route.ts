import { generateStory } from "@/lib/llm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = (await req.json()) as { prompt?: string }
  const story = await generateStory(prompt?.trim() || "A young astronaut wakes up alone inside an abandoned space station.")
  return NextResponse.json(story)
}
