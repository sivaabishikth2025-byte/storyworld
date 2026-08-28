"use client"

import { roomAt } from "@/lib/layout"
import { buildThemePack } from "@/lib/theme"
import { storyAudio } from "@/lib/audio"
import { useStoryworld } from "@/store/useStoryworld"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const STEPS = [
  { n: "01", t: "THE STORY", d: "Characters · locations · causal chain" },
  { n: "02", t: "THE FILM", d: "AWS Nova Reel · 48 seconds · 1280×720" },
  { n: "03", t: "THE WORLD", d: "Authored 3D atrium · mesh collision" },
  { n: "04", t: "ENTER", d: "The picture does not end" },
]

export function Landing() {
  const phase = useStoryworld((s) => s.phase)
  const prompt = useStoryworld((s) => s.prompt)
  const begin = useStoryworld((s) => s.begin)
  const [text, setText] = useState(prompt)
  if (phase !== "landing") return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-14"
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-[11px] tracking-[0.45em] text-gold/80">STORYWORLD</p>
        <p className="font-mono text-[10px] tracking-[0.28em] text-white/35">CINEMA × SIMULATION</p>
      </div>
      <div className="pointer-events-auto max-w-3xl">
        <p className="mb-4 font-mono text-[11px] tracking-[0.32em] text-teal/80">WRITE A STORY. WATCH IT BECOME A MOVIE. STEP INSIDE.</p>
        <h1 className="font-serif text-5xl leading-[0.95] text-white md:text-7xl">
          The picture
          <br />
          does not end.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
          Type a world. AWS Nova Reel renders a real 48-second film. Then you walk the same place as a playable 3D hall — act, and the story cuts back to cinema.
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            useStoryworld.getState().setPrompt(e.target.value)
          }}
          className="mt-8 h-28 w-full max-w-2xl resize-none border border-white/10 bg-black/45 p-4 font-mono text-sm leading-relaxed text-white/90 outline-none backdrop-blur-md placeholder:text-white/25 focus:border-gold/50"
          placeholder="A young astronaut wakes up alone..."
        />
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={() => {
              storyAudio.start()
              begin(text)
            }}
            className="border border-gold/70 bg-gold/10 px-8 py-3 font-mono text-[11px] tracking-[0.38em] text-gold transition hover:bg-gold hover:text-black"
          >
            BEGIN
          </button>
          <span className="font-mono text-[10px] text-white/30">WASD · LOOK · E INTERACT · F LAMP</span>
        </div>
      </div>
    </motion.div>
  )
}

export function Generating() {
  const phase = useStoryworld((s) => s.phase)
  const step = useStoryworld((s) => s.generatingStep)
  if (phase !== "generating") return null
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 md:p-16">
      <div className="grid w-full max-w-3xl gap-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: i <= step ? 1 : 0.25, y: 0 }}
            className="flex items-baseline gap-5"
          >
            <span className={`font-mono text-xs ${i <= step ? "text-gold" : "text-white/25"}`}>{s.n}</span>
            <div>
              <p className="font-serif text-2xl text-white md:text-3xl">{s.t}</p>
              <p className="font-mono text-[10px] tracking-[0.22em] text-white/40">{s.d}</p>
            </div>
            {i < step && <span className="ml-auto font-mono text-[10px] text-teal">LOCKED</span>}
            {i === step && <span className="ml-auto font-mono text-[10px] text-gold">RENDERING</span>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function VideoWait() {
  const phase = useStoryworld((s) => s.phase)
  const error = useStoryworld((s) => s.videoError)
  const duration = useStoryworld((s) => s.videoDuration)
  const started = useStoryworld((s) => s.waitStarted)
  const kind = useStoryworld((s) => s.videoKind)
  const enterWorld = useStoryworld((s) => s.enterWorld)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase !== "video-wait") return
    setElapsed(Math.floor((Date.now() - started) / 1000))
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, started])

  if (phase !== "video-wait") return null
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const ss = String(elapsed % 60).padStart(2, "0")
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-gradient-to-t from-black via-black/50 to-black/10 p-10 md:p-16">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.38em] text-gold/80">AWS NOVA REEL · MULTI-SHOT</p>
        <h2 className="mt-3 font-serif text-4xl text-white md:text-6xl">
          {error ? "The film did not land." : kind === "event" ? "Cutting the next scene." : "Rendering the film."}
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
          {error
            ? error
            : `${duration}-second photoreal video. This is a real Bedrock job, not a camera lerp. Typical wait is a few minutes.`}
        </p>
        <p className="mt-6 font-mono text-xs tracking-[0.22em] text-white/40">
          ELAPSED {mm}:{ss}
        </p>
        {(error || elapsed > 90) && (
          <button
            onClick={enterWorld}
            className="pointer-events-auto mt-8 border border-white/40 px-8 py-3 font-mono text-[11px] tracking-[0.3em] text-white hover:bg-white hover:text-black"
          >
            ENTER WORLD ANYWAY
          </button>
        )}
      </div>
    </div>
  )
}

