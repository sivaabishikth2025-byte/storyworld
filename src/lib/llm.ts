import { buildFlagshipStory, overlayNarrative } from "./director"
import type { ActResult, StoryContent, WorldStat } from "./types"

const SYSTEM = `You are the narrative director of STORYWORLD, a cinematic interactive 3D game.
The physical map is always 6 connected rooms (spawn, hub, window room, machine room, storage, forbidden) plus corridors. You MUST map the player's story onto that map. Do not invent a space station unless the player wrote one.
Return ONLY valid JSON:
{
  "theme": "station|manor|bunker|lab|temple|hotel|ship",
  "title": "short all-caps title matching THEIR story",
  "logline": "one sentence from their premise",
  "stationName": "the place's name",
  "protagonist": "who they are",
  "threat": "what still moves",
  "worldState": { "reactor": 41, "oxygen": 91, "power": "emergency", "presence": "unconfirmed", "protocol": "latent", "hull": "stable", "crew": 0, "hope": 40 },
  "terminals": {
    "term-cryo": { "title": "...", "body": "multiline log in THIS world's voice" },
    "term-medical": { "title": "...", "body": "...", "choices": [{"id":"vale-follow","label":"..."},{"id":"vale-ignore","label":"..."}] },
    "term-hub": { "title": "...", "body": "..." },
    "term-command": { "title": "...", "body": "...", "choices": [{"id":"choose-repair","label":"..."},{"id":"choose-hunt","label":"..."}] },
    "term-engineering": { "title": "...", "body": "...", "choices": [{"id":"repair-reactor","label":"..."},{"id":"abandon-reactor","label":"..."}] },
    "term-cargo": { "title": "...", "body": "..." },
    "term-unknown": { "title": "...", "body": "...", "choices": [{"id":"face-it","label":"..."},{"id":"run-back","label":"..."}] }
  },
  "pickups": {
    "pickup-keycard": { "name": "...", "description": "..." },
    "pickup-welder": { "name": "...", "description": "..." },
    "pickup-recorder": { "name": "...", "description": "..." }
  }
}
Keep choice ids EXACTLY as specified. Write specific sensory prose for THEIR setting, not generic sci-fi.`

async function chatOpenAI(prompt: string, key: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Player story:\n${prompt}` },
      ],
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

async function chatAnthropic(prompt: string, key: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: `Player story:\n${prompt}` }],
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  const text = data.content.map((c: { text?: string }) => c.text || "").join("")
  const match = text.match(/\{[\s\S]*\}$/)
  return JSON.parse(match ? match[0] : text)
}

async function chatGemini(prompt: string, key: string) {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash"
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM}\n\nPlayer story:\n${prompt}` }] }],
        generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
      }),
    },
  )
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text)
}

export async function generateStory(prompt: string): Promise<StoryContent> {
  const base = buildFlagshipStory(prompt)
  const openai = process.env.OPENAI_API_KEY
  const anthropic = process.env.ANTHROPIC_API_KEY
  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  try {
    let generated: Partial<StoryContent> | null = null
    if (anthropic) generated = await chatAnthropic(prompt, anthropic)
    else if (openai) generated = await chatOpenAI(prompt, openai)
    else if (gemini) generated = await chatGemini(prompt, gemini)
    if (generated) return overlayNarrative(base, generated)
  } catch (error) {
    console.error("LLM story generation failed, using directed fallback", error)
  }
  return base
}

export async function generateAct(
  prompt: string,
  actionId: string,
  choiceId: string | undefined,
  worldState: Record<string, WorldStat>,
  story: StoryContent,
): Promise<Partial<ActResult> | null> {
  const key = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY
  if (!key) return null
  try {
    const instruction = `Continue STORYWORLD. Return JSON { "log": "one line", "worldState": { ...updated stats } }.
Do not invent new ids. Keep reactor/oxygen numeric.
Original prompt: ${prompt}
Current state: ${JSON.stringify(worldState)}
Title: ${story.title}
Action: ${actionId} choice: ${choiceId || "none"}`
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You update a cinematic game state. JSON only." },
            { role: "user", content: instruction },
          ],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return JSON.parse(data.choices[0].message.content)
      }
    }
  } catch (error) {
    console.error("LLM act failed", error)
  }
  return null
}
