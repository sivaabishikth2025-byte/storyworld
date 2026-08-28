"use client"

import type { AuthUser } from "@/components/auth/AuthProvider"
import type { GalleryWorld } from "@/lib/marble"
import type { StoryEntry } from "@/lib/history"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InteractiveGlobe } from "./landing/InteractiveGlobe"
import { AnimatedCounter } from "./landing/AnimatedCounter"
import { FeatureGrid } from "./landing/FeatureGrid"
import { InteractiveSpotlight } from "./landing/InteractiveSpotlight"
import { PipelineDemo } from "./landing/PipelineDemo"
import { WorldShowcase } from "./landing/WorldShowcase"

const EXAMPLES = [
  { label: "Orbital", text: "A young astronaut wakes inside a quiet orbital habitat. Soft blue lights flicker. She floats to a window and looks at Earth while a distant corridor light pulses like a heartbeat." },
  { label: "Alley", text: "A girl finds a glowing key in a rainy alley and follows a shadow into a forgotten subway where old posters still move in the wind." },
  { label: "Castle", text: "A majestic white castle sits in a vast plain field under a bright sky. A dirt road leads toward its gates as banners ripple in the wind." },
  { label: "Neon", text: "At midnight a neon night market opens under elevated trains. Vendors sell steaming bowls while holographic fish swim between the stalls." },
]

type Props = {
  prompt: string
  onPromptChange: (v: string) => void
  onRender: () => void
  onOpenGallery: () => void
  previewWorlds: GalleryWorld[]
  localStories: StoryEntry[]
  onOpenWorld: (url: string) => void
  onUseExample: (text: string) => void
  user: AuthUser | null
  authLoading: boolean
  onOpenLogin: () => void
  onLogout: () => void
}

