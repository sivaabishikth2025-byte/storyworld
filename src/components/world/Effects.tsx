"use client"

import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing"
import { useStoryworld } from "@/store/useStoryworld"

export function Effects() {
  const cinema = useStoryworld((s) => s.phase === "video" || s.phase === "cinema-hold" || s.phase === "entering")
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SMAA />
      <Bloom intensity={cinema ? 0.7 : 0.42} luminanceThreshold={0.32} luminanceSmoothing={0.4} mipmapBlur />
      <Vignette offset={0.22} darkness={cinema ? 0.7 : 0.48} />
    </EffectComposer>
  )
}
