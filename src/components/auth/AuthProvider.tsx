"use client"

import { LoginModal } from "@/components/auth/LoginModal"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type AuthUser = {
  id: string
  email: string
  name: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  loginOpen: boolean
  openLogin: () => void
  closeLogin: () => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = (await res.json()) as { user?: AuthUser | null }
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = (await res.json()) as { user?: AuthUser; error?: string }
    if (!res.ok || !data.user) throw new Error(data.error || "Login failed.")
    setUser(data.user)
    setLoginOpen(false)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    const data = (await res.json()) as { user?: AuthUser; error?: string }
    if (!res.ok || !data.user) throw new Error(data.error || "Registration failed.")
    setUser(data.user)
    setLoginOpen(false)
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      loginOpen,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => setLoginOpen(false),
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, loginOpen, login, register, logout, refresh],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} onRegister={register} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
