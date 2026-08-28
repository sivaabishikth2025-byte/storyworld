import type { AABB, DoorDef, InteractableDef, RoomDef, Vec3 } from "./types"

export const EYE_HEIGHT = 1.64
export const PLAYER_RADIUS = 0.34
export const WALL_T = 0.3
export const DOOR_H = 2.86

export const ROOMS: Record<string, RoomDef> = {
  hub: {
    id: "hub",
    name: "Central Hall",
    x: 0,
    z: 0,
    w: 16,
    d: 8,
    h: 8,
    openings: { n: 4, s: 4, e: 4, w: 4 },
    mood: "hub",
  },
  command: {
    id: "command",
    name: "West Wing",
    x: -11.4,
    z: 0,
    w: 7.2,
    d: 12,
    h: 8,
    openings: { e: 4 },
    window: "w",
    mood: "command",
  },
  medical: {
    id: "medical",
    name: "East Wing",
    x: 11.4,
    z: 0,
    w: 7.2,
    d: 12,
    h: 8,
    openings: { w: 4 },
    mood: "medical",
  },
  engineering: {
    id: "engineering",
    name: "South Aisle",
    x: 0,
    z: -6.7,
    w: 24,
    d: 5.2,
    h: 6,
    openings: { n: 4 },
    mood: "engineering",
  },
  cargo: {
    id: "cargo",
    name: "North Aisle",
    x: 0,
    z: 6.7,
    w: 24,
    d: 5.2,
    h: 6,
    openings: { s: 4 },
    mood: "cargo",
  },
  unknown: {
    id: "unknown",
    name: "Upper Gallery",
    x: -11,
    z: 5.8,
    w: 8,
    d: 6,
    h: 5,
    openings: { s: 3 },
    mood: "unknown",
  },
}

export const CORRIDORS: Record<string, RoomDef> = {
  "corr-n": {
    id: "corr-n",
    name: "Spine A",
    x: 0,
    z: 14,
    w: 4.4,
    d: 12,
    h: 3.5,
    openings: { n: 3.4, s: 3.4 },
    mood: "corridor",
  },
  "corr-e": {
    id: "corr-e",
    name: "Spine B",
    x: 14,
    z: 0,
    w: 12,
    d: 4.4,
    h: 3.5,
    openings: { e: 3.4, w: 3.4 },
    mood: "corridor",
  },
  "corr-s": {
    id: "corr-s",
    name: "Spine C",
    x: 0,
    z: -14,
    w: 4.4,
    d: 12,
    h: 3.5,
    openings: { n: 3.4, s: 3.4 },
    mood: "corridor",
  },
  "corr-w": {
    id: "corr-w",
    name: "Spine D",
    x: -14,
    z: 0,
    w: 12,
    d: 4.4,
    h: 3.5,
    openings: { e: 3.4, w: 3.4 },
    mood: "corridor",
  },
  "corr-cn": {
    id: "corr-cn",
    name: "Restricted Access",
    x: -30,
    z: 11,
    w: 4.2,
    d: 4,
    h: 3.3,
    openings: { n: 3.2, s: 3.2 },
    mood: "corridor",
  },
}

export const ALL_SPACES: RoomDef[] = [...Object.values(ROOMS), ...Object.values(CORRIDORS)]

export const LANDMARKS = {
  spawn: [11.8, 0, 0.55] as Vec3,
  spawnLook: [0, 1.5, 0] as Vec3,
  cryoCam: [11.8, 0.55, 0.55] as Vec3,
  cryoSit: [11.8, 1.15, 0.55] as Vec3,
  cryoStand: [11.8, EYE_HEIGHT, 0.55] as Vec3,
  medical: [11.4, 1.55, 0] as Vec3,
  hub: [0, 1.7, 0] as Vec3,
  command: [-11.4, 1.8, 0] as Vec3,
  commandWindow: [-13.4, 2.4, 0] as Vec3,
  reactor: [0.4, 1.1, -6.6] as Vec3,
  cargo: [0, 1.6, 6.5] as Vec3,
  unknown: [-11.2, 1.5, 5.8] as Vec3,
  unknownDeep: [-12.6, 1.4, 6.4] as Vec3,
}

