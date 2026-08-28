import { create } from "zustand"
import { EYE_HEIGHT, LANDMARKS } from "@/lib/layout"
import { storyAudio } from "@/lib/audio"
import type {
  Cinematic,
  InventoryItem,
  NearbyTarget,
  Phase,
  Shot,
  StoryContent,
  WorldStat,
} from "@/lib/types"

type StoryworldState = {
  phase: Phase
  prompt: string
  generatingStep: number
  story: StoryContent | null
  worldState: Record<string, WorldStat>
  flags: Record<string, boolean>
  inventory: InventoryItem[]
  openDoors: string[]
  taken: string[]
  discovered: string[]
  log: string[]
  cinematic: Cinematic | null
  shotIndex: number
  currentShot: Shot | null
  nearby: NearbyTarget | null
  activeTerminal: string | null
  flashlight: boolean
  showState: boolean
  showInventory: boolean
  ending: string | null
  playerYaw: number
  playerPitch: number
  playerX: number
  playerZ: number
  playerY: number
  videoUrl: string | null
  videoArn: string | null
  videoError: string | null
  videoKind: "opening" | "event" | null
  videoDuration: number
  waitStarted: number
  setNearby: (n: NearbyTarget | null) => void
  setPlayerPose: (x: number, z: number, yaw: number, pitch: number, y?: number) => void
  setPhase: (p: Phase) => void
  toggleFlashlight: () => void
  toggleState: () => void
  toggleInventory: () => void
  setPrompt: (prompt: string) => void
  begin: (prompt: string) => Promise<void>
  skipOrAdvanceCinema: () => void
  enterWorld: () => void
  finishEnter: () => void
  interact: () => Promise<void>
  choose: (choiceId: string) => Promise<void>
  closeTerminal: () => void
  applyCinematic: (cinematic: Cinematic) => Promise<void>
}

const OPENING_SECONDS = 48
const EVENT_SECONDS = 12

const DEFAULT_PROMPT =
  "A young astronaut wakes up alone inside an abandoned space station. Something is still moving in the station."