export function Letterbox() {
  const cinema = useStoryworld((s) => s.phase === "video" || s.phase === "cinema-hold" || s.phase === "entering")
  return (
    <div className="pointer-events-none absolute inset-0 z-[26]">
      <motion.div
        animate={{ height: cinema ? "13vh" : "0vh" }}
        className="absolute inset-x-0 top-0 bg-black"
      />
      <motion.div
        animate={{ height: cinema ? "13vh" : "0vh" }}
        className="absolute inset-x-0 bottom-0 bg-black"
      />
    </div>
  )
}

export function CinematicChrome() {
  const phase = useStoryworld((s) => s.phase)
  const shot = useStoryworld((s) => s.currentShot)
  const cinematic = useStoryworld((s) => s.cinematic)
  const enterWorld = useStoryworld((s) => s.enterWorld)
  const story = useStoryworld((s) => s.story)
  if (phase !== "cinema-hold") return null
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between px-10 py-[12vh] md:px-16">
      <div className="flex justify-between">
        <p className="font-mono text-[10px] tracking-[0.4em] text-gold/70">{story?.stationName || "STORYWORLD"}</p>
      </div>
      <div className="max-w-3xl">
        <h2 className="font-serif text-4xl text-white md:text-6xl">{cinematic?.title || shot?.title || "STORYWORLD"}</h2>
        <p className="mt-3 max-w-xl text-white/60">The film is over. The hall is still here.</p>
      </div>
      <div className="flex items-end justify-between">
        <p className="font-mono text-[10px] text-white/30">{cinematic?.title}</p>
        {phase === "cinema-hold" && (
          <button
            onClick={enterWorld}
            className="pointer-events-auto border border-white px-10 py-3 font-mono text-[12px] tracking-[0.45em] text-white hover:bg-white hover:text-black"
          >
            {cinematic?.continueLabel || "ENTER"}
          </button>
        )}
      </div>
    </div>
  )
}

export function HUD() {
  const phase = useStoryworld((s) => s.phase)
  const nearby = useStoryworld((s) => s.nearby)
  const world = useStoryworld((s) => s.worldState)
  const flashlight = useStoryworld((s) => s.flashlight)
  const story = useStoryworld((s) => s.story)
  const prompt = useStoryworld((s) => s.prompt)
  const x = useStoryworld((s) => s.playerX)
  const z = useStoryworld((s) => s.playerZ)
  const y = useStoryworld((s) => s.playerY)
  const showState = useStoryworld((s) => s.showState)
  const log = useStoryworld((s) => s.log[0])
  const pack = buildThemePack(prompt, story?.theme)
  const room = pack.rooms[roomAt(x, z, y).id] || roomAt(x, z, y).name
  if (phase !== "play") return null
  const emergency = String(world.protocol).toUpperCase() === "ACTIVE"
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2">
        <div className={`h-full w-full rounded-full border ${nearby ? "border-gold" : "border-white/50"}`} />
      </div>
      <div className="absolute left-8 top-8">
        <p className="font-mono text-[10px] tracking-[0.35em] text-gold/80">{story?.stationName}</p>
        <p className="mt-2 font-serif text-2xl text-white">{room}</p>
        <p className="mt-1 font-mono text-[10px] text-white/40">{flashlight ? "LAMP ON" : "LAMP OFF"}</p>
      </div>
      {showState && (
        <div className={`absolute right-8 top-8 w-56 border px-4 py-3 font-mono text-[10px] tracking-[0.12em] ${emergency ? "border-alert/60 text-alert" : "border-white/10 text-white/55"}`}>
          <p className="mb-2 tracking-[0.3em] text-white/35">STORY STATE</p>
          <Row k={pack.hud.a} v={`${world.reactor}%`} warn={Number(world.reactor) < 35} />
          <Row k={pack.hud.b} v={`${world.oxygen}%`} warn={Number(world.oxygen) < 70} />
          <Row k={pack.hud.c} v={String(world.presence)} />
          <Row k={pack.hud.d} v={String(world.protocol)} warn={emergency} />
        </div>
      )}
      {nearby && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 border border-white/20 bg-black/50 px-5 py-3 text-center backdrop-blur-sm">
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold">E</p>
          <p className="mt-1 text-sm text-white">{nearby.prompt}</p>
        </div>
      )}
      {log && (
        <p className="absolute bottom-20 left-8 max-w-sm font-mono text-[11px] leading-5 text-white/50">{log}</p>
      )}
      {!nearby && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.25em] text-white/30">
          E INTERACT · F LAMP · TAB GEAR · M STATE · ESC
        </p>
      )}
    </div>
  )
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-[2px]">
      <span className="text-white/35">{k}</span>
      <span className={warn ? "text-alert" : "text-white/80"}>{v}</span>
    </div>
  )
}

