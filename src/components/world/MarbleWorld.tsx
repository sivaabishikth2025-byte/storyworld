"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { SparkControls, SparkRenderer, SplatLoader, SplatMesh, type PackedSplats } from "@sparkjsdev/spark"
import { Suspense, useEffect, useRef, useState } from "react"
import { Color, PerspectiveCamera, SRGBColorSpace, Vector3 } from "three"

export type MarbleWorldProps = {
  splatUrl: string
  colliderUrl?: string | null
  scale?: number
  ground?: number
}

export function MarbleWorld({ splatUrl }: MarbleWorldProps) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [locked, setLocked] = useState(false)

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        frameloop="always"
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
        camera={{ fov: 65, near: 0.01, far: 2000, position: [0, 0, 0] }}
        onCreated={({ gl }) => {
          gl.setClearColor(new Color("#87b7e8"))
          gl.outputColorSpace = SRGBColorSpace
        }}
        onPointerDown={() => setLocked(true)}
      >
        <Suspense fallback={null}>
          <SplatScene
            splatUrl={splatUrl}
            onProgress={setProgress}
            onReady={() => setReady(true)}
            onError={setFailed}
          />
        </Suspense>
      </Canvas>
      {!ready && !failed && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end p-8 md:p-14">
          <p className="font-mono text-[11px] tracking-[0.32em] text-gold/80">
            LOADING FULL-RES SPLATS{progress > 0 ? ` · ${Math.round(progress * 100)}%` : ""}
          </p>
        </div>
      )}
      {ready && !locked && !failed && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <p className="border border-white/20 bg-black/55 px-6 py-3 font-mono text-[11px] tracking-[0.32em] text-white/70">
            CLICK TO LOOK · WASD FLY · SHIFT FAST
          </p>
        </div>
      )}
      {failed && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end p-8 md:p-14">
          <p className="max-w-lg text-sm text-alert">{failed}</p>
        </div>
      )}
    </div>
  )
}

function SplatScene({
  splatUrl,
  onProgress,
  onReady,
  onError,
}: {
  splatUrl: string
  onProgress: (n: number) => void
  onReady: () => void
  onError: (msg: string) => void
}) {
  const { gl, scene, camera, invalidate } = useThree()
  const controls = useRef<SparkControls | null>(null)
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)
  onReadyRef.current = onReady
  onErrorRef.current = onError

  useEffect(() => {
    let disposed = false
    const timer = window.setTimeout(() => {
      if (!disposed) onErrorRef.current("Splat load timed out after 5 minutes.")
    }, 300_000)

    const spark = new SparkRenderer({
      renderer: gl,
      onDirty: () => invalidate(),
      accumExtSplats: true,
      focalAdjustment: 2,
      enableLod: false,
    })
    scene.add(spark)

    const loader = new SplatLoader()
    const fps = new SparkControls({ canvas: gl.domElement })
    fps.fpsMovement.moveSpeed = 3.2
    fps.fpsMovement.shiftMultiplier = 2.5
    controls.current = fps

    let splat: SplatMesh | null = null

    loader
      .loadAsync(splatUrl, (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(event.loaded / event.total)
        }
      })
      .then((packedSplats) => {
        if (disposed) return
        splat = new SplatMesh({ packedSplats: packedSplats as PackedSplats, lod: false, enableLod: false })
        splat.quaternion.set(1, 0, 0, 0)
        scene.add(splat)

        return splat.initialized.then(() => {
          if (disposed) return
          window.clearTimeout(timer)

          const cam = camera as PerspectiveCamera
          cam.position.set(0, 0, 0)
          cam.quaternion.set(0, 0, 0, 1)

          const box = splat!.getBoundingBox()
          const center = box.getCenter(new Vector3())
          const size = box.getSize(new Vector3())
          const span = Math.max(size.x, size.y, size.z, 1)
          cam.position.set(center.x, center.y + span * 0.05, center.z + span * 0.18)
          cam.lookAt(center.x, center.y, center.z)
          cam.updateProjectionMatrix()

          onReadyRef.current()
          invalidate()
        })
      })
      .catch((err: unknown) => {
        if (disposed) return
        window.clearTimeout(timer)
        onErrorRef.current(err instanceof Error ? err.message : "Splat load failed")
      })

    return () => {
      disposed = true
      window.clearTimeout(timer)
      controls.current = null
      if (splat) {
        scene.remove(splat)
        splat.dispose()
        splat = null
      }
      scene.remove(spark)
      spark.dispose()
    }
  }, [camera, gl, invalidate, onProgress, scene, splatUrl])

  useFrame(() => {
    controls.current?.update(camera, camera)
  })

  return null
}

export default MarbleWorld
