"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const STEPS = [
  {
    n: "01",
    title: "Write",
    desc: "Describe a scene, a place, a feeling. One paragraph is enough.",
    preview: "A young astronaut wakes inside a quiet orbital habitat. Soft blue lights flicker across brushed steel walls...",
    accent: "teal",
  },
  {
    n: "02",
    title: "Watch",
    desc: "Claude plans the shots. Nova Reel renders a photoreal multi-shot film.",
    preview: "▶ 72s cinematic · slow dollies · practical lights · film grain · connected shots",
    accent: "gold",
  },
  {
    n: "03",
    title: "Enter",
    desc: "Marble builds a walkable 3D world from your film. Step inside in one click.",
    preview: "◉ Full Gaussian splat world · explore in Marble · same quality as native viewer",
    accent: "teal",
  },
] as const

export function PipelineDemo() {
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timer.current = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 5000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  function pick(i: number) {
    setActive(i)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 5000)
  }

  const step = STEPS[active]

  return (
    <section id="how-it-works" className="scroll-mt-28">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.38em] text-teal/85">HOW IT WORKS</p>
          <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">Three steps to another reality</h2>
        </div>
        <p className="max-w-md font-mono text-xs leading-relaxed text-white/40">
          Click a step to preview the pipeline. Auto-advances every 5 seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => pick(i)}
              className={`group border p-5 text-left transition ${
                active === i ? "border-gold/50 bg-gold/10" : "border-white/10 bg-black/20 hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-[0.35em] text-gold/70">{s.n}</p>
                <motion.span
                  className="h-2 w-2 rounded-full bg-teal"
                  animate={{ opacity: active === i ? 1 : 0.2, scale: active === i ? 1.2 : 1 }}
                />
              </div>
              <p className="mt-2 font-serif text-2xl text-white">{s.title}</p>
              <p className="mt-1 font-mono text-[10px] text-white/40">{s.desc}</p>
            </button>
          ))}
        </div>

        <div className="relative min-h-[18rem] overflow-hidden border border-white/10 bg-black/35 p-8">
          <div className="pipeline-grid pointer-events-none absolute inset-0 opacity-30" />
          <AnimatePreview key={active} step={step} />
        </div>
      </div>
    </section>
  )
}

function AnimatePreview({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <p className="font-mono text-[10px] tracking-[0.35em] text-gold/70">LIVE PREVIEW · {step.title.toUpperCase()}</p>
      <p className="mt-6 font-serif text-3xl text-white">{step.title}</p>
      <p className="mt-4 max-w-lg font-mono text-sm leading-relaxed text-white/55">{step.preview}</p>
      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`h-1 flex-1 ${step.accent === "gold" ? "bg-gold/60" : "bg-teal/60"}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            style={{ transformOrigin: "left" }}
          />
        ))}
      </div>
    </motion.div>
  )
}