export function TerminalModal() {
  const phase = useStoryworld((s) => s.phase)
  const id = useStoryworld((s) => s.activeTerminal)
  const story = useStoryworld((s) => s.story)
  const choose = useStoryworld((s) => s.choose)
  const close = useStoryworld((s) => s.closeTerminal)
  if (phase !== "terminal" || !id || !story) return null
  const term = story.terminals[id]
  if (!term) return null
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xl border border-teal/30 bg-[#05080c]/95 p-7 shadow-[0_0_80px_#0ff3]">
        <p className="font-mono text-[10px] tracking-[0.35em] text-teal">TERMINAL</p>
        <h3 className="mt-2 font-mono text-sm text-teal">{term.title}</h3>
        <pre className="mt-5 whitespace-pre-wrap font-mono text-[12px] leading-7 text-white/80">{term.body}</pre>
        <div className="mt-6 flex flex-col gap-2">
          {term.choices?.map((c) => (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              className="border border-white/15 px-4 py-3 text-left font-mono text-xs text-white hover:border-gold hover:text-gold"
            >
              ▸ {c.label}
              {c.hint && <span className="ml-3 text-white/30">{c.hint}</span>}
            </button>
          ))}
          <button onClick={close} className="mt-2 font-mono text-[10px] tracking-[0.2em] text-white/40 hover:text-white">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

export function InventoryModal() {
  const show = useStoryworld((s) => s.showInventory)
  const items = useStoryworld((s) => s.inventory)
  const toggle = useStoryworld((s) => s.toggleInventory)
  if (!show) return null
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50" onClick={toggle}>
      <div className="w-full max-w-md border border-white/15 bg-black/80 p-6" onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-[10px] tracking-[0.3em] text-gold">GEAR</p>
        {items.length === 0 && <p className="mt-4 text-sm text-white/40">Nothing in your hands yet.</p>}
        <ul className="mt-4 space-y-3">
          {items.map((it) => (
            <li key={it.id} className="border-b border-white/10 pb-3">
              <p className="text-white">{it.name}</p>
              <p className="font-mono text-[11px] text-white/45">{it.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Pause() {
  const phase = useStoryworld((s) => s.phase)
  const setPhase = useStoryworld((s) => s.setPhase)
  const log = useStoryworld((s) => s.log)
  if (phase !== "paused") return null
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65">
      <div className="max-w-md text-center">
        <p className="font-serif text-4xl text-white">Paused</p>
        <button
          onClick={() => setPhase("play")}
          className="mt-6 border border-white px-8 py-3 font-mono text-[11px] tracking-[0.3em] text-white"
        >
          RESUME
        </button>
        <div className="mt-8 text-left font-mono text-[11px] text-white/40">
          {log.slice(0, 5).map((l) => (
            <p key={l} className="mb-1">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
