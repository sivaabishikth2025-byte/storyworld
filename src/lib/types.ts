export type Vec3 = [number, number, number]

export type WorldStat = string | number | boolean

export type StoryChoice = {
  id: string
  label: string
  hint?: string
}

export type TerminalContent = {
  title: string
  body: string
  choices?: StoryChoice[]
}

export type PickupContent = {
  name: string
  description: string
}

export type Shot = {
  id: string
  duration: number
  position: Vec3
  lookAt: Vec3
  fov?: number
  title?: string
  subtitle?: string
  caption?: string
  fade?: "in" | "out" | "none" | "hold"
  still?: string
  kenBurns?: { from: number; to: number; x: number; y: number }
}

export type Cinematic = {
  id: string
  title?: string
  continueLabel?: string
  shots: Shot[]
  videoPrompt?: string
  videoSeconds?: number
}

import type { WorldTheme } from "./theme"

export type StoryContent = {
  title: string
  logline: string
  stationName: string
  protagonist: string
  threat: string
  theme: WorldTheme
  opening: Cinematic
  terminals: Record<string, TerminalContent>
  pickups: Record<string, PickupContent>
  worldState: Record<string, WorldStat>
  notes?: string[]
}

export type ActResult = {
  worldState: Record<string, WorldStat>
  cinematic: Cinematic | null
  log?: string
  unlockDoors?: string[]
  lockDoors?: string[]
  removePickup?: string
  ending?: "none" | "repair" | "hunt" | "collapse" | "truth"
}

export type InteractKind = "terminal" | "pickup" | "console" | "note" | "reactor" | "door"

export type InteractableDef = {
  id: string
  kind: InteractKind
  position: Vec3
  rotationY?: number
  label: string
  room: string
  prompt?: string
}

export type DoorDef = {
  id: string
  label: string
  position: Vec3
  rotationY: number
  width: number
  height: number
  locked: boolean
  key?: string
  cinematicOnFirstOpen?: boolean
  from: string
  to: string
}

export type RoomMood =
  | "hub"
  | "command"
  | "medical"
  | "engineering"
  | "cargo"
  | "unknown"
  | "corridor"

export type Cardinal = "n" | "s" | "e" | "w"

export type RoomDef = {
  id: string
  name: string
  x: number
  z: number
  w: number
  d: number
  h: number
  openings: Partial<Record<Cardinal, number>>
  window?: Cardinal
  mood: RoomMood
}

export type AABB = {
  id: string
  min: Vec3
  max: Vec3
  kind: "wall" | "prop" | "door"
}

export type InventoryItem = {
  id: string
  name: string
  description: string
}

export type Phase =
  | "landing"
  | "generating"
  | "video-wait"
  | "video"
  | "cinema"
  | "cinema-hold"
  | "entering"
  | "play"
  | "terminal"
  | "paused"

export type NearbyTarget = {
  id: string
  kind: InteractKind
  label: string
  prompt: string
  distance: number
}
