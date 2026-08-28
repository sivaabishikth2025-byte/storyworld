"use client"

import { motion } from "framer-motion"

const FEATURES = [
  {
    icon: "✦",
    title: "AI-directed cinema",
    body: "Claude reads your story and writes caption-style shot prompts tuned for Nova Reel.",
  },
  {
    icon: "◎",
    title: "Photoreal film",
    body: "Multi-shot MP4 renders with motivated camera, practical lights, and film grain.",
  },
  {
    icon: "◇",
    title: "Walkable worlds",
    body: "Marble turns your film into a full 3D Gaussian splat world you can explore.",
  },
  {
    icon: "▣",
    title: "Your gallery",
    body: "Every film and world saves to your personal archive. Replay, remix, re-enter.",
  },
  {
    icon: "⟡",
    title: "One-click enter",
    body: "No in-app compromise — opens directly in Marble at native quality.",
  },
  {
    icon: "◈",
    title: "Story-first",
    body: "Start with words, not meshes. The pipeline follows your narrative intent.",
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-28">
      <div className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.38em] text-teal/85">FEATURES</p>
        <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">Built for storytellers</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            className="feature-card group border border-white/10 bg-black/25 p-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -4, borderColor: "rgba(212,176,122,0.35)" }}
          >
            <span className="font-mono text-xl text-gold/80 transition group-hover:scale-110">{f.icon}</span>
            <h3 className="mt-4 font-serif text-2xl text-white">{f.title}</h3>
            <p className="mt-2 font-mono text-xs leading-relaxed text-white/45">{f.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
