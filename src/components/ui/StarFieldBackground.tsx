"use client"

import { useEffect, useRef } from "react"

type Star = { x: number; y: number; s: number }
type Layer = { x: number; x2: number; y: number; s: number; buffer: HTMLCanvasElement }

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function StarFieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const sf = {
      parallax: true,
      parallaxSens: 0.8,
      starDensity: 1,
      direction: "right" as "left" | "right",
      dx: 0.2,
      cw: 0,
      ch: 0,
      parallaxVal: 0,
      numStars: 0,
      stars: [] as Star[],
      layers: [] as Layer[],
      raf: 0,
    }

    function createStar(size: number, count: number) {
      for (let i = 0; i < count; i++) {
        sf.stars.push({
          x: rand(4, sf.cw - 4),
          y: rand(4, sf.ch - 4),
          s: size,
        })
      }
    }

    function renderStars(size: number, layerCtx: CanvasRenderingContext2D) {
      for (let i = 0; i < sf.stars.length; i++) {
        const star = sf.stars[i]
        if (star.s !== size) continue
        let color = "rgba(255, 255, 255, 0.2)"
        if (star.s === 3) color = "rgba(255, 255, 255, 0.4)"
        else if (star.s === 2) color = "rgba(255, 255, 255, 0.3)"
        layerCtx.beginPath()
        layerCtx.arc(star.x, star.y, star.s, 0, Math.PI * 2, true)
        layerCtx.closePath()
        layerCtx.fillStyle = color
        layerCtx.fill()
      }
    }

    function setup() {
      sf.cw = container!.clientWidth
      sf.ch = container!.clientHeight
      canvas!.width = sf.cw
      canvas!.height = sf.ch
      sf.stars = []
      sf.layers = []

      const area = (sf.cw * sf.ch) / 1600
      sf.numStars = area * sf.starDensity

      const large = 3
      const medium = 2
      const small = 1
      let n = 0
      while (n <= sf.numStars) {
        let size = rand(1, 3)
        let count = 5 * Math.round(large / size)
        if (size === 1) {
          size = large
          count = 1
        } else if (size === 2) {
          size = medium
          count = 20
        } else {
          size = small
          count = 80
        }
        createStar(size, count)
        n += count
      }

      for (let layerSize = small; layerSize <= large + 1; layerSize++) {
        const buffer = document.createElement("canvas")
        buffer.width = sf.cw
        buffer.height = sf.ch
        const bufferCtx = buffer.getContext("2d")
        if (!bufferCtx) continue
        renderStars(layerSize, bufferCtx)
        sf.layers.push({ x: 0, x2: sf.cw, y: 0, s: layerSize, buffer })
      }
    }

    function clearCanvas() {
      ctx!.clearRect(0, 0, sf.cw, sf.ch)
    }

    function animatePanel() {
      for (const layer of sf.layers) {
        const s = layer.s
        if (sf.parallax) layer.y = sf.parallaxVal * (s * sf.parallaxSens)
        if (sf.direction === "left") {
          layer.x = layer.x <= -sf.cw ? 0 : layer.x - s * sf.dx
          layer.x2 = layer.x + sf.cw
        } else {
          layer.x = layer.x >= sf.cw ? 0 : layer.x + s * sf.dx
          layer.x2 = layer.x - sf.cw
        }
        ctx!.drawImage(layer.buffer, layer.x, layer.y)
        ctx!.drawImage(layer.buffer, layer.x2, layer.y)
        if (sf.parallax) {
          ctx!.drawImage(layer.buffer, layer.x, layer.y + sf.ch)
          ctx!.drawImage(layer.buffer, layer.x2, layer.y + sf.ch)
        }
      }
    }

    function animate() {
      sf.raf = requestAnimationFrame(animate)
      clearCanvas()
      animatePanel()
    }

    function onScroll() {
      sf.parallaxVal = -window.scrollY
    }

    let resizeTimer: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(setup, 400)
    }

    setup()
    onScroll()
    sf.raf = requestAnimationFrame(animate)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(sf.raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  return (
    <div ref={containerRef} className="star-field-container" aria-hidden>
      <canvas ref={canvasRef} className="star-field" />
    </div>
  )
}
