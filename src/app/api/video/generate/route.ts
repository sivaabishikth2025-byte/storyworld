import { startTextVideo } from "@/lib/aws/nova"
import { planFilmFromStory } from "@/lib/aws/planFilm"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const body = (await req.json()) as {
    prompt?: string
    text?: string
    safer?: boolean
    preferShorter?: boolean
    attempt?: number
  }

  const story = (body.prompt || body.text || "").trim()
  if (!story) {
    return NextResponse.json({ error: "Write a story first." }, { status: 400 })
  }

  try {
    const attempt = Number(body.attempt) || 1
    const safer = Boolean(body.safer || body.preferShorter || attempt > 1)
    let plan = await planFilmFromStory(story, { safer })

    if (body.preferShorter || attempt > 1) {
      const cut = attempt >= 3 ? 24 : attempt >= 2 ? 30 : Math.min(plan.durationSeconds, 36)
      plan = {
        ...plan,
        durationSeconds: Math.max(12, Math.round(cut / 6) * 6),
        rationale: `${plan.rationale} Attempt ${attempt}: safer / shorter cut.`,
      }
    }

    // Start can also throw ValidationException for input RAI blocks.
    try {
      const job = await startTextVideo(plan.videoPrompt, plan.durationSeconds)
      return NextResponse.json({
        ...job,
        title: plan.title,
        rationale: plan.rationale,
        plannedDuration: plan.durationSeconds,
        videoPrompt: plan.videoPrompt,
        attempt,
        safer,
      })
    } catch (err) {
      const message = formatErr(err)
      if (/content filter|blocked/i.test(message) && !safer) {
        const safePlan = await planFilmFromStory(story, { safer: true })
        const job = await startTextVideo(safePlan.videoPrompt, Math.min(safePlan.durationSeconds, 30))
        return NextResponse.json({
          ...job,
          title: safePlan.title,
          rationale: `${safePlan.rationale} Rewrote after content filter on input.`,
          plannedDuration: job.duration,
          videoPrompt: safePlan.videoPrompt,
          attempt,
          safer: true,
        })
      }
      throw err
    }
  } catch (err) {
    return NextResponse.json({ error: formatErr(err) }, { status: 502 })
  }
}

function formatErr(err: unknown) {
  const e = err as { name?: string; message?: string }
  return [e.name, e.message].filter(Boolean).join(": ") || "Nova Reel failed"
}
