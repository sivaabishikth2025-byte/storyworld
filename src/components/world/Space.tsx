"use client"

import { Stars } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

export function DeepSpace() {
  return (
    <group>
      <Stars radius={180} depth={80} count={6000} factor={3.2} saturation={0} fade speed={0.3} />
      <Earth />
      <mesh>
        <sphereGeometry args={[220, 16, 16]} />
        <meshBasicMaterial color="#020308" side={THREE.BackSide} fog={false} />
      </mesh>
    </group>
  )
}

function Earth() {
  const ref = useRef<THREE.Group>(null)
  const { land, sea, atmos } = useMemo(() => {
    const sea = new THREE.MeshStandardMaterial({
      color: "#0b3d7a",
      emissive: "#041a38",
      emissiveIntensity: 0.4,
      roughness: 0.45,
      metalness: 0.1,
      fog: false,
    })
    const land = new THREE.MeshStandardMaterial({
      color: "#2f7a4a",
      roughness: 0.8,
      metalness: 0.05,
      fog: false,
    })
    const atmos = new THREE.MeshBasicMaterial({
      color: "#7ec8ff",
      transparent: true,
      opacity: 0.14,
      fog: false,
      side: THREE.BackSide,
    })
    return { land, sea, atmos }
  }, [])
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.015
  })
  return (
    <group ref={ref} position={[0, -18, 92]}>
      <mesh material={sea}>
        <sphereGeometry args={[28, 48, 48]} />
      </mesh>
      <mesh material={land} scale={1.004}>
        <sphereGeometry args={[28, 32, 32]} />
      </mesh>
      <mesh material={atmos} scale={1.08}>
        <sphereGeometry args={[28, 24, 24]} />
      </mesh>
      <pointLight position={[20, 10, 10]} color="#b7dcff" intensity={4} distance={90} />
    </group>
  )
}
