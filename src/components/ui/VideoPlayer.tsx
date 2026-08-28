"use client"

import { storyAudio } from "@/lib/audio"
import { useStoryworld } from "@/store/useStoryworld"
import { useEffect, useRef } from "react"

export function VideoPlayer() {
  const phase = useStoryworld((s) => s.phase)
  const url = useStoryworld((s) => s.videoUrl)
  const skip = useStoryworld((s) => s.skipOrAdvanceCinema)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (phase !== "video" || !url) return
    const el = ref.current
    if (!el) return
    el.currentTime = 0
    const play = () => {
      el.play().catch(() => undefined)
    }
    play()
    storyAudio.setCinema(true)
  }, [phase, url])

  if ((phase !== "video" && phase !== "cinema-hold") || !url) return null
  if (phase === "cinema-hold") return null

  return (
    <div className="absolute inset-0 z-[28] bg-black">
      <video
        ref={ref}
        src={url}
        className="h-full w-full object-cover"
        playsInline
        autoPlay
        onEnded={() => skip()}
      />
      <button
        onClick={skip}
        className="absolute right-10 top-[14vh] z-40 font-mono text-[10px] tracking-[0.25em] text-white/50 hover:text-white"
      >
        SKIP
      </button>
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" />
    </div>
  )
}
