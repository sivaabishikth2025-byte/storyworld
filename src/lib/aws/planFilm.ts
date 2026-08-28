import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime"
import { AWS_REGION, clampDurationSeconds } from "./nova"

const bedrock = new BedrockRuntimeClient({ region: AWS_REGION })
const PLANNER_MODEL = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"

export type FilmPlan = {
  durationSeconds: number
  videoPrompt: string
  title: string
  rationale: string
}

export async function planFilmFromStory(story: string, opts?: { safer?: boolean }): Promise<FilmPlan> {
  const cleaned = story.trim()
  if (!cleaned) {
    return heuristicPlan("A traveler enters a quiet city at dusk and looks up at glowing windows.")
  }

  try {
    const planned = await planWithClaude(cleaned, Boolean(opts?.safer))
    if (planned) return planned
  } catch {
    /* fall through */
  }
  return heuristicPlan(cleaned, Boolean(opts?.safer))
}

async function planWithClaude(story: string, safer: boolean): Promise<FilmPlan | null> {
  const system = [
    "You convert a user's story into one Amazon Nova Reel MULTI_SHOT_AUTOMATED text prompt.",
    "CRITICAL Nova Reel prompt rules:",
    "- Write like a video caption / shot summary, NOT like chat or commands.",
    "- NEVER use negation words: no, not, without, don't, do not, none, never.",
    "- NEVER write UI instructions like captions, titles, logos, watermark.",
    "- Describe only what SHOULD appear on screen.",
    "- Keep violence, weapons, blood, horror stalking, sexual content, and minors out of the prompt.",
    "- Convert scary threat into mysterious atmosphere and wonder if needed.",
    "- Prefer concrete subjects, actions, environments, lighting, and camera moves.",
    "- Put camera movement at the start or end.",
    "- videoPrompt max 3500 characters.",
    "Duration rules:",
    "- durationSeconds integer 12-120, multiple of 6 only.",
    "- About 6 seconds per shot. Longer jobs fail more often.",
    "- Prefer 24-36 for a short scene, 42-60 for multi-beat, above 60 only if necessary.",
    safer
      ? "SAFER MODE: soften conflict into quiet mystery. Keep PG. Focus on place, light, weather, discovery."
      : "Stay faithful to the story while keeping the prompt filter-safe.",
    "Return ONLY JSON: durationSeconds, title, rationale, videoPrompt.",
  ].join("\n")

  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: PLANNER_MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1800,
        temperature: safer ? 0.2 : 0.35,
        system,
        messages: [
          {
            role: "user",
            content: `Story:\n\n${story.slice(0, 5000)}\n\nReturn JSON only.`,
          },
        ],
      }),
    }),
  )

  const raw = JSON.parse(new TextDecoder().decode(response.body)) as {
    content?: Array<{ text?: string }>
  }
  const text = raw.content?.map((c) => c.text || "").join("") || ""
  const json = extractJson(text)
  if (!json) return null

  const durationSeconds = clampDurationSeconds(Number(json.durationSeconds) || 30)
  let videoPrompt = stripNegation(String(json.videoPrompt || "").trim())
  if (!videoPrompt) return null
  if (safer) videoPrompt = soften(videoPrompt)

  return {
    durationSeconds: safer ? Math.min(durationSeconds, 36) : durationSeconds,
    videoPrompt: videoPrompt.slice(0, 3900),
    title: String(json.title || "STORYWORLD").slice(0, 80),
    rationale: String(json.rationale || "Directed from the story beats.").slice(0, 280),
  }
}

export function heuristicPlan(story: string, safer = false): FilmPlan {
  const words = story.trim().split(/\s+/).filter(Boolean).length
  const sentences = story.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length
  const beats = Math.max(sentences, Math.ceil(words / 28))

  let seconds = 24
  if (beats <= 2) seconds = 24
  else if (beats <= 4) seconds = 30
  else if (beats <= 6) seconds = 36
  else if (beats <= 8) seconds = 48
  else if (beats <= 11) seconds = 60
  else seconds = 72
  if (safer) seconds = Math.min(seconds, 30)

  const durationSeconds = clampDurationSeconds(seconds)
  const body = soften(stripNegation(story.trim().slice(0, 2200)))
  const videoPrompt = [
    "Camera slowly dollies forward through the scene.",
    body,
    "Cinematic lighting, shallow depth of field, film grain, photoreal style.",
  ].join(" ")

  return {
    durationSeconds,
    videoPrompt: videoPrompt.slice(0, 3900),
    title: "STORYWORLD",
    rationale: safer
      ? `Safer rewrite · ${durationSeconds}s`
      : `Estimated ${beats} story beats → ${durationSeconds}s film.`,
  }
}

export function isContentFilterFailure(message: string) {
  return /content filter|blocked by our content|RAI_VIOLATION/i.test(message)
}

function soften(text: string) {
  return text
    .replace(/\b(kill|killed|murder|blood|gore|weapon|gun|knife|hunt|hunter|stalk|stalker|scream|terror|horror|monster|demon|dead|corpse|attack)\b/gi, "shadow")
    .replace(/\b(alone|abandoned)\b/gi, "quiet")
    .replace(/\bdark\b/gi, "dimly lit")
}

function stripNegation(text: string) {
  return text
    .replace(/\b(do not|don't|dont|never|without|no captions|no titles|no ui|no logos|no readable text|no watermark)\b/gi, "")
    .replace(/\b(no|not)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function extractJson(text: string) {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}
