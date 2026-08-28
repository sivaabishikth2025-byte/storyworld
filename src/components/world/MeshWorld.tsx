"use client"

import { DOORS, INTERACTABLES, LANDMARKS } from "@/lib/layout"
import { buildThemePack } from "@/lib/theme"
import { useStoryworld } from "@/store/useStoryworld"
import { useGLTF } from "@react-three/drei"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useLayoutEffect, useMemo } from "react"
import * as THREE from "three"
import { Console, Crate, CryoPod, Debris, DoorMesh, PickupBeacon, Reactor } from "./props"
import { Presence } from "./Presence"
import { useWorldMaterials } from "./materials"

export const SPONZA_URL = "/worlds/sponza/Sponza.gltf"

useGLTF.preload(SPONZA_URL)

export function SponzaMesh() {
  const gltf = useGLTF(SPONZA_URL)
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const physical = mat as THREE.MeshPhysicalMaterial
        if (physical.transmission && physical.transmission > 0) {
          physical.transmission = 0
          physical.transparent = true
          physical.opacity = Math.min(physical.opacity, 0.85)
        }
        physical.needsUpdate = true
      }
    })
    return cloned
  }, [gltf.scene])

  useLayoutEffect(() => {
    return () => {
      scene.traverse((obj) => {
        const mesh = obj as { geometry?: { dispose?: () => void } }
        mesh.geometry?.dispose?.()
      })
    }
  }, [scene])

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1}>
      <primitive object={scene} />
    </RigidBody>
  )
}

export function StoryDressing() {
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
      <fog attach="fog" args={[emergency ? "#1a0505" : pack.fog, 8, 38]} />
      <pointLight position={[0, 8, 0]} color={emergency ? "#ff3b3b" : "#ffe6b8"} intensity={4.5} distance={22} />
      <pointLight position={LANDMARKS.spawn} color={pack.accent} intensity={2.4} distance={8} />
      <pointLight position={LANDMARKS.command} color={pack.accent} intensity={2.2} distance={8} />
      <pointLight position={LANDMARKS.reactor} color={failing ? "#ff4a2a" : pack.accent} intensity={failing ? 6 : 3.2} distance={9} />

      <CryoPod position={[11.85, 0, 0.55]} mats={mats} />
      <Console position={[12.4, 0, -1.4]} rotationY={Math.PI} mats={mats} />
      <Console position={[10.6, 0, 3.3]} rotationY={Math.PI} mats={mats} />
      <Console position={[1.6, 0, -2.2]} mats={mats} />
      <Console position={[-12.2, 0, 0.2]} mats={mats} wide />
      <group scale={0.32}>
        <Reactor mats={mats} failing={failing} position={[1.2, 0, -20.6]} />
      </group>
      <Console position={[3.6, 0, -6.8]} rotationY={-Math.PI / 2} mats={mats} />
      <Crate position={[4.8, 0.7, 6.6]} mats={mats} />
      <Crate position={[-2.2, 0.7, 6.5]} mats={mats} scale={0.85} />
      <Console position={[-5.2, 0, 6.6]} rotationY={Math.PI / 2} mats={mats} />
      <Debris position={[-12.2, 0, 6.2]} mats={mats} />
      <Console position={[-12.4, 0, 6.5]} rotationY={Math.PI / 2} mats={mats} />

      {DOORS.map((door) => (
        <group key={door.id}>
          {!openDoors.includes(door.id) && (
            <RigidBody
              type="fixed"
              colliders={false}
              position={[door.position[0], door.height / 2, door.position[2]]}
              rotation={[0, door.rotationY, 0]}
            >
              <CuboidCollider args={[door.width / 2, door.height / 2, 0.16]} />
            </RigidBody>
          )}
          <DoorMesh
            position={door.position}
            rotationY={door.rotationY}
            open={openDoors.includes(door.id)}
            locked={door.locked && !openDoors.includes(door.id)}
            label={pack.doors[door.id] || door.label}
            mats={mats}
            emergency={emergency}
          />
        </group>
      ))}

      {INTERACTABLES.filter((item) => item.kind === "pickup" && !taken.includes(item.id)).map((item) => (
        <PickupBeacon
          key={item.id}
          position={[item.position[0], item.position[1] + 0.2, item.position[2]]}
          color={pack.accent}
        />
      ))}
      <Presence />
    </group>
  )
}
