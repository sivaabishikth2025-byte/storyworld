"use client"

import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Suspense } from "react"
import { ACESFilmicToneMapping, SRGBColorSpace } from "three"
import { buildThemePack } from "@/lib/theme"
import { useStoryworld } from "@/store/useStoryworld"
import { Effects } from "./Effects"
import { SponzaMesh, StoryDressing } from "./MeshWorld"
import { Rig } from "./Rig"

export function Experience() {
  const phase = useStoryworld((s) => s.phase)
  const prompt = useStoryworld((s) => s.prompt)
  const story = useStoryworld((s) => s.story)
  const pack = buildThemePack(prompt, story?.theme)
  const playable = phase !== "landing" && phase !== "generating"
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 52, near: 0.08, far: 80, position: [10, 5.2, 8] }}
      onCreated={({ gl }) => {
        gl.setClearColor(pack.fog)
        gl.toneMapping = ACESFilmicToneMapping
        gl.outputColorSpace = SRGBColorSpace
        gl.toneMappingExposure = 1.05
      }}
    >
      <Suspense fallback={null}>
        <Environment preset="warehouse" environmentIntensity={pack.hdrIntensity + 0.35} />
        <ambientLight intensity={0.32} />
        <hemisphereLight args={["#f3ead8", pack.fog, 0.42]} />
        <directionalLight
          position={[8, 16, 6]}
          intensity={1.35}
          color="#fff4dc"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Physics gravity={[0, -18, 0]} paused={!playable}>
          <SponzaMesh />
          {playable && <StoryDressing />}
          <Rig />
        </Physics>
        <Effects />
      </Suspense>
    </Canvas>
  )
}

export default Experience