export const DOORS: DoorDef[] = [
  {
    id: "door-medical",
    label: "EAST WING",
    position: [8.2, 0, 0],
    rotationY: Math.PI / 2,
    width: 2.4,
    height: DOOR_H,
    locked: false,
    cinematicOnFirstOpen: true,
    from: "medical",
    to: "hub",
  },
  {
    id: "door-command",
    label: "WEST WING",
    position: [-8.2, 0, 0],
    rotationY: Math.PI / 2,
    width: 2.4,
    height: DOOR_H,
    locked: false,
    cinematicOnFirstOpen: true,
    from: "hub",
    to: "command",
  },
  {
    id: "door-engineering",
    label: "SOUTH AISLE",
    position: [1.8, 0, -5.6],
    rotationY: 0,
    width: 2.2,
    height: DOOR_H,
    locked: true,
    key: "keycard",
    cinematicOnFirstOpen: true,
    from: "hub",
    to: "engineering",
  },
  {
    id: "door-cargo",
    label: "NORTH AISLE",
    position: [1.8, 0, 5.6],
    rotationY: 0,
    width: 2.2,
    height: DOOR_H,
    locked: false,
    from: "hub",
    to: "cargo",
  },
  {
    id: "door-unknown",
    label: "RESTRICTED",
    position: [-11.4, 0, 5.15],
    rotationY: 0,
    width: 2.0,
    height: DOOR_H,
    locked: true,
    key: "welder",
    cinematicOnFirstOpen: true,
    from: "command",
    to: "unknown",
  },
]

export const INTERACTABLES: InteractableDef[] = [
  {
    id: "term-cryo",
    kind: "terminal",
    position: [12.4, 1.15, -1.4],
    rotationY: Math.PI,
    label: "Cryo Terminal",
    room: "medical",
    prompt: "Read cryo log",
  },
  {
    id: "pickup-keycard",
    kind: "pickup",
    position: [10.2, 1.05, -3.4],
    label: "Officer Keycard",
    room: "medical",
    prompt: "Take keycard",
  },
  {
    id: "term-medical",
    kind: "terminal",
    position: [10.6, 1.15, 3.3],
    rotationY: Math.PI,
    label: "Medbay Console",
    room: "medical",
    prompt: "Open medical logs",
  },
  {
    id: "term-hub",
    kind: "terminal",
    position: [1.6, 1.15, -2.2],
    label: "Hub Directory",
    room: "hub",
    prompt: "Read station directory",
  },
  {
    id: "term-command",
    kind: "console",
    position: [-12.2, 1.12, 0.2],
    label: "Command Helm",
    room: "command",
    prompt: "Access command systems",
  },
  {
    id: "term-engineering",
    kind: "reactor",
    position: [3.6, 1.2, -6.8],
    rotationY: -Math.PI / 2,
    label: "Reactor Control",
    room: "engineering",
    prompt: "Inspect reactor",
  },
  {
    id: "pickup-welder",
    kind: "pickup",
    position: [4.8, 0.7, 6.6],
    label: "Plasma Cutter",
    room: "cargo",
    prompt: "Pick up plasma cutter",
  },
  {
    id: "pickup-recorder",
    kind: "pickup",
    position: [-3.4, 1.05, 6.4],
    label: "Voice Recorder",
    room: "cargo",
    prompt: "Take recorder",
  },
  {
    id: "term-cargo",
    kind: "terminal",
    position: [-5.2, 1.15, 6.6],
    rotationY: Math.PI / 2,
    label: "Manifest Terminal",
    room: "cargo",
    prompt: "Read cargo manifest",
  },
  {
    id: "term-unknown",
    kind: "terminal",
    position: [-12.4, 1.15, 6.5],
    rotationY: Math.PI / 2,
    label: "Black Terminal",
    room: "unknown",
    prompt: "Access restricted log",
  },
]

function aabb(id: string, minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, kind: AABB["kind"] = "wall"): AABB {
  return {
    id,
    kind,
    min: [Math.min(minX, maxX), Math.min(minY, maxY), Math.min(minZ, maxZ)],
    max: [Math.max(minX, maxX), Math.max(minY, maxY), Math.max(minZ, maxZ)],
  }
}

function wallOnNorth(room: RoomDef, gap: number): AABB[] {
  const z = room.z + room.d / 2
  const y1 = room.h
  const x0 = room.x - room.w / 2
  const x1 = room.x + room.w / 2
  const t = WALL_T
  if (!gap) return [aabb(`${room.id}-n`, x0, 0, z - t, x1, y1, z + 0.02)]
  const gl = room.x - gap / 2
  const gr = room.x + gap / 2
  return [
    aabb(`${room.id}-n-l`, x0, 0, z - t, gl, y1, z + 0.02),
    aabb(`${room.id}-n-r`, gr, 0, z - t, x1, y1, z + 0.02),
    aabb(`${room.id}-n-top`, gl, DOOR_H, z - t, gr, y1, z + 0.02),
  ]
}