export const useStoryworld = create<StoryworldState>((set, get) => ({
  phase: "landing",
  prompt: DEFAULT_PROMPT,
  generatingStep: 0,
  story: null,
  worldState: {},
  flags: {},
  inventory: [],
  openDoors: ["door-cargo"],
  taken: [],
  discovered: [],
  log: [],
  cinematic: null,
  shotIndex: 0,
  currentShot: null,
  nearby: null,
  activeTerminal: null,
  flashlight: true,
  showState: true,
  showInventory: false,
  ending: null,
  playerYaw: Math.PI / 2,
  playerPitch: 0.08,
  playerX: LANDMARKS.spawn[0],
  playerZ: LANDMARKS.spawn[2],
  playerY: 0,
  videoUrl: null,
  videoArn: null,
  videoError: null,
  videoKind: null,
  videoDuration: OPENING_SECONDS,
  waitStarted: 0,

  setNearby: (nearby) => set({ nearby }),
  setPlayerPose: (playerX, playerZ, playerYaw, playerPitch, playerY) =>
    set({ playerX, playerZ, playerYaw, playerPitch, ...(playerY !== undefined ? { playerY } : {}) }),
  setPhase: (phase) => set({ phase }),
  toggleFlashlight: () => set({ flashlight: !get().flashlight }),
  toggleState: () => set({ showState: !get().showState }),
  toggleInventory: () => set({ showInventory: !get().showInventory }),
  setPrompt: (prompt) => set({ prompt }),

  begin: async (prompt) => {
    await storyAudio.start()
    set({
      phase: "generating",
      prompt,
      generatingStep: 0,
      videoUrl: null,
      videoArn: null,
      videoError: null,
      videoKind: "opening",
      ending: null,
    })
    const steps = [0, 1, 2, 3]
    const playSteps = (async () => {
      for (const step of steps) {
        set({ generatingStep: step })
        await wait(step === 0 ? 700 : 850)
      }
    })()
    const request = fetch("/api/story/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("generate failed")
      return (await res.json()) as StoryContent
    })
    const [story] = await Promise.all([request.catch(() => null), playSteps])
    const resolved =
      story ||
      ((await import("@/lib/director")).buildFlagshipStory(prompt) as StoryContent)
    set({
      story: resolved,
      worldState: resolved.worldState,
      cinematic: resolved.opening,
      shotIndex: 0,
      currentShot: resolved.opening.shots[0] ?? null,
      playerX: LANDMARKS.spawn[0],
      playerZ: LANDMARKS.spawn[2],
      playerY: 0,
      playerYaw: Math.PI / 2,
      playerPitch: 0.08,
      phase: "video-wait",
      waitStarted: Date.now(),
      videoDuration: OPENING_SECONDS,
    })
    await startAndPollVideo({
      prompt,
      title: resolved.stationName || resolved.title,
      logline: resolved.logline,
      duration: OPENING_SECONDS,
      kind: "opening",
    })
  },

  skipOrAdvanceCinema: () => {
    const { phase, videoKind } = get()
    if (phase === "cinema-hold") {
      get().enterWorld()
      return
    }
    if (phase === "video") {
      set({ phase: "cinema-hold" })
      return
    }
    if (phase === "video-wait" && get().videoError) {
      get().enterWorld()
    }
    void videoKind
  },

  enterWorld: () => {
    storyAudio.setCinema(false)
    const { cinematic, videoKind } = get()
    if (cinematic?.continueLabel === "END") {
      set({ phase: "play", cinematic: null, currentShot: null, ending: "truth", videoUrl: null })
      return
    }
    if (videoKind === "event") {
      set({ phase: "play", cinematic: null, currentShot: null, videoUrl: null, videoKind: null })
      return
    }
    set({ phase: "entering", videoUrl: null })
  },

  finishEnter: () => {
    set({ phase: "play", cinematic: null, currentShot: null, videoKind: null })
  },

  interact: async () => {
    const { nearby, phase, taken, inventory, story, openDoors } = get()
    if (!nearby || phase !== "play" || !story) return
    if (nearby.kind === "door") {
      const doorId = nearby.id
      if (openDoors.includes(doorId)) return
      await runAction(doorId)
      return
    }
    if (nearby.kind === "pickup") {
      if (taken.includes(nearby.id)) return
      const pickup = story.pickups[nearby.id]
      storyAudio.blip()
      set({
        taken: [...taken, nearby.id],
        inventory: [
          ...inventory,
          {
            id: nearby.id,
            name: pickup?.name || nearby.label,
            description: pickup?.description || "",
          },
        ],
        log: [`Picked up ${pickup?.name || nearby.label}`, ...get().log].slice(0, 12),
      })
      await runAction(nearby.id)
      return
    }
    set({ phase: "terminal", activeTerminal: nearby.id })
    storyAudio.blip()
  },

  choose: async (choiceId: string) => {
    const { activeTerminal } = get()
    if (!activeTerminal) return
    set({ phase: "play", activeTerminal: null })
    await runAction(activeTerminal, choiceId)
  },

  closeTerminal: () => set({ phase: "play", activeTerminal: null }),

  applyCinematic: async (cinematic) => {
    const captions = cinematic.shots.map((s) => s.caption || s.subtitle || s.title || "").filter(Boolean)
    set({
      cinematic,
      shotIndex: 0,
      currentShot: cinematic.shots[0] ?? null,
      activeTerminal: null,
      showInventory: false,
      videoUrl: null,
      videoError: null,
      videoKind: "event",
      videoDuration: cinematic.videoSeconds || EVENT_SECONDS,
      waitStarted: Date.now(),
      phase: "video-wait",
    })
    await startAndPollVideo({
      prompt: get().prompt,
      title: cinematic.title || get().story?.stationName || "STORYWORLD",
      logline: captions.join(" "),
      captions,
      text: cinematic.videoPrompt,
      duration: cinematic.videoSeconds || EVENT_SECONDS,
      kind: "event",
    })
  },
}))

