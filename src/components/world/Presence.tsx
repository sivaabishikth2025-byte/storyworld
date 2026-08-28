"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"
import { useStoryworld } from "@/store/useStoryworld"
import { storyAudio } from "@/lib/audio"

export function Presence() {
  const ref = useRef<THREE.Group>(null)
  const seen = useRef(0)
  const waypoint = useRef(0)
  const points: [number, number, number][] = [
    [-11, 0, 5.6],
    [-8, 0, 4.2],
    [0, 0, 3.4],
    [5, 0, -2.2],
    [9, 0, 1.2],
    [0, 0, 0],
  ]
  useFrame((state, dt) => {
    const { worldState, phase, playerX, playerZ } = useStoryworld.getState()
    const active = String(worldState.presence) === "moving" || String(worldState.presence) === "confirmed" || String(worldState.presence) === "contact"
    if (!ref.current) return
    ref.current.visible = phase === "play" || phase === "cinema" || phase === "cinema-hold" || phase === "entering"
    if (!active && String(worldState.presence) === "unconfirmed") {
      ref.current.position.set(-11, 0.1, 5.8)
      return
    }
    const cam = state.camera
    const pos = ref.current.position
    const toCam = new THREE.Vector3(cam.position.x - pos.x, 0, cam.position.z - pos.z)
    const forward = new THREE.Vector3()
    cam.getWorldDirection(forward)
    forward.y = 0
    const looking = forward.normalize().dot(toCam.normalize()) > 0.55 && cam.position.distanceTo(pos) < 18
    if (looking) {
      seen.current += dt
      if (seen.current > 0.35) {
        waypoint.current = (waypoint.current + 1) % (String(worldState.protocol) === "ACTIVE" ? points.length : 4)
        const p = points[waypoint.current]
        pos.set(p[0], 0.1, p[2])
        seen.current = 0
        if (Math.random() > 0.5) storyAudio.scrape()
      }
    } else {
      const p = points[waypoint.current]
      pos.x = THREE.MathUtils.damp(pos.x, p[0], 1.2, dt)
      pos.z = THREE.MathUtils.damp(pos.z, p[2], 1.2, dt)
      const dist = Math.hypot(playerX - pos.x, playerZ - pos.z)
      if (dist < 2.4 && String(worldState.presence) !== "contact") {
        waypoint.current = (waypoint.current + 2) % 4
        storyAudio.scrape()
      }
    }
    ref.current.lookAt(cam.position.x, 1.4, cam.position.z)
    const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 7) * 0.3
    const eye = ref.current.children[2] as THREE.Mesh
    if (eye?.material && "emissiveIntensity" in eye.material) {
      ;(eye.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 3
    }
  })
  return (
    <group ref={ref} position={[-11, 0.1, 5.8]}>
      <mesh position={[0, 1.35, 0]}>
        <capsuleGeometry args={[0.22, 1.35, 4, 8]} />
        <meshStandardMaterial color="#050608" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#050608" />
      </mesh>
      <mesh position={[0, 2.22, 0.16]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 2.2, 0.3]} color="#ff1a1a" intensity={1.6} distance={4} />
    </group>
  )
}
