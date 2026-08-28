"use client"

import { worldThumbnailUrl } from "@/lib/worldImages"
import { useState } from "react"

type Props = {
  worldId: string
  title?: string
  className?: string
  eager?: boolean
}

export function WorldThumbnail({ worldId, title, className = "", eager = false }: Props) {
  const [failed, setFailed] = useState(false)

  if (!worldId || failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a2742] via-[#401e6e] to-[#5a2b7c] ${className}`}>
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/30">WORLD</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={worldThumbnailUrl(worldId)}
      alt={title || "World preview"}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  )
}