function wallOnSouth(room: RoomDef, gap: number): AABB[] {
  const z = room.z - room.d / 2
  const y1 = room.h
  const x0 = room.x - room.w / 2
  const x1 = room.x + room.w / 2
  const t = WALL_T
  if (!gap) return [aabb(`${room.id}-s`, x0, 0, z - 0.02, x1, y1, z + t)]
  const gl = room.x - gap / 2
  const gr = room.x + gap / 2
  return [
    aabb(`${room.id}-s-l`, x0, 0, z - 0.02, gl, y1, z + t),
    aabb(`${room.id}-s-r`, gr, 0, z - 0.02, x1, y1, z + t),
    aabb(`${room.id}-s-top`, gl, DOOR_H, z - 0.02, gr, y1, z + t),
  ]
}

function wallOnEast(room: RoomDef, gap: number): AABB[] {
  const x = room.x + room.w / 2
  const y1 = room.h
  const z0 = room.z - room.d / 2
  const z1 = room.z + room.d / 2
  const t = WALL_T
  if (!gap) return [aabb(`${room.id}-e`, x - t, 0, z0, x + 0.02, y1, z1)]
  const gl = room.z - gap / 2
  const gr = room.z + gap / 2
  return [
    aabb(`${room.id}-e-l`, x - t, 0, z0, x + 0.02, y1, gl),
    aabb(`${room.id}-e-r`, x - t, 0, gr, x + 0.02, y1, z1),
    aabb(`${room.id}-e-top`, x - t, DOOR_H, gl, x + 0.02, y1, gr),
  ]
}

function wallOnWest(room: RoomDef, gap: number): AABB[] {
  const x = room.x - room.w / 2
  const y1 = room.h
  const z0 = room.z - room.d / 2
  const z1 = room.z + room.d / 2
  const t = WALL_T
  if (!gap) return [aabb(`${room.id}-w`, x - 0.02, 0, z0, x + t, y1, z1)]
  const gl = room.z - gap / 2
  const gr = room.z + gap / 2
  return [
    aabb(`${room.id}-w-l`, x - 0.02, 0, z0, x + t, y1, gl),
    aabb(`${room.id}-w-r`, x - 0.02, 0, gr, x + t, y1, z1),
    aabb(`${room.id}-w-top`, x - 0.02, DOOR_H, gl, x + t, y1, gr),
  ]
}

export function collidersForSpace(room: RoomDef): AABB[] {
  const nGap = room.window === "n" ? 0 : (room.openings.n ?? 0)
  const walls = [
    ...wallOnNorth(room, nGap),
    ...wallOnSouth(room, room.openings.s ?? 0),
    ...wallOnEast(room, room.openings.e ?? 0),
    ...wallOnWest(room, room.openings.w ?? 0),
  ]
  return walls
}

export const STATIC_COLLIDERS: AABB[] = [
  aabb("cryo-pod", 10.6, 0, -0.5, 13.1, 1.5, 2.4, "prop"),
  aabb("med-desk", 9.7, 0, 2.7, 11.6, 1.1, 4.0, "prop"),
  aabb("hub-console", 0.7, 0, -2.9, 2.5, 1.1, -1.5, "prop"),
  aabb("helm", -13.3, 0, -0.7, -11.1, 1.15, 1.1, "prop"),
  aabb("crate-a", 4.0, 0, 5.8, 5.7, 1.6, 7.5, "prop"),
  aabb("eng-console", 2.7, 0, -7.5, 4.5, 1.3, -6.1, "prop"),
]

export function pointInRoom(x: number, z: number, room: RoomDef) {
  return (
    x >= room.x - room.w / 2 &&
    x <= room.x + room.w / 2 &&
    z >= room.z - room.d / 2 &&
    z <= room.z + room.d / 2
  )
}

export function roomAt(x: number, z: number, y = 0): RoomDef {
  if (y > 4.15) return ROOMS.unknown
  if (x > 8) return ROOMS.medical
  if (x < -8) return ROOMS.command
  if (z < -4.6) return ROOMS.engineering
  if (z > 4.6) return ROOMS.cargo
  if (x < -6 && z > 3.4) return ROOMS.unknown
  for (const room of Object.values(ROOMS)) {
    if (pointInRoom(x, z, room)) return room
  }
  return ROOMS.hub
}
