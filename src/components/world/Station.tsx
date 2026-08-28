"use client"

import { DOORS, INTERACTABLES, LANDMARKS } from "@/lib/layout"
import { buildThemePack } from "@/lib/theme"
import { useStoryworld } from "@/store/useStoryworld"
import { Ceilings, Columns, Floors, LightStrips, Pipes, Ribs, Walls } from "./architecture"
import { useWorldMaterials } from "./materials"
import { Console, Crate, CryoPod, Debris, DoorMesh, Holotable, MedBed, PickupBeacon, Reactor } from "./props"
import { Presence } from "./Presence"
import { WindowWorld } from "./WindowWorld"
import { Environment } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { PointLight } from "three"

function Flicker({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<PointLight>(null)
  useFrame((state) => {
    if (!ref.current) return
    const pulse = 0.35 + Math.abs(Math.sin(state.clock.elapsedTime * 11)) * 1.4
    const drop = Math.sin(state.clock.elapsedTime * 1.7) > 0.82 ? 0.08 : 1
    ref.current.intensity = pulse * drop
  })
  return <pointLight ref={ref} position={position} color={color} distance={7} />
}

export function InteriorStation() {
  const emergency = useStoryworld((s) => String(s.worldState.protocol).toUpperCase() === "ACTIVE")
  const reactor = Number(useStoryworld((s) => s.worldState.reactor) || 41)
  const openDoors = useStoryworld((s) => s.openDoors)
  const taken = useStoryworld((s) => s.taken)
  const prompt = useStoryworld((s) => s.prompt)
  const story = useStoryworld((s) => s.story)
  const pack = buildThemePack(prompt, story?.theme)
  const mats = useWorldMaterials(pack, emergency)
  const failing = reactor < 35

  return (
    <group>
      <WindowWorld kind={pack.windowKind} />
      <Environment files={pack.hdr} environmentIntensity={pack.hdrIntensity} />
      <fog attach="fog" args={[emergency ? "#1a0505" : pack.fog, 6, 42]} />
      <ambientLight intensity={emergency ? 0.04 : 0.08} />
      <directionalLight position={[6, 14, 8]} intensity={1.1} color="#f2e6d0" castShadow shadow-mapSize={[2048, 2048]} />
      <Floors mats={mats} />
      <Ceilings mats={mats} />
      <Walls mats={mats} />
      <Ribs mats={mats} />
      <Pipes mats={mats} />
      <Columns mats={mats} />
      <LightStrips mats={mats} emergency={emergency} />

      <pointLight position={[29, 3.2, 0]} color={emergency ? "#ff4a4a" : pack.accent} intensity={3.2} distance={12} />
      <Flicker position={[32.5, 3.1, 4]} color={pack.accent} />
      <CryoPod position={[34.4, 0, 4.3]} mats={mats} />
      <CryoPod position={[34.4, 0, -3.4]} mats={mats} />
      <MedBed position={[24.4, 0, -6.4]} mats={mats} />
      <Console position={[25.5, 0, 6.8]} rotationY={Math.PI} mats={mats} />
      <Console position={[33.2, 0, 1.55]} rotationY={Math.PI} mats={mats} />

      <Holotable position={[0, 0, 0]} mats={mats} emergency={emergency} />
      <Console position={[0, 0, -3.4]} mats={mats} />
      <mesh position={[5.6, 1.1, 5.6]} material={mats.wallLow} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.2, 8]} />
      </mesh>
      <mesh position={[-5.6, 1.1, 5.6]} material={mats.wallLow} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.2, 8]} />
      </mesh>
      <mesh position={[5.6, 1.1, -5.6]} material={mats.wallLow} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.2, 8]} />
      </mesh>
      <mesh position={[-5.6, 1.1, -5.6]} material={mats.wallLow} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.2, 8]} />
      </mesh>

      <Console position={[0, 0, 32.6]} mats={mats} wide />
      <mesh position={[-2.4, 0.55, 30.2]} material={mats.wallLow} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.7]} />
      </mesh>
      <mesh position={[2.4, 0.55, 30.2]} material={mats.wallLow} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.7]} />
      </mesh>
      <mesh position={[-8.2, 2.6, 36.72]} material={mats.rib}>
        <boxGeometry args={[0.25, 4.8, 0.28]} />
      </mesh>
      <mesh position={[8.2, 2.6, 36.72]} material={mats.rib}>
        <boxGeometry args={[0.25, 4.8, 0.28]} />
      </mesh>
      <mesh position={[0, 5.05, 36.72]} material={mats.rib}>
        <boxGeometry args={[16.6, 0.3, 0.3]} />
      </mesh>
      <mesh position={[0, 0.4, 36.72]} material={mats.rib}>
        <boxGeometry args={[16.6, 0.8, 0.3]} />
      </mesh>
      <directionalLight position={[4, 12, 48]} intensity={1.6} color="#9ecbff" />

      <Reactor mats={mats} failing={failing} />
      <Console position={[6.4, 0, -36.4]} rotationY={-Math.PI / 2} mats={mats} />

      <Crate position={[-36.2, 0.7, 5.2]} mats={mats} />
      <Crate position={[-36.6, 0.7, -5.8]} mats={mats} scale={1.15} />
      <Crate position={[-23.2, 0.7, -6.2]} mats={mats} />
      <Crate position={[-24.8, 0.7, 4.8]} mats={mats} scale={0.85} />
      <Crate position={[-33.1, 0.7, 6.8]} mats={mats} scale={0.7} />
      <Console position={[-36.8, 0, -4.2]} rotationY={Math.PI / 2} mats={mats} />

      <Debris position={[-34.8, 0, 19.6]} mats={mats} />
      <Console position={[-24.2, 0, 28.6]} rotationY={Math.PI / 2} mats={mats} />
      <pointLight position={[-30, 2.2, 24]} color="#ff2a2a" intensity={1.8} distance={10} />

      {DOORS.map((door) => (
        <DoorMesh
          key={door.id}
          position={door.position}
          rotationY={door.rotationY}
          open={openDoors.includes(door.id)}
          locked={door.locked && !openDoors.includes(door.id)}
          label={pack.doors[door.id] || door.label}
          mats={mats}
          emergency={emergency}
        />
      ))}

      {INTERACTABLES.filter((i) => i.kind === "pickup" && !taken.includes(i.id)).map((item) => (
        <PickupBeacon key={item.id} position={[item.position[0], item.position[1] + 0.2, item.position[2]]} color={pack.accent} />
      ))}

      <Presence />
      <mesh position={LANDMARKS.commandWindow} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    </group>
  )
}
