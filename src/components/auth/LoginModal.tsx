"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

type Props = {
  open: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (name: string, email: string, password: string) => Promise<void>
}

export function LoginModal({ open, onClose, onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === "login") await onLogin(email, password)
      else await onRegister(name, email, password)
      setPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next)
    setError(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} aria-label="Close" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            className="relative grid w-full max-w-4xl overflow-hidden border border-white/10 bg-[#07080e] shadow-2xl md:grid-cols-[1.05fr_0.95fr]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="relative hidden min-h-[32rem] flex-col justify-between overflow-hidden p-10 md:flex">
              <div className="auth-panel-glow pointer-events-none absolute inset-0" />
              <div className="grain pointer-events-none absolute inset-0 opacity-[0.12]" />
              <div>
                <p className="font-display text-xs tracking-[0.5em] text-gold/80">STORYWORLD</p>
                <h2 id="auth-title" className="mt-6 font-serif text-4xl leading-tight text-white">
                  Write once.
                  <br />
                  Walk forever.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                  Sign in to render films, save your gallery, and step into worlds built from your stories.
                </p>
              </div>
              <div className="space-y-3">
                {["Nova Reel cinematic renders", "Marble 3D world generation", "Personal film & world archive"].map((item) => (
                  <div key={item} className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                    {item.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-8 md:p-10">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] text-white/50 hover:text-white md:right-6 md:top-6"
              >
                ESC
              </button>

              <div className="mb-8 flex gap-2">
                {(["login", "register"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchMode(tab)}
                    className={`px-4 py-2 font-mono text-[10px] tracking-[0.28em] transition ${
                      mode === tab ? "bg-gold/15 text-gold" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <Field label="NAME">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="auth-input"
                      placeholder="Your name"
                      autoComplete="name"
                      required
                    />
                  </Field>
                )}
                <Field label="EMAIL">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="you@studio.com"
                    autoComplete="email"
                    required
                  />
                </Field>
                <Field label="PASSWORD">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input pr-16"
                      placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      minLength={mode === "register" ? 6 : undefined}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] tracking-[0.2em] text-white/35 hover:text-white/70"
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </Field>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-alert/30 bg-alert/10 px-3 py-2 font-mono text-[11px] text-alert"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="magnetic-btn mt-2 w-full border border-gold/70 bg-gold/15 py-3.5 font-mono text-[11px] tracking-[0.35em] text-gold transition hover:bg-gold hover:text-black disabled:opacity-50"
                >
                  {busy ? "PLEASE WAIT..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
                </button>
              </form>

              <p className="mt-6 font-mono text-[10px] leading-relaxed text-white/30">
                {mode === "login" ? "New here?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  className="text-gold/80 hover:text-gold"
                >
                  {mode === "login" ? "Create an account" : "Sign in instead"}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-white/35">{label}</span>
      {children}
    </label>
  )
}
