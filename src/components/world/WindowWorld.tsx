"use client"

import type { ThemePack } from "@/lib/theme"
import { Stars } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

export function WindowWorld({ kind }: { kind: ThemePack["windowKind"] }) {
  if (kind === "earth") return <EarthView />
  if (kind === "rain") return <RainView />
  if (kind === "city") return <CityView />
  if (kind === "stained") return <StainedView />
  if (kind === "slit") return <SlitView />
  if (kind === "void") return <VoidView />
  return (
    <group>
      <Stars radius={160} depth={70} count={5000} factor={3} saturation={0} fade speed={0.25} />
    </group>
  )
}

function EarthView() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.015
  })
  return (
    <group ref={ref} position={[0, -18, 92]}>
      <mesh>
        <sphereGeometry args={[28, 48, 48]} />
        <meshStandardMaterial color="#0b3d7a" emissive="#041a38" emissiveIntensity={0.4} roughness={0.45} fog={false} />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[28, 24, 24]} />
        <meshBasicMaterial color="#7ec8ff" transparent opacity={0.14} fog={false} side={THREE.BackSide} />
      </mesh>
      <Stars radius={180} depth={80} count={5000} factor={3} saturation={0} fade speed={0.2} />
    </group>
  )
}

function RainView() {
  const rain = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const drops = 220
  useFrame((state) => {
    if (!rain.current) return
    for (let i = 0; i < drops; i++) {
      const x = ((i * 17) % 40) - 20
      const z = 70 + ((i * 13) % 20)
      const y = 20 - ((state.clock.elapsedTime * 18 + i * 0.7) % 28)
      dummy.position.set(x, y, z)
      dummy.scale.set(0.03, 0.55, 0.03)
      dummy.updateMatrix()
      rain.current.setMatrixAt(i, dummy.matrix)
    }
    rain.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <mesh position={[0, -8, 80]}>
        <planeGeometry args={[90, 50]} />
        <meshBasicMaterial color="#1a2420" fog={false} />
      </mesh>
      <instancedMesh ref={rain} args={[undefined, undefined, drops]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#9ec0c8" transparent opacity={0.45} fog={false} />
      </instancedMesh>
      <fog attach="fog" args={["#1a1814", 20, 80]} />
    </group>
  )
}

function CityView() {
  const windows = useMemo(() => {
    const list: [number, number, number][] = []
    for (let i = 0; i < 40; i++) {
      list.push([((i * 9) % 50) - 25, ((i * 5) % 22) - 4, 70 + (i % 8)])
    }
    return list
  }, [])
  return (
    <group>
      {windows.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[2.2, 6 + (i % 5), 2.2]} />
          <meshStandardMaterial
            color="#120818"
            emissive={i % 3 === 0 ? "#ff4d8d" : "#6a4dff"}
            emissiveIntensity={0.8}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function StainedView() {
  return (
    <group position={[0, 2, 70]}>
      {["#c45c2a", "#d4a84a", "#4a6ab0", "#6a2a4a"].map((c, i) => (
        <mesh key={c} position={[(i - 1.5) * 6, 4, 0]}>
          <planeGeometry args={[5.4, 12]} />
          <meshBasicMaterial color={c} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

function SlitView() {
  return (
    <mesh position={[0, 2.2, 70]}>
      <planeGeometry args={[80, 6]} />
      <meshBasicMaterial color="#c9b48a" fog={false} />
    </mesh>
  )
}

function VoidView() {
  return (
    <mesh position={[0, 2, 70]}>
      <planeGeometry args={[90, 40]} />
      <meshBasicMaterial color="#d7e6f0" fog={false} />
    </mesh>
  )
}
