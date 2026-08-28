"use client"

import { Sparkles } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import type { Mats } from "./materials"

export function CryoPod({ position, mats }: { position: [number, number, number]; mats: Mats }) {
  return (
    <group position={position}>
      <mesh material={mats.wallLow} castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[2.4, 1.1, 2.2]} />
      </mesh>
      <mesh material={mats.glass} position={[0, 1.15, 0]} rotation={[0.05, 0, 0]}>
        <boxGeometry args={[2.15, 0.12, 1.9]} />
      </mesh>
      <mesh material={mats.trim} position={[0, 0.08, 0]}>
        <boxGeometry args={[2.5, 0.12, 2.3]} />
      </mesh>
      <mesh material={mats.screen} position={[1.28, 0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.08]} />
      </mesh>
      <pointLight position={[0, 1.3, 0]} color="#7fe7ff" intensity={1.4} distance={5} />
    </group>
  )
}

export function Console({
  position,
  rotationY = 0,
  mats,
  wide = false,
}: {
  position: [number, number, number]
  rotationY?: number
  mats: Mats
  wide?: boolean
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={mats.wallLow} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[wide ? 4.2 : 1.8, 1.0, 1.1]} />
      </mesh>
      <mesh material={mats.screen} position={[0, 1.12, 0.12]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[wide ? 3.6 : 1.5, 0.55, 0.08]} />
      </mesh>
      <mesh material={mats.trim} position={[0, 1.0, 0.18]}>
        <boxGeometry args={[wide ? 3.4 : 1.35, 0.02, 0.02]} />
      </mesh>
    </group>
  )
}

export function Crate({ position, mats, scale = 1 }: { position: [number, number, number]; mats: Mats; scale?: number }) {
  return (
    <mesh position={position} material={mats.crate} castShadow receiveShadow scale={scale}>
      <boxGeometry args={[1.6, 1.4, 1.6]} />
    </mesh>
  )
}

export function Holotable({ position, mats, emergency }: { position: [number, number, number]; mats: Mats; emergency: boolean }) {
  const core = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (core.current) core.current.rotation.y += dt * 0.6
  })
  return (
    <group position={position}>
      <mesh material={mats.wallLow} position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.84, 16]} />
      </mesh>
      <mesh ref={core} position={[0, 1.25, 0]} material={mats.trim}>
        <octahedronGeometry args={[0.35, 0]} />
      </mesh>
      <Sparkles count={28} scale={[2.2, 1.4, 2.2]} size={2} speed={0.4} color={emergency ? "#ff5a5a" : "#6ff6e8"} />
      <pointLight position={[0, 1.6, 0]} color={emergency ? "#ff4d4d" : "#66fff0"} intensity={3} distance={8} />
    </group>
  )
}

export function Reactor({
  mats,
  failing,
  position = [0, 0, 0],
}: {
  mats: Mats
  failing: boolean
  position?: [number, number, number]
}) {
  const core = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!core.current) return
    core.current.rotation.y = state.clock.elapsedTime * (failing ? 1.8 : 0.7)
    core.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * (failing ? 0.12 : 0.03)
  })
  const color = failing ? "#ff4a2a" : "#4ef0e0"
  const glow = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: failing ? 3.4 : 2.2,
        metalness: 0.2,
        roughness: 0.2,
      }),
    [color, failing],
  )
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} material={mats.rib}>
        <cylinderGeometry args={[4.6, 4.6, 0.2, 32]} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.dark}>
        <ringGeometry args={[1.8, 4.4, 32]} />
      </mesh>
      <group ref={core} position={[0, 2.4, 0]}>
        <mesh material={glow}>
          <icosahedronGeometry args={[1.15, 1]} />
        </mesh>
        <mesh material={glow} scale={1.6}>
          <icosahedronGeometry args={[1.15, 0]} />
        </mesh>
      </group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 3.4, 3.6, Math.sin((i * Math.PI) / 2) * 3.4]} material={mats.wallLow}>
          <boxGeometry args={[0.35, 7.2, 0.35]} />
        </mesh>
      ))}
      <Sparkles count={failing ? 80 : 40} scale={[6, 5, 6]} size={failing ? 4 : 2.5} speed={failing ? 1.4 : 0.5} color={color} />
      <pointLight position={[0, 2.6, 0]} color={color} intensity={failing ? 18 : 11} distance={22} />
      <pointLight position={[0, 6, 0]} color={color} intensity={6} distance={16} />
    </group>
  )
}

export function MedBed({ position, mats }: { position: [number, number, number]; mats: Mats }) {
  return (
    <group position={position}>
      <mesh material={mats.wall} position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[2.4, 0.18, 1.1]} />
      </mesh>
      <mesh material={mats.wallLow} position={[0, 0.2, 0]}>
        <boxGeometry args={[2.2, 0.4, 0.9]} />
      </mesh>
      <mesh material={mats.trim} position={[1.1, 0.7, 0.4]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
      </mesh>
    </group>
  )
}

export function PickupBeacon({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.4) * 0.08
    ref.current.rotation.y += 0.02
  })
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  )
}

export function Debris({ position, mats }: { position: [number, number, number]; mats: Mats }) {
  return (
    <group position={position}>
      <mesh material={mats.crate} position={[0, 0.4, 0]} rotation={[0.3, 0.4, 0.2]} castShadow>
        <boxGeometry args={[1.8, 0.5, 1.1]} />
      </mesh>
      <mesh material={mats.wallLow} position={[0.7, 0.25, 0.4]} rotation={[0.1, -0.4, 0.6]}>
        <boxGeometry args={[0.9, 0.3, 0.4]} />
      </mesh>
    </group>
  )
}

export function DoorMesh({
  position,
  rotationY,
  open,
  locked,
  mats,
  emergency,
}: {
  position: [number, number, number]
  rotationY: number
  open: boolean
  locked: boolean
  label: string
  mats: Mats
  emergency: boolean
}) {
  const left = useRef<THREE.Mesh>(null)
  const right = useRef<THREE.Mesh>(null)
  const target = open ? 1.1 : 0
  const amt = useRef(open ? 1.1 : 0)
  useFrame((_, dt) => {
    amt.current = THREE.MathUtils.damp(amt.current, target, 6, dt)
    if (left.current) left.current.position.x = -0.8 - amt.current
    if (right.current) right.current.position.x = 0.8 + amt.current
  })
  const frame = emergency || locked ? mats.warn : mats.trim
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.5, 0]} material={mats.rib}>
        <boxGeometry args={[3.6, 3.1, 0.34]} />
      </mesh>
      <mesh ref={left} position={[-0.8, 1.42, 0]} material={mats.wallLow} castShadow>
        <boxGeometry args={[1.5, 2.7, 0.12]} />
      </mesh>
      <mesh ref={right} position={[0.8, 1.42, 0]} material={mats.wallLow} castShadow>
        <boxGeometry args={[1.5, 2.7, 0.12]} />
      </mesh>
      <mesh position={[0, 2.86, 0]} material={frame}>
        <boxGeometry args={[3.5, 0.06, 0.38]} />
      </mesh>
      <mesh position={[0, 3.08, 0.02]} material={mats.screen}>
        <boxGeometry args={[1.6, 0.16, 0.04]} />
      </mesh>
    </group>
  )
}
