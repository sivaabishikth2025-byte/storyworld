import { WorldThumbnail } from "@/components/ui/WorldThumbnail"
import type { GalleryWorld } from "@/lib/marble"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef } from "react"

type Props = {
  worlds: GalleryWorld[]
  onOpenWorld: (url: string) => void
  onOpenGallery: () => void
}

export function WorldShowcase({ worlds, onOpenWorld, onOpenGallery }: Props) {
  return (
    <section id="showcase" className="scroll-mt-28">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.38em] text-teal/85">SHOWCASE</p>
          <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">Worlds waiting to be entered</h2>
        </div>
        <button
          type="button"
          onClick={onOpenGallery}
          className="magnetic-btn border border-white/15 px-5 py-2.5 font-mono text-[10px] tracking-[0.3em] text-white/70 hover:border-gold/40 hover:text-gold"
        >
          OPEN GALLERY →
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {worlds.slice(0, 4).map((w, i) => (
          <TiltCard key={w.worldId} world={w} index={i} onOpen={() => onOpenWorld(w.marbleUrl)} />
        ))}
        {worlds.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] border border-dashed border-white/15 bg-white/[0.02]" />
          ))}
      </div>
    </section>
  )
}

function TiltCard({ world, index, onOpen }: { world: GalleryWorld; index: number; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 })

  function move(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  function leave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      onMouseMove={move}
      onMouseLeave={leave}
      className="group relative aspect-[4/5] overflow-hidden border border-white/10 bg-black/30 text-left"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
    >
      <WorldThumbnail worldId={world.worldId} title={world.displayName} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="line-clamp-1 font-serif text-xl text-white">{world.displayName}</p>
        <p className="mt-2 font-mono text-[9px] tracking-[0.28em] text-gold/90 opacity-0 transition group-hover:opacity-100">
          ENTER WORLD →
        </p>
      </div>
    </motion.button>
  )
}
