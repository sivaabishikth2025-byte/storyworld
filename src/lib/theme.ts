export type WorldTheme = "station" | "manor" | "bunker" | "lab" | "temple" | "hotel" | "ship"

export type ThemePack = {
  id: WorldTheme
  worldName: string
  logline: string
  protagonist: string
  threat: string
  rooms: Record<string, string>
  doors: Record<string, string>
  hud: { a: string; b: string; c: string; d: string }
  fog: string
  accent: string
  wall: string
  wallLow: string
  floor: string
  trim: string
  hdr: string
  hdrIntensity: number
  windowKind: "earth" | "rain" | "city" | "stars" | "slit" | "stained" | "void"
  startProp: "cryo" | "bed" | "bunk" | "slab" | "altar" | "couch" | "capsule"
  heartName: string
}

const PACKS: Record<WorldTheme, Omit<ThemePack, "worldName" | "logline" | "protagonist" | "threat">> = {
  station: {
    id: "station",
    rooms: {
      medical: "Medical / Cryo",
      hub: "Central Hub",
      command: "Command Deck",
      engineering: "Engineering",
      cargo: "Cargo Hold",
      unknown: "Unknown Sector",
    },
    doors: {
      "door-medical": "MEDICAL BAY",
      "door-command": "COMMAND DECK",
      "door-engineering": "ENGINEERING",
      "door-cargo": "CARGO HOLD",
      "door-unknown": "RESTRICTED",
    },
    hud: { a: "Reactor", b: "Oxygen", c: "Presence", d: "Protocol" },
    fog: "#07090e",
    accent: "#4ee0d2",
    wall: "#1a2129",
    wallLow: "#10151b",
    floor: "#0c1016",
    trim: "#4ee0d2",
    hdr: "/env/studio.hdr",
    hdrIntensity: 0.18,
    windowKind: "earth",
    startProp: "cryo",
    heartName: "reactor",
  },
  manor: {
    id: "manor",
    rooms: {
      medical: "The Bedroom",
      hub: "Grand Foyer",
      command: "The Study",
      engineering: "The Cellar",
      cargo: "Gallery",
      unknown: "East Wing",
    },
    doors: {
      "door-medical": "BEDROOM",
      "door-command": "STUDY",
      "door-engineering": "CELLAR",
      "door-cargo": "GALLERY",
      "door-unknown": "EAST WING",
    },
    hud: { a: "Hearth", b: "Lamp oil", c: "Guest", d: "House" },
    fog: "#120e0c",
    accent: "#d4a574",
    wall: "#3a2a22",
    wallLow: "#241812",
    floor: "#1a110d",
    trim: "#c9a36a",
    hdr: "/env/workshop.hdr",
    hdrIntensity: 0.32,
    windowKind: "rain",
    startProp: "bed",
    heartName: "furnace",
  },
  bunker: {
    id: "bunker",
    rooms: {
      medical: "Infirmary",
      hub: "Junction",
      command: "War Room",
      engineering: "Generator",
      cargo: "Stores",
      unknown: "Deep Level",
    },
    doors: {
      "door-medical": "INFIRMARY",
      "door-command": "WAR ROOM",
      "door-engineering": "GENERATOR",
      "door-cargo": "STORES",
      "door-unknown": "DEEP LEVEL",
    },
    hud: { a: "Generator", b: "Air", c: "Contact", d: "Lockdown" },
    fog: "#0c0d0a",
    accent: "#c4d46a",
    wall: "#2a2c26",
    wallLow: "#161814",
    floor: "#121410",
    trim: "#b7c85a",
    hdr: "/env/studio.hdr",
    hdrIntensity: 0.14,
    windowKind: "slit",
    startProp: "bunk",
    heartName: "generator",
  },
  lab: {
    id: "lab",
    rooms: {
      medical: "Recovery",
      hub: "Atrium",
      command: "Observation",
      engineering: "Core",
      cargo: "Specimens",
      unknown: "Containment",
    },
    doors: {
      "door-medical": "RECOVERY",
      "door-command": "OBSERVATION",
      "door-engineering": "CORE",
      "door-cargo": "SPECIMENS",
      "door-unknown": "CONTAINMENT",
    },
    hud: { a: "Core", b: "Sterile air", c: "Subject", d: "Quarantine" },
    fog: "#0b1014",
    accent: "#7ecbff",
    wall: "#d8e2ea",
    wallLow: "#b7c4ce",
    floor: "#8a9aa6",
    trim: "#3db7ff",
    hdr: "/env/studio.hdr",
    hdrIntensity: 0.45,
    windowKind: "void",
    startProp: "slab",
    heartName: "core",
  },
  temple: {
    id: "temple",
    rooms: {
      medical: "Sanctum",
      hub: "Nave",
      command: "Altar Hall",
      engineering: "Crypt",
      cargo: "Reliquary",
      unknown: "Forbidden Aisle",
    },
    doors: {
      "door-medical": "SANCTUM",
      "door-command": "ALTAR",
      "door-engineering": "CRYPT",
      "door-cargo": "RELIQUARY",
      "door-unknown": "FORBIDDEN",
    },
    hud: { a: "Flame", b: "Breath", c: "Witness", d: "Rite" },
    fog: "#140f0a",
    accent: "#e8c36a",
    wall: "#4a3b2e",
    wallLow: "#2c221a",
    floor: "#1c1510",
    trim: "#e0b85c",
    hdr: "/env/workshop.hdr",
    hdrIntensity: 0.22,
    windowKind: "stained",
    startProp: "altar",
    heartName: "flame",
  },
  hotel: {
    id: "hotel",
    rooms: {
      medical: "Suite 07",
      hub: "Lobby",
      command: "Penthouse",
      engineering: "Boiler",
      cargo: "Service",
      unknown: "Room 13",
    },
    doors: {
      "door-medical": "SUITE",
      "door-command": "PENTHOUSE",
      "door-engineering": "BOILER",
      "door-cargo": "SERVICE",
      "door-unknown": "ROOM 13",
    },
    hud: { a: "Power", b: "Night air", c: "Guest", d: "Vacancy" },
    fog: "#0e0a12",
    accent: "#ff4d8d",
    wall: "#2a2433",
    wallLow: "#16121c",
    floor: "#120e16",
    trim: "#ff5ea0",
    hdr: "/env/studio.hdr",
    hdrIntensity: 0.2,
    windowKind: "city",
    startProp: "couch",
    heartName: "boiler",
  },
  ship: {
    id: "ship",
    rooms: {
      medical: "Cabin",
      hub: "Midships",
      command: "Bridge",
      engineering: "Engine",
      cargo: "Hold",
      unknown: "Below",
    },
    doors: {
      "door-medical": "CABIN",
      "door-command": "BRIDGE",
      "door-engineering": "ENGINE",
      "door-cargo": "HOLD",
      "door-unknown": "BELOW",
    },
    hud: { a: "Engine", b: "Bilge air", c: "Crew", d: "Heading" },
    fog: "#0a1214",
    accent: "#f0c36a",
    wall: "#3a332c",
    wallLow: "#221c16",
    floor: "#16110c",
    trim: "#e2b45a",
    hdr: "/env/workshop.hdr",
    hdrIntensity: 0.2,
    windowKind: "stars",
    startProp: "capsule",
    heartName: "engine",
  },
}

