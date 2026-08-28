export type StoryEntry = {
  id: string
  story: string
  title: string
  videoUrl?: string
  videoKey?: string
  duration?: number
  createdAt: number
}

export type WorldEntry = {
  id: string
  worldId: string
  title: string
  story: string
  marbleUrl: string
  thumbnailUrl?: string | null
  createdAt: number
}

const STORIES_KEY = "storyworld:stories"
const WORLDS_KEY = "storyworld:worlds"
const MAX = 40

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items.slice(0, MAX)))
}

export function getStories() {
  return read<StoryEntry>(STORIES_KEY)
}

export function getWorlds() {
  return read<WorldEntry>(WORLDS_KEY)
}

export function saveStory(entry: Omit<StoryEntry, "id" | "createdAt">) {
  const items = getStories()
  const next: StoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  write(STORIES_KEY, [next, ...items.filter((s) => s.story !== entry.story)])
  return next
}

export function saveWorld(entry: Omit<WorldEntry, "id" | "createdAt">) {
  const items = getWorlds()
  const next: WorldEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  write(WORLDS_KEY, [next, ...items.filter((w) => w.worldId !== entry.worldId)])
  return next
}
