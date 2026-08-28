"use client"

import { StarFieldBackground } from "@/components/ui/StarFieldBackground"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StarFieldBackground />
      <div className="app-content relative z-[1] min-h-dvh">{children}</div>
    </>
  )
}