export function LandingPage({
  prompt,
  onPromptChange,
  onRender,
  onOpenGallery,
  previewWorlds,
  localStories,
  onOpenWorld,
  onUseExample,
  user,
  authLoading,
  onOpenLogin,
  onLogout,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const signedIn = Boolean(user)

  useEffect(() => {
    if (!menuOpen) return
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [menuOpen])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="landing-scroll pointer-events-auto relative min-h-dvh w-full overflow-x-hidden overflow-y-auto">
      <InteractiveSpotlight />
      <div className="landing-orb landing-orb-a" />
      <div className="landing-orb landing-orb-b" />
      <div className="grain pointer-events-none fixed inset-0 z-[2] opacity-[0.12]" />

      <div className="relative z-[3] mx-auto flex min-h-dvh max-w-7xl flex-col px-6 py-6 md:px-12 md:py-8">
        <header className="sticky top-0 z-20 -mx-6 border-b border-white/5 bg-black/30 px-6 py-4 backdrop-blur-xl md:-mx-12 md:px-12">
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="font-display text-sm tracking-[0.55em] text-gold/90">
              STORYWORLD
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              {[
                { label: "HOW IT WORKS", id: "how-it-works" },
                { label: "FEATURES", id: "features" },
                { label: "SHOWCASE", id: "showcase" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className="px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-white/45 transition hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={onOpenGallery}
                className="px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-white/45 transition hover:text-gold"
              >
                GALLERY
              </button>
            </nav>

            <div className="flex items-center gap-2">
              {!authLoading && !signedIn && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="magnetic-btn border border-gold/60 bg-gold/10 px-5 py-2.5 font-mono text-[10px] tracking-[0.3em] text-gold hover:bg-gold hover:text-black"
                >
                  SIGN IN
                </button>
              )}
              {signedIn && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-3 border border-white/15 bg-white/[0.04] px-3 py-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center bg-gold/20 font-mono text-xs text-gold">
                      {initials(user!.name)}
                    </span>
                    <span className="hidden font-mono text-[10px] tracking-[0.15em] text-white/70 sm:block">{user!.name}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 min-w-[10rem] border border-white/10 bg-[#07080e] py-2 shadow-xl">
                      <p className="px-4 py-2 font-mono text-[9px] text-white/35">{user!.email}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          onLogout()
                        }}
                        className="w-full px-4 py-2 text-left font-mono text-[10px] tracking-[0.2em] text-white/60 hover:bg-white/5 hover:text-white"
                      >
                        SIGN OUT
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 pt-10 md:pt-16">
          <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <motion.p
                className="font-mono text-[11px] tracking-[0.38em] text-teal/85"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                WRITE · FILM · ENTER
              </motion.p>
              <motion.h1
                className="mt-5 font-serif text-[clamp(2.6rem,6.5vw,5.2rem)] leading-[0.92] text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Turn prose into
                <br />
                cinema you can
                <br />
                <span className="bg-gradient-to-r from-gold via-white to-teal bg-clip-text text-transparent">walk inside.</span>
              </motion.h1>
              <motion.p
                className="mt-6 max-w-xl text-base leading-relaxed text-white/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                The full pipeline — story to AI film to explorable 3D world — in one cinematic workspace.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  type="button"
                  onClick={() => scrollTo("create")}
                  className="magnetic-btn border border-gold/70 bg-gold/15 px-8 py-3.5 font-mono text-[11px] tracking-[0.35em] text-gold hover:bg-gold hover:text-black"
                >
                  START CREATING
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("how-it-works")}
                  className="border border-white/20 px-8 py-3.5 font-mono text-[11px] tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                >
                  SEE HOW IT WORKS
                </button>
              </motion.div>

              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
                <div>
                  <AnimatedCounter value={localStories.length + 128} suffix="+" />
                  <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/35">FILMS RENDERED</p>
                </div>
                <div>
                  <AnimatedCounter value={previewWorlds.length + 42} suffix="+" />
                  <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/35">WORLDS LIVE</p>
                </div>
                <div>
                  <AnimatedCounter value={3} />
                  <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/35">STEP PIPELINE</p>
                </div>
              </div>
            </div>

            <motion.div
              className="relative hidden lg:flex lg:items-center lg:justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              <InteractiveGlobe
                label="FEATURED WORLD"
                title={previewWorlds[0]?.displayName || "Journey Through the Solar System"}
              />
            </motion.div>
          </section>

          <div className="my-20 space-y-24">
            <PipelineDemo />
            <FeatureGrid />
            <WorldShowcase worlds={previewWorlds} onOpenWorld={onOpenWorld} onOpenGallery={onOpenGallery} />
          </div>

          <section id="create" className="scroll-mt-28 pb-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[11px] tracking-[0.38em] text-teal/85">CREATE</p>
                <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">Write your scene</h2>
              </div>
              {!signedIn && (
                <p className="font-mono text-xs text-white/40">Sign in to render films and save your gallery.</p>
              )}
            </div>

            <div className={`relative border border-white/10 bg-black/40 p-1 backdrop-blur-md ${!signedIn ? "composer-locked" : ""}`}>
              {!signedIn && (
                <div className="composer-lock-overlay">
                  <p className="font-serif text-2xl text-white">Sign in to create</p>
                  <p className="mt-2 max-w-sm text-center font-mono text-xs text-white/45">
                    Your stories, films, and worlds are saved to your account gallery.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="magnetic-btn mt-6 border border-gold/70 bg-gold/15 px-8 py-3 font-mono text-[11px] tracking-[0.32em] text-gold hover:bg-gold hover:text-black"
                  >
                    SIGN IN TO START
                  </button>
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                disabled={!signedIn}
                className="h-44 w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed text-white/90 outline-none placeholder:text-white/25 disabled:cursor-not-allowed"
                placeholder="Describe the world you want to film and explore..."
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      type="button"
                      disabled={!signedIn}
                      onClick={() => onUseExample(ex.text)}
                      className="border border-white/10 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-white/45 hover:border-teal/40 hover:text-teal disabled:opacity-40"
                    >
                      {ex.label.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={signedIn ? onRender : onOpenLogin}
                  className="magnetic-btn border border-gold/70 bg-gold/15 px-8 py-3 font-mono text-[11px] tracking-[0.38em] text-gold transition hover:bg-gold hover:text-black"
                >
                  {signedIn ? "RENDER FILM" : "SIGN IN TO RENDER"}
                </button>
              </div>
            </div>

            {localStories[0] && signedIn && (
              <div className="mt-6 border border-white/10 bg-black/25 p-5">
                <p className="font-mono text-[10px] tracking-[0.3em] text-white/35">YOUR LAST FILM</p>
                <p className="mt-2 line-clamp-2 font-mono text-xs leading-relaxed text-white/50">{localStories[0].story}</p>
              </div>
            )}
          </section>
        </main>

        <footer className="border-t border-white/10 py-8 font-mono text-[10px] tracking-[0.22em] text-white/25">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <span>NOVA REEL · CLAUDE · MARBLE · STORYWORLD</span>
            <span>© {new Date().getFullYear()} STORYWORLD</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
}
