"use client"

import { GalleryPanel } from "@/components/ui/GalleryPanel"
import { LandingPage } from "@/components/ui/LandingPage"
import { useAuth } from "@/components/auth/AuthProvider"
import type { GalleryWorld } from "@/lib/marble"
import { getStories, getWorlds, saveStory, saveWorld, type StoryEntry } from "@/lib/history"
import { useEffect, useRef, useState } from "react"

const DEFAULT_PROMPT =
  "A young astronaut wakes inside a quiet orbital habitat. Soft blue lights flicker. She floats to a window and looks at Earth while a distant corridor light pulses like a heartbeat."

const MARBLE_WORLD_BASE = "https://marble.worldlabs.ai/world"

type Phase = "idle" | "planning" | "wait" | "play" | "world-wait" | "opening" | "error"

export function FilmApp() {
  const { user, loading: authLoading, openLogin, logout } = useAuth()
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [phase, setPhase] = useState<Phase>("idle")
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [previewWorlds, setPreviewWorlds] = useState<GalleryWorld[]>([])
  const [localStories, setLocalStories] = useState<StoryEntry[]>([])
  const [localWorlds, setLocalWorlds] = useState(getWorlds())
  const [arn, setArn] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [videoKey, setVideoKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rationale, setRationale] = useState("")
  const [title, setTitle] = useState("")
  const [attempt, setAttempt] = useState(1)
  const [operationId, setOperationId] = useState<string | null>(null)
  const [worldProgress, setWorldProgress] = useState("")
  const [worldMode, setWorldMode] = useState<"video" | "text" | null>(null)
  const [worldWarning, setWorldWarning] = useState<string | null>(null)
  const started = useRef(0)
  const jobGen = useRef(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setLocalStories(getStories())
    setLocalWorlds(getWorlds())
    fetch("/api/world/gallery?limit=6")
      .then((r) => r.json())
      .then((d: { worlds?: GalleryWorld[] }) => setPreviewWorlds(d.worlds || []))
      .catch(() => setPreviewWorlds([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resumeOp = params.get("worldOp")
    const existingWorld = params.get("worldId")
    if (existingWorld && phase === "idle") {
      openMarbleWorld(`${MARBLE_WORLD_BASE}/${existingWorld}`)
      return
    }
    if (!resumeOp || phase !== "idle") return
    const gen = ++jobGen.current
    started.current = Date.now()
    setElapsed(0)
    setPhase("world-wait")
    setOperationId(resumeOp)
    setWorldProgress("Resuming world generation...")
    pollWorld(resumeOp, gen).catch((err) => {
      setError(err instanceof Error ? err.message : "World generation failed")
      setPhase("error")
    })
  }, [])

  useEffect(() => {
    if (phase !== "wait" && phase !== "planning" && phase !== "world-wait" && phase !== "opening") return
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started.current) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  function openMarbleWorld(marbleUrl: string) {
    setPhase("opening")
    setWorldProgress("Opening your world...")
    window.location.assign(marbleUrl)
  }

  function refreshLocal() {
    setLocalStories(getStories())
    setLocalWorlds(getWorlds())
  }

  async function renderFilm(nextAttempt = 1, flags?: { safer?: boolean; shorter?: boolean }) {
    const text = prompt.trim()
    if (!text) return
    if (!user) {
      openLogin()
      return
    }
    const gen = ++jobGen.current
    started.current = Date.now()
    setElapsed(0)
    setError(null)
    setUrl(null)
    setArn(null)
    setVideoKey(null)
    setAttempt(nextAttempt)
    if (nextAttempt === 1 && !flags?.safer) {
      setRationale("")
      setTitle("")
      setDuration(0)
    }
    setPhase("planning")
    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          safer: Boolean(flags?.safer || nextAttempt > 1),
          preferShorter: Boolean(flags?.shorter || nextAttempt > 1),
          attempt: nextAttempt,
        }),
      })
      const data = (await res.json()) as {
        invocationArn?: string
        duration?: number
        error?: string
        rationale?: string
        title?: string
      }
      if (!res.ok || !data.invocationArn) throw new Error(data.error || "Nova Reel refused the job")
      setArn(data.invocationArn)
      setDuration(data.duration || 0)
      setRationale(data.rationale || "")
      setTitle(data.title || "")
      setPhase("wait")
      await poll(data.invocationArn, gen, nextAttempt, text, data.title || "", data.duration || 0)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Film render failed"
      if (isFilter(msg) && nextAttempt < 3) {
        setRationale("Content filter hit. Rewriting a safer caption and retrying...")
        await renderFilm(nextAttempt + 1, { safer: true, shorter: true })
        return
      }
      setError(humanize(msg))
      setPhase("error")
    }
  }

  async function poll(
    invocationArn: string,
    gen: number,
    currentAttempt: number,
    storyText: string,
    filmTitle: string,
    filmDuration: number,
  ) {
    for (;;) {
      if (jobGen.current !== gen) return
      const res = await fetch(`/api/video/status?arn=${encodeURIComponent(invocationArn)}`)
      const data = (await res.json()) as {
        status?: string
        videoUrl?: string | null
        videoKey?: string | null
        failureMessage?: string | null
        error?: string
      }
      if (data.status === "Completed" && data.videoUrl) {
        setUrl(data.videoUrl)
        setVideoKey(data.videoKey || null)
        saveStory({
          story: storyText,
          title: filmTitle || "STORYWORLD",
          videoUrl: data.videoUrl,
          videoKey: data.videoKey || undefined,
          duration: filmDuration,
        })
        refreshLocal()
        setPhase("play")
        return
      }
      if (data.status === "Completed") {
        setError("Job finished but the MP4 was not found in S3.")
        setPhase("error")
        return
      }
      if (data.status === "Failed" || data.error) {
        const msg = data.failureMessage || data.error || "Nova Reel failed"
        if ((isFilter(msg) || isInternal(msg)) && currentAttempt < 3) {
          setRationale(
            isFilter(msg)
              ? `AWS content filter blocked the film. Safer rewrite, attempt ${currentAttempt + 1}/3...`
              : `AWS flaked mid-render. Shorter safer cut, attempt ${currentAttempt + 1}/3...`,
          )
          await renderFilm(currentAttempt + 1, { safer: true, shorter: true })
          return
        }
        setError(humanize(msg))
        setPhase("error")
        return
      }
      await new Promise((r) => setTimeout(r, 8000))
    }
  }

  async function enterWorld() {
    const text = prompt.trim()
    if (!text) return
    if (!user) {
      openLogin()
      return
    }
    const gen = ++jobGen.current
    started.current = Date.now()
    setElapsed(0)
    setError(null)
    setWorldWarning(null)
    setWorldProgress("Uploading your film and building the world...")
    setPhase("world-wait")
    try {
      const res = await fetch("/api/world/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: text, title, videoKey }),
      })
      const data = (await res.json()) as {
        operationId?: string
        mode?: "video" | "text"
        warning?: string | null
        error?: string
      }
      if (!res.ok || !data.operationId) throw new Error(data.error || "World generation refused")
      setOperationId(data.operationId)
      setWorldMode(data.mode || null)
      setWorldWarning(data.warning || null)
      const next = new URL(window.location.href)
      next.searchParams.set("worldOp", data.operationId)
      window.history.replaceState({}, "", next)
      setWorldProgress("Building your 3D world. About 5 minutes — then you step inside.")
      await pollWorld(data.operationId, gen)
    } catch (err) {
      setError(err instanceof Error ? err.message : "World generation failed")
      setPhase("error")
    }
  }

  async function pollWorld(id: string, gen: number) {
    for (;;) {
      if (jobGen.current !== gen) return
      const res = await fetch(`/api/world/status?id=${encodeURIComponent(id)}`)
      const data = (await res.json()) as {
        done?: boolean
        error?: string
        progress?: string | null
        worldId?: string
        marbleUrl?: string
        title?: string | null
        thumbnailUrl?: string | null
      }
      if (data.progress) setWorldProgress(data.progress)
      if (data.error) throw new Error(data.error)
      if (data.done && (data.marbleUrl || data.worldId)) {
        const next = new URL(window.location.href)
        next.searchParams.delete("worldOp")
        window.history.replaceState({}, "", next)
        const marbleUrl = data.marbleUrl || `${MARBLE_WORLD_BASE}/${data.worldId}`
        if (data.worldId) {
          saveWorld({
            worldId: data.worldId,
            title: data.title || title || "STORYWORLD",
            story: prompt.trim(),
            marbleUrl,
            thumbnailUrl: data.thumbnailUrl,
          })
          refreshLocal()
        }
        openMarbleWorld(marbleUrl)
        return
      }
      if (data.done) throw new Error("World finished but no viewer URL was returned.")
      await new Promise((r) => setTimeout(r, 5000))
    }
  }

  function resetToWrite() {
    jobGen.current += 1
    setPhase("idle")
    setUrl(null)
    setArn(null)
    setVideoKey(null)
    setOperationId(null)
    setError(null)
  }

  function replayFilm(film: StoryEntry) {
    setGalleryOpen(false)
    setPrompt(film.story)
    if (film.videoUrl) {
      setUrl(film.videoUrl)
      setVideoKey(film.videoKey || null)
      setTitle(film.title)
      setDuration(film.duration || 0)
      setPhase("play")
      return
    }
    void renderFilm(1)
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const ss = String(elapsed % 60).padStart(2, "0")
  const waiting = phase === "planning" || phase === "wait" || phase === "world-wait" || phase === "opening" || phase === "error"
  const cinematic = phase === "play" || phase === "world-wait" || phase === "opening" || waiting

  return (
    <div className={`relative min-h-dvh w-full ${cinematic ? "h-dvh overflow-hidden" : ""} text-white`}>
      {phase === "idle" && (
        <LandingPage
          prompt={prompt}
          onPromptChange={setPrompt}
          onRender={() => renderFilm(1)}
          onOpenGallery={() => setGalleryOpen(true)}
          previewWorlds={previewWorlds}
          localStories={localStories}
          onOpenWorld={openMarbleWorld}
          onUseExample={setPrompt}
          user={user}
          authLoading={authLoading}
          onOpenLogin={openLogin}
          onLogout={() => void logout()}
        />
      )}

      {phase === "play" && url && (
        <video ref={videoRef} src={url} className="absolute inset-0 h-full w-full bg-black object-cover" autoPlay controls playsInline />
      )}
      {(phase === "world-wait" || phase === "opening") && url && (
        <video src={url} className="absolute inset-0 h-full w-full bg-black object-cover opacity-35" muted loop autoPlay playsInline />
      )}
      {cinematic && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1a140c_0%,#05060a_62%)]" />
      )}

      {phase !== "idle" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-14">
          <div className="flex items-start justify-between">
            <button
              type="button"
              onClick={resetToWrite}
              className="pointer-events-auto font-mono text-[11px] tracking-[0.45em] text-gold/80 hover:text-gold"
            >
              STORYWORLD
            </button>
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="border border-white/15 px-4 py-2 font-mono text-[10px] tracking-[0.28em] text-white/60 hover:text-white"
              >
                GALLERY
              </button>
              <p className="font-mono text-[10px] tracking-[0.28em] text-white/35">
                {phase === "world-wait" || phase === "opening" ? "FILM → WORLD" : "TEXT → VIDEO"}
              </p>
            </div>
          </div>

          {waiting && (
            <div className="pointer-events-auto max-w-2xl">
              <p className="font-mono text-[11px] tracking-[0.38em] text-gold/80">
                {phase === "planning" ? "CLAUDE · READING STORY" : phase === "world-wait" || phase === "opening" ? "BUILDING WORLD" : "AWS NOVA REEL"}
              </p>
              <h2 className="mt-3 font-serif text-4xl text-white md:text-6xl">
                {phase === "error" ? "The job failed." : phase === "planning" ? "Directing from your story." : phase === "world-wait" ? "Building the world." : phase === "opening" ? "Entering the world." : "Rendering the film."}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
                {phase === "error" ? error : phase === "planning" ? "Choosing duration and writing a caption-style film prompt." : phase === "world-wait" || phase === "opening" ? worldProgress : `${duration}-second photoreal MP4${title ? ` · ${title}` : ""}. Keep this tab open.`}
              </p>
              {rationale && phase !== "error" && phase !== "world-wait" && phase !== "opening" && (
                <p className="mt-3 max-w-lg font-mono text-[11px] leading-5 text-white/35">{rationale}</p>
              )}
              {worldWarning && (phase === "world-wait" || phase === "opening") && (
                <p className="mt-3 max-w-lg font-mono text-[11px] leading-5 text-white/35">{worldWarning}</p>
              )}
              <p className="mt-6 font-mono text-xs tracking-[0.22em] text-white/40">ELAPSED {mm}:{ss}</p>
              {phase === "error" && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => renderFilm(1)} className="border border-white/40 px-8 py-3 font-mono text-[11px] tracking-[0.3em] text-white hover:bg-white hover:text-black">
                    RETRY FILM
                  </button>
                  <button onClick={() => enterWorld()} className="border border-gold/70 px-8 py-3 font-mono text-[11px] tracking-[0.3em] text-gold hover:bg-gold hover:text-black">
                    RETRY ENTER THE WORLD
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === "play" && (
            <div className="pointer-events-auto flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.25em] text-white/50">{duration}S · NOVA REEL{title ? ` · ${title}` : ""}</p>
                {rationale && <p className="mt-2 max-w-md font-mono text-[10px] text-white/30">{rationale}</p>}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => enterWorld()} className="border border-gold/70 bg-gold/15 px-8 py-3 font-mono text-[11px] tracking-[0.32em] text-gold hover:bg-gold hover:text-black">
                  ENTER THE WORLD
                </button>
                <button onClick={resetToWrite} className="border border-white/40 bg-black/40 px-6 py-3 font-mono text-[11px] tracking-[0.3em] text-white hover:bg-white hover:text-black">
                  WRITE ANOTHER
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <GalleryPanel
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        localStories={localStories}
        localWorlds={localWorlds}
        onOpenWorld={openMarbleWorld}
        onReplayFilm={replayFilm}
        onUsePrompt={(text) => {
          setPrompt(text)
          setGalleryOpen(false)
        }}
      />
    </div>
  )
}

function isFilter(message: string) {
  return /content filter|blocked by our content|RAI_VIOLATION/i.test(message)
}

function isInternal(message: string) {
  return /InternalServerException|Something went wrong on the server/i.test(message)
}

function humanize(message: string) {
  if (isFilter(message)) return "Nova Reel blocked this story under AWS content filters. Soften violence/horror and retry."
  if (isInternal(message)) return "Nova Reel hit an AWS internal error. Retry with a shorter cut."
  if (/AccessDenied|not authorized/i.test(message)) return "Bedrock denied the model. Enable Claude Sonnet 4.5 and amazon.nova-reel-v1:1 in us-east-1."
  if (/WLT_API_KEY/i.test(message)) return "World API key is missing. Add WLT_API_KEY to .env.local."
  return message
}
