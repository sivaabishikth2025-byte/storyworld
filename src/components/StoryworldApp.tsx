"use client"

import { DOORS } from "@/lib/layout"
import { storyAudio } from "@/lib/audio"
import {
  CinematicChrome,
  Generating,
  HUD,
  InventoryModal,
  Landing,
  Letterbox,
  Pause,
  TerminalModal,
  VideoWait,
} from "@/components/ui/Overlays"
import { VideoPlayer } from "@/components/ui/VideoPlayer"
import { useStoryworld } from "@/store/useStoryworld"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const CanvasWorld = dynamic(
  () => import("@/components/world/Experience").then((mod) => ({ default: mod.Experience })),
  { ssr: false },
)

export function StoryworldApp() {
  const phase = useStoryworld((s) => s.phase)
  const interact = useStoryworld((s) => s.interact)
  const toggleFlashlight = useStoryworld((s) => s.toggleFlashlight)
  const toggleInventory = useStoryworld((s) => s.toggleInventory)
  const toggleState = useStoryworld((s) => s.toggleState)
  const closeTerminal = useStoryworld((s) => s.closeTerminal)
  const setPhase = useStoryworld((s) => s.setPhase)
  const enterWorld = useStoryworld((s) => s.enterWorld)
  const skip = useStoryworld((s) => s.skipOrAdvanceCinema)
  const nearby = useStoryworld((s) => s.nearby)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const store = useStoryworld.getState()
      if (e.key === "Escape") {
        if (store.phase === "terminal") closeTerminal()
        else if (store.phase === "play") {
          document.exitPointerLock()
          setPhase("paused")
        } else if (store.phase === "paused") setPhase("play")
        return
      }
      if (e.code === "Space" && (store.phase === "video" || store.phase === "cinema-hold")) {
        e.preventDefault()
        skip()
      }
      if (e.key === "Enter" && (store.phase === "cinema-hold" || (store.phase === "video-wait" && store.videoError))) {
        enterWorld()
      }
      if (store.phase !== "play") return
      if (e.key.toLowerCase() === "e") {
        if (store.nearby?.kind === "door") {
          const door = DOORS.find((d) => d.id === store.nearby?.id)
          if (door?.locked && !store.openDoors.includes(door.id)) {
            const has = door.key ? store.inventory.some((i) => i.id === `pickup-${door.key}`) : false
            if (!has) {
              useStoryworld.setState({
                log: [`${door.label} is sealed.`, ...store.log].slice(0, 12),
              })
              return
            }
          }
          storyAudio.hiss()
        }
        interact()
      }
      if (e.key.toLowerCase() === "f") toggleFlashlight()
      if (e.key === "Tab") {
        e.preventDefault()
        toggleInventory()
      }
      if (e.key.toLowerCase() === "m") toggleState()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [closeTerminal, enterWorld, interact, nearby, setPhase, skip, toggleFlashlight, toggleInventory, toggleState])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void text-white">
      <CanvasWorld />
      <div className="pointer-events-none absolute inset-0 z-10 opacity-25 mix-blend-overlay grain" />
      <Letterbox />
      <Landing />
      <Generating />
      <VideoWait />
      <VideoPlayer />
      <CinematicChrome />
      <HUD />
      <TerminalModal />
      <InventoryModal />
      <Pause />
      {phase === "play" && (
        <p className="pointer-events-none absolute bottom-6 right-6 z-20 font-mono text-[10px] tracking-[0.2em] text-white/25">
          CLICK TO LOOK
        </p>
      )}
    </div>
  )
}