export function inferTheme(prompt: string): WorldTheme {
  const p = prompt.toLowerCase()
  const hit = (words: string[]) => words.some((w) => p.includes(w))
  if (hit(["astronaut", "space station", "orbit", "mars", "nasa", "cryo", "airlock"])) return "station"
  if (hit(["manor", "mansion", "haunted", "gothic", "estate", "butler", "attic"])) return "manor"
  if (hit(["bunker", "apocalypse", "soldier", "fallout", "war room", "nuke"])) return "bunker"
  if (hit(["lab", "scientist", "virus", "experiment", "clone", "specimen"])) return "lab"
  if (hit(["temple", "priest", "cathedral", "god", "curse", "ritual", "monk"])) return "temple"
  if (hit(["hotel", "noir", "detective", "rain", "neon", "city", "motel"])) return "hotel"
  if (hit(["ship", "pirate", "ocean", "captain", "sail", "mutiny", "below deck"])) return "ship"
  if (hit(["station", "spaceship", "alien", "galaxy"])) return "station"
  if (hit(["house", "bedroom", "ghost"])) return "manor"
  if (hit(["forest", "cabin", "witch"])) return "manor"
  return "station"
}

export function buildThemePack(prompt: string, theme = inferTheme(prompt)): ThemePack {
  const base = PACKS[theme]
  const named = guessName(prompt)
  const first = prompt.split(/[.!?]/)[0]?.trim() || prompt
  return {
    ...base,
    worldName: named || defaultWorldName(theme),
    logline: first.slice(0, 160),
    protagonist: guessRole(prompt, theme),
    threat: guessThreat(prompt),
  }
}

function defaultWorldName(theme: WorldTheme) {
  const names: Record<WorldTheme, string> = {
    station: "HELIOS-7",
    manor: "BLACKWELL HOUSE",
    bunker: "SITE 12",
    lab: "ORPHEUS LAB",
    temple: "ASHEN NAVE",
    hotel: "HOTEL NOCTURNE",
    ship: "THE MERIDIAN",
  }
  return names[theme]
}

function guessName(prompt: string) {
  const quoted = prompt.match(/"([^"]+)"/)
  if (quoted) return quoted[1].toUpperCase()
  const named = prompt.match(/\b(?:called|named)\s+([A-Z][A-Za-z0-9\- ]{2,24})/)
  if (named) return named[1].toUpperCase()
  return ""
}

function guessRole(prompt: string, theme: WorldTheme) {
  const m = prompt.match(/\b(a|an)\s+([a-z][a-z ]{2,30}?)\s+(wakes|walks|enters|finds)/i)
  if (m) return m[2]
  const roles: Record<WorldTheme, string> = {
    station: "the one who thawed",
    manor: "the last guest",
    bunker: "the survivor",
    lab: "the test that woke",
    temple: "the acolyte",
    hotel: "the guest in 07",
    ship: "the last hand",
  }
  return roles[theme]
}

function guessThreat(prompt: string) {
  const m = prompt.match(/\b(something|someone|a [a-z]+)\s+(is|still|moves|lurks|waits).{0,40}/i)
  if (m) return m[0]
  return "whatever still moves after the silence"
}

export function themeRoomName(theme: ThemePack, roomId: string, fallback: string) {
  return theme.rooms[roomId] || fallback
}
