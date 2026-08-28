"use client"

import { WorldThumbnail } from "@/components/ui/WorldThumbnail"
import type { GalleryWorld } from "@/lib/marble"
import type { StoryEntry, WorldEntry } from "@/lib/history"
import { useEffect, useState } from "react"

type Props = {
  open: boolean
  onClose: () => void
  localStories: StoryEntry[]
  localWorlds: WorldEntry[]
  onOpenWorld: (url: string) => void
  onReplayFilm: (story: StoryEntry) => void
  onUsePrompt: (text: string) => void
}

export function GalleryPanel({
  open,
  onClose,
  localStories,
  localWorlds,
  onOpenWorld,
  onReplayFilm,
  onUsePrompt,
}: Props) {
  const [remote, setRemote] = useState<GalleryWorld[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"worlds" | "films" | "yours">("worlds")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/world/gallery?limit=24")
      .then((r) => r.json())
      .then((d: { worlds?: GalleryWorld[] }) => setRemote(d.worlds || []))
      .catch(() => setRemote([]))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close gallery" />
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#07080e]/95 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] text-gold/80">ARCHIVE</p>
            <h2 className="font-serif text-3xl text-white">Your gallery</h2>
          </div>
          <button type="button" onClick={onClose} className="border border-white/20 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-white/70 hover:bg-white hover:text-black">
            CLOSE
          </button>
        </header>

        <div className="flex gap-2 border-b border-white/10 px-6 py-3">
          {(["worlds", "yours", "films"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-mono text-[10px] tracking-[0.28em] ${
                tab === t ? "bg-gold/15 text-gold" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "worlds" ? "ALL WORLDS" : t === "yours" ? "YOUR WORLDS" : "YOUR FILMS"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "worlds" && (
            <WorldGrid
              loading={loading}
              worlds={remote.map((w) => ({
                id: w.worldId,
                title: w.displayName,
                thumb: w.thumbnailUrl,
                caption: w.caption,
                url: w.marbleUrl,
              }))}
              onOpen={onOpenWorld}
              onUse={(w) => w.caption && onUsePrompt(w.caption)}
            />
          )}
          {tab === "yours" && (
            <WorldGrid
              loading={false}
              worlds={localWorlds.map((w) => ({
                id: w.worldId,
                title: w.title,
                thumb: w.thumbnailUrl,
                caption: w.story,
                url: w.marbleUrl,
              }))}
              onOpen={onOpenWorld}
              onUse={(w) => onUsePrompt(w.caption || "")}
              empty="No worlds yet. Render a film, then ENTER THE WORLD."
            />
          )}
          {tab === "films" && (
            <div className="grid gap-4">
              {localStories.length === 0 && (
                <p className="font-mono text-sm text-white/35">No films saved yet. Your rendered stories appear here.</p>
              )}
              {localStories.map((film) => (
                <article key={film.id} className="border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-mono text-[10px] tracking-[0.25em] text-gold/70">
                    {film.duration ? `${film.duration}S` : "FILM"} · {new Date(film.createdAt).toLocaleDateString()}
                  </p>
                  <h3 className="mt-2 font-serif text-xl text-white">{film.title || "Untitled"}</h3>
                  <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-white/45">{film.story}</p>
                  <div className="mt-4 flex gap-2">
                    {film.videoUrl && (
                      <button
                        type="button"
                        onClick={() => onReplayFilm(film)}
                        className="border border-white/25 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-white/80 hover:bg-white hover:text-black"
                      >
                        WATCH AGAIN
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onUsePrompt(film.story)}
                      className="border border-gold/40 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-gold hover:bg-gold hover:text-black"
                    >
                      USE PROMPT
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function WorldGrid({
  worlds,
  loading,
  onOpen,
  onUse,
  empty = "No worlds found.",
}: {
  worlds: Array<{ id: string; title: string; thumb?: string | null; caption?: string | null; url: string }>
  loading: boolean
  onOpen: (url: string) => void
  onUse: (w: { caption?: string | null }) => void
  empty?: string
}) {
  if (loading) return <p className="font-mono text-sm text-white/40">Loading worlds...</p>
  if (worlds.length === 0) return <p className="font-mono text-sm text-white/35">{empty}</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {worlds.map((w) => (
        <article key={w.id} className="group overflow-hidden border border-white/10 bg-black/30">
          <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
            <WorldThumbnail worldId={w.id} title={w.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
          <div className="p-4">
            <h3 className="line-clamp-1 font-serif text-lg text-white">{w.title}</h3>
            {w.caption && <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-white/40">{w.caption}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onOpen(w.url)}
                className="border border-gold/50 bg-gold/10 px-3 py-2 font-mono text-[10px] tracking-[0.22em] text-gold hover:bg-gold hover:text-black"
              >
                ENTER
              </button>
              {w.caption && (
                <button
                  type="button"
                  onClick={() => onUse(w)}
                  className="border border-white/15 px-3 py-2 font-mono text-[10px] tracking-[0.22em] text-white/50 hover:text-white"
                >
                  REMIX
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
