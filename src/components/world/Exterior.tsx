"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import type { WorldTheme } from "@/lib/theme"
import { DeepSpace } from "./Space"

export function ExteriorStation({ pushing, theme = "station" }: { pushing: boolean; theme?: WorldTheme }) {
  const group = useRef<THREE.Group>(null)
  const hull = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8b95a3",
        metalness: 0.92,
        roughness: 0.28,
      }),
    [],
  )
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a313c",
        metalness: 0.85,
        roughness: 0.35,
      }),
    [],
  )
  const glow = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6ff6e8",
        emissive: "#6ff6e8",
        emissiveIntensity: 2.2,
      }),
    [],
  )
  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d4b07a",
        emissive: "#d4b07a",
        emissiveIntensity: 0.35,
        metalness: 0.7,
        roughness: 0.3,
      }),
    [],
  )
  useFrame((state, dt) => {
    if (!group.current) return
    group.current.rotation.y += dt * (pushing ? 0.04 : 0.08)
    group.current.rotation.x = 0.18 + Math.sin(state.clock.elapsedTime * 0.15) * 0.03
  })
  return (
    <>
      <DeepSpace />
      <ambientLight intensity={0.08} />
      <directionalLight position={[40, 30, 20]} intensity={3.2} color="#fff4e5" />
      <directionalLight position={[-20, -10, -30]} intensity={0.6} color="#4d7dff" />
      <group ref={group}>
        {theme === "manor" || theme === "hotel" ? (
          <>
            <mesh material={dark} position={[0, 1.4, 0]}>
              <boxGeometry args={[8.5, 5.2, 6.2]} />
            </mesh>
            <mesh material={hull} position={[0, 4.6, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[6.2, 2.4, 4]} />
            </mesh>
            <mesh material={glow} position={[2.2, 2.2, 3.2]}>
              <boxGeometry args={[1.1, 1.6, 0.08]} />
            </mesh>
          </>
        ) : theme === "temple" ? (
          <>
            <mesh material={hull} position={[0, 0.2, 0]}>
              <cylinderGeometry args={[6, 6, 0.4, 8]} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <mesh key={i} material={dark} position={[Math.cos((i / 6) * Math.PI * 2) * 4.2, 2.4, Math.sin((i / 6) * Math.PI * 2) * 4.2]}>
                <cylinderGeometry args={[0.28, 0.32, 4.8, 8]} />
              </mesh>
            ))}
            <mesh material={gold} position={[0, 5.2, 0]}>
              <sphereGeometry args={[1.1, 16, 16]} />
            </mesh>
          </>
        ) : theme === "ship" ? (
          <>
            <mesh material={hull} rotation={[0, 0, 0.08]}>
              <capsuleGeometry args={[1.6, 9.5, 8, 16]} />
            </mesh>
            <mesh material={dark} position={[0, 1.4, -1]}>
              <boxGeometry args={[2.2, 1.2, 3]} />
            </mesh>
            <mesh material={glow} position={[0, 0.2, 5.4]}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
            </mesh>
          </>
        ) : (
          <>
            <mesh material={hull} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[7.4, 0.55, 18, 80]} />
            </mesh>
            <mesh material={dark}>
              <cylinderGeometry args={[1.35, 1.35, 9.5, 20]} />
            </mesh>
            <mesh material={gold} position={[0, 5.1, 0]}>
              <cylinderGeometry args={[0.25, 0.55, 1.4, 8]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} material={dark} position={[s * 8.8, 0, 0]} rotation={[0, 0, s * 0.15]}>
                <boxGeometry args={[6.4, 0.08, 2.1]} />
              </mesh>
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2
              return (
                <group key={i} position={[Math.cos(a) * 7.4, 0, Math.sin(a) * 7.4]} rotation={[0, -a, 0]}>
                  <mesh material={hull}>
                    <boxGeometry args={[2.2, 1.4, 2.6]} />
                  </mesh>
                  <mesh material={glow} position={[0.9, 0.1, 0]}>
                    <boxGeometry args={[0.08, 0.7, 1.6]} />
                  </mesh>
                </group>
              )
            })}
          </>
        )}
        <pointLight position={[0, 0, 0]} color={theme === "hotel" ? "#ff4d8d" : "#79fff0"} intensity={8} distance={18} />
      </group>
    </>
  )
}
