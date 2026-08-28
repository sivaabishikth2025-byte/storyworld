"use client"

import { storyAudio } from "@/lib/audio"
import { useStoryworld } from "@/store/useStoryworld"
import { useEffect, useRef, useState } from "react"

const PRELOAD = [
  "/cinema/sw-opening-01-orbit.png",
  "/cinema/sw-opening-02-cryo.png",
  "/cinema/sw-opening-03-eye.png",
  "/cinema/sw-opening-04-wake.png",
  "/cinema/sw-opening-05-presence.png",
  "/cinema/sw-opening-06-enter.png",
  "/cinema/sw-event-command.png",
  "/cinema/sw-event-reactor.png",
  "/cinema/sw-event-unknown.png",
  "/cinema/sw-event-emergency.png",
  "/cinema/sw-event-corridor.png",
]

export function preloadCinema() {
  for (const src of PRELOAD) {
    const img = new Image()
    img.src = src
  }
}

export function FilmPlayer() {
  const phase = useStoryworld((s) => s.phase)
  const shot = useStoryworld((s) => s.currentShot)
  const finishEnter = useStoryworld((s) => s.finishEnter)
  const [ghost, setGhost] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const plate = useRef<HTMLDivElement>(null)
  const started = useRef(performance.now())
  const prevStill = useRef<string | null>(null)

  const live = phase === "cinema" || phase === "cinema-hold" || phase === "entering"
  const still = shot?.still

  useEffect(() => {
    preloadCinema()
  }, [])

  useEffect(() => {
    if (phase !== "entering") {
      setOpacity(1)
      return
    }
    setOpacity(0)
    const id = window.setTimeout(() => finishEnter(), 1500)
    return () => window.clearTimeout(id)
  }, [phase, finishEnter])

  useEffect(() => {
    if (!still) return
    if (prevStill.current && prevStill.current !== still) {
      setGhost(prevStill.current)
      setFlash(true)
      window.setTimeout(() => setFlash(false), 80)
      if (shot?.id === "presence" || shot?.id === "u2" || shot?.id === "c2") storyAudio.scrape()
    }
    prevStill.current = still
    started.current = performance.now()
  }, [still, shot?.id])

  useEffect(() => {
    if (!live || !still) return
    let raf = 0
    const tick = (now: number) => {
      const kb = shot?.kenBurns || { from: 1.06, to: 1.16, x: 0, y: 0 }
      const dur = Math.max(0.8, shot?.duration || 5) * 1000
      const t = Math.min(1, (now - started.current) / dur)
      const stepped = Math.floor(t * 24) / 24
      const scale = kb.from + (kb.to - kb.from) * stepped
      const x = kb.x * stepped
      const y = kb.y * stepped
      if (plate.current) {
        plate.current.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${scale})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [live, still, shot?.duration, shot?.id, shot?.kenBurns])

  if (!live || !still) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[24] overflow-hidden bg-black"
      style={{ opacity, transition: "opacity 1.45s ease" }}
    >
      <div className="absolute inset-0 film-letterbox">
        {ghost && <img src={ghost} alt="" className="film-ghost absolute inset-0 h-full w-full object-cover" />}
        <div ref={plate} className="film-plate-live absolute inset-[-10%] will-change-transform">
          <img src={still} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="film-grain-live" />
        <div className="film-vignette" />
        <div className="film-scratch" />
        {flash && <div className="absolute inset-0 bg-white/25 mix-blend-screen" />}
      </div>
    </div>
  )
}
