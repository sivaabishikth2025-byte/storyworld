"use client"

import { motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect } from "react"

export function InteractiveSpotlight() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 120, damping: 22 })
  const sy = useSpring(y, { stiffness: 120, damping: 22 })

  useEffect(() => {
    function move(e: MouseEvent) {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [x, y])

  return (
    <motion.div
      className="pointer-events-none fixed z-[1] h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: sx,
        top: sy,
        background: "radial-gradient(circle, rgba(112,240,224,0.12) 0%, rgba(212,176,122,0.06) 35%, transparent 70%)",
      }}
    />
  )
}