async function startAndPollVideo(input: {
  prompt: string
  title: string
  logline: string
  captions?: string[]
  text?: string
  duration: number
  kind: "opening" | "event"
}) {
  try {
    const res = await fetch("/api/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: input.prompt,
        title: input.title,
        logline: input.logline,
        captions: input.captions,
        text: input.text,
        duration: input.duration,
      }),
    })
    const data = (await res.json()) as { invocationArn?: string; duration?: number; error?: string }
    if (!res.ok || !data.invocationArn) throw new Error(data.error || "Nova Reel refused the job")
    useStoryworld.setState({ videoArn: data.invocationArn, videoDuration: data.duration || input.duration })
    await pollUntilReady(data.invocationArn, input.kind)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Film render failed"
    useStoryworld.setState({ videoError: humanizeAwsError(message) })
  }
}

async function pollUntilReady(arn: string, kind: "opening" | "event") {
  for (;;) {
    const phase = useStoryworld.getState().phase
    if (phase !== "video-wait") return
    const res = await fetch(`/api/video/status?arn=${encodeURIComponent(arn)}`)
    const data = (await res.json()) as {
      status?: string
      videoUrl?: string | null
      failureMessage?: string | null
      error?: string
    }
    if (data.status === "Completed" && data.videoUrl) {
      storyAudio.setCinema(true)
      storyAudio.stinger()
      useStoryworld.setState({ videoUrl: data.videoUrl, phase: "video", videoKind: kind })
      return
    }
    if (data.status === "Failed" || data.error) {
      useStoryworld.setState({
        videoError: humanizeAwsError(data.failureMessage || data.error || "Nova Reel failed"),
      })
      return
    }
    await wait(8000)
  }
}

function humanizeAwsError(message: string) {
  if (/AccessDenied|not authorized|UnrecognizedClient/i.test(message)) {
    return "Bedrock denied Nova Reel. Enable amazon.nova-reel-v1:1 in Bedrock model access (us-east-1)."
  }
  if (/ValidationException|duration/i.test(message)) {
    return "Nova Reel rejected the request. Duration must be 12–120 seconds in multiples of 6."
  }
  return message
}

async function runAction(actionId: string, choiceId?: string) {
  const state = useStoryworld.getState()
  const res = await fetch("/api/story/act", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: state.prompt,
      actionId,
      choiceId,
      worldState: state.worldState,
      flags: state.flags,
      story: state.story,
    }),
  })
  if (!res.ok) return
  const data = await res.json()
  const openDoors = new Set(state.openDoors)
  if (actionId.startsWith("door-")) openDoors.add(actionId)
  for (const id of data.unlockDoors || []) openDoors.add(id)
  for (const id of data.lockDoors || []) openDoors.delete(id)
  useStoryworld.setState({
    worldState: data.worldState || state.worldState,
    flags: { ...state.flags, [actionId]: true, ...(choiceId ? { [choiceId]: true } : {}) },
    openDoors: [...openDoors],
    discovered: state.discovered.includes(actionId) ? state.discovered : [...state.discovered, actionId],
    log: data.log ? [data.log, ...state.log].slice(0, 12) : state.log,
    ending: data.ending && data.ending !== "none" ? data.ending : state.ending,
  })
  const alarm = String(data.worldState?.protocol || "").toUpperCase() === "ACTIVE"
  storyAudio.setAlarm(alarm)
  if (Number(data.worldState?.reactor) < 30) storyAudio.setTension(0.8)
  if (data.cinematic?.shots?.length) {
    await useStoryworld.getState().applyCinematic(data.cinematic)
  }
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export { EYE_HEIGHT }
