"use client"

import { ALL_SPACES, DOOR_H, WALL_T } from "@/lib/layout"
import type { RoomDef } from "@/lib/types"
import { MeshReflectorMaterial } from "@react-three/drei"
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import * as THREE from "three"
import type { Mats } from "./materials"

function Instanced({
  count,
  material,
  set,
  geometry,
}: {
  count: number
  material: THREE.Material
  geometry?: THREE.BufferGeometry
  set: (dummy: THREE.Object3D, i: number) => boolean | void
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => geometry ?? new THREE.BoxGeometry(1, 1, 1), [geometry])
  useLayoutEffect(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D()
    let written = 0
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      const keep = set(dummy, i)
      if (keep === false) continue
      dummy.updateMatrix()
      ref.current.setMatrixAt(written, dummy.matrix)
      written++
    }
    ref.current.count = written
    ref.current.instanceMatrix.needsUpdate = true
    // setter closes over instance data; count is the meaningful dep
  }, [count, set])
  return <instancedMesh ref={ref} args={[geo, material, count]} castShadow receiveShadow frustumCulled={false} />
}

export function Floors({ mats }: { mats: Mats }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[96, 96]} />
        <MeshReflectorMaterial
          color={mats.floorColor}
          metalness={0.72}
          roughness={0.18}
          blur={[180, 40]}
          mixBlur={0.85}
          mixStrength={18}
          resolution={512}
          mirror={0.35}
          depthScale={0.8}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          reflectorOffset={0.04}
        />
      </mesh>
      {ALL_SPACES.map((room) => (
        <mesh key={`sk-${room.id}`} position={[room.x, 0.035, room.z]} material={mats.wallLow} receiveShadow>
          <boxGeometry args={[room.w + 0.4, 0.02, room.d + 0.4]} />
        </mesh>
      ))}
    </>
  )
}

export function Ceilings({ mats }: { mats: Mats }) {
  return (
    <>
      {ALL_SPACES.map((room) => (
        <group key={`c-${room.id}`}>
          <mesh position={[room.x, room.h, room.z]} material={mats.wallLow} receiveShadow>
            <boxGeometry args={[room.w, 0.12, room.d]} />
          </mesh>
          <mesh position={[room.x, room.h - 0.08, room.z]} material={mats.trim}>
            <boxGeometry args={[Math.max(0.6, room.w - 1.6), 0.03, 0.06]} />
          </mesh>
          <mesh position={[room.x, room.h - 0.08, room.z]} material={mats.trim}>
            <boxGeometry args={[0.06, 0.03, Math.max(0.6, room.d - 1.6)]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function WallSegment({
  cx,
  cy,
  cz,
  sx,
  sy,
  sz,
  mats,
  window,
}: {
  cx: number
  cy: number
  cz: number
  sx: number
  sy: number
  sz: number
  mats: Mats
  window?: boolean
}) {
  const lowH = Math.min(1.05, sy)
  return (
    <group>
      <mesh position={[cx, cy, cz]} material={window ? mats.glass : mats.wall} castShadow receiveShadow>
        <boxGeometry args={[sx, sy, sz]} />
      </mesh>
      {!window && (
        <mesh position={[cx, lowH / 2, cz]} material={mats.wallLow}>
          <boxGeometry args={[sx + 0.01, lowH, sz + 0.01]} />
        </mesh>
      )}
    </group>
  )
}

function wallsFor(room: RoomDef, mats: Mats) {
  const t = WALL_T
  const parts: ReactNode[] = []
  const push = (key: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, window = false) => {
    parts.push(
      <WallSegment key={key} cx={x} cy={y} cz={z} sx={sx} sy={sy} sz={sz} mats={mats} window={window} />,
    )
  }
  const split = (along: "x" | "z", wallPos: number, a0: number, a1: number, gapC: number, gap: number, axisFixed: "n" | "s" | "e" | "w") => {
    const isX = along === "x"
    const y = room.h / 2
    const sy = room.h
    if (!gap) {
      if (isX) push(`${room.id}-${axisFixed}`, (a0 + a1) / 2, y, wallPos, a1 - a0, sy, t, room.window === axisFixed)
      else push(`${room.id}-${axisFixed}`, wallPos, y, (a0 + a1) / 2, t, sy, a1 - a0, room.window === axisFixed)
      return
    }
    const gl = gapC - gap / 2
    const gr = gapC + gap / 2
    if (isX) {
      push(`${room.id}-${axisFixed}-l`, (a0 + gl) / 2, y, wallPos, gl - a0, sy, t)
      push(`${room.id}-${axisFixed}-r`, (gr + a1) / 2, y, wallPos, a1 - gr, sy, t)
      push(`${room.id}-${axisFixed}-top`, (gl + gr) / 2, DOOR_H + (room.h - DOOR_H) / 2, wallPos, gap, room.h - DOOR_H, t)
    } else {
      push(`${room.id}-${axisFixed}-l`, wallPos, y, (a0 + gl) / 2, t, sy, gl - a0)
      push(`${room.id}-${axisFixed}-r`, wallPos, y, (gr + a1) / 2, t, sy, a1 - gr)
      push(`${room.id}-${axisFixed}-top`, wallPos, DOOR_H + (room.h - DOOR_H) / 2, (gl + gr) / 2, t, room.h - DOOR_H, gap)
    }
  }
  const x0 = room.x - room.w / 2
  const x1 = room.x + room.w / 2
  const z0 = room.z - room.d / 2
  const z1 = room.z + room.d / 2
  split("x", z1, x0, x1, room.x, room.window === "n" ? 0 : room.openings.n ?? 0, "n")
  split("x", z0, x0, x1, room.x, room.openings.s ?? 0, "s")
  split("z", x1, z0, z1, room.z, room.openings.e ?? 0, "e")
  split("z", x0, z0, z1, room.z, room.openings.w ?? 0, "w")
  return parts
}

export function Walls({ mats }: { mats: Mats }) {
  return <group>{ALL_SPACES.flatMap((room) => wallsFor(room, mats))}</group>
}

export function Ribs({ mats }: { mats: Mats }) {
  const ribs = useMemo(() => {
    const list: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = []
    for (const room of ALL_SPACES) {
      const step = 2.2
      for (let x = room.x - room.w / 2 + 1.1; x < room.x + room.w / 2; x += step) {
        list.push({ x, y: room.h / 2, z: room.z + room.d / 2 - 0.07, sx: 0.08, sy: room.h, sz: 0.12 })
        list.push({ x, y: room.h / 2, z: room.z - room.d / 2 + 0.07, sx: 0.08, sy: room.h, sz: 0.12 })
      }
      for (let z = room.z - room.d / 2 + 1.1; z < room.z + room.d / 2; z += step) {
        list.push({ x: room.x + room.w / 2 - 0.07, y: room.h / 2, z, sx: 0.12, sy: room.h, sz: 0.08 })
        list.push({ x: room.x - room.w / 2 + 0.07, y: room.h / 2, z, sx: 0.12, sy: room.h, sz: 0.08 })
      }
    }
    return list
  }, [])
  return (
    <Instanced
      count={ribs.length}
      material={mats.rib}
      set={(d, i) => {
        const r = ribs[i]
        d.position.set(r.x, r.y, r.z)
        d.scale.set(r.sx, r.sy, r.sz)
      }}
    />
  )
}

export function LightStrips({ mats, emergency }: { mats: Mats; emergency: boolean }) {
  return (
    <>
      {ALL_SPACES.map((room) => {
        const intensity = room.mood === "unknown" ? 0.25 : emergency ? 1.6 : 1
        return (
          <group key={`ls-${room.id}`}>
            <mesh position={[room.x, room.h - 0.16, room.z]} material={mats.trim} scale={[1, intensity, 1]}>
              <boxGeometry args={[Math.min(room.w * 0.62, 8), 0.04, 0.12]} />
            </mesh>
            <pointLight
              position={[room.x, room.h - 0.5, room.z]}
              color={emergency ? "#ff4a4a" : room.mood === "engineering" ? "#66fff0" : room.mood === "command" ? "#a8d7ff" : "#cfe8e4"}
              intensity={room.mood === "unknown" ? 0.6 : emergency ? 4.5 : room.mood === "corridor" ? 3.2 : 5.5}
              distance={room.mood === "corridor" ? 11 : 16}
              decay={2}
              castShadow={room.mood !== "corridor"}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
          </group>
        )
      })}
    </>
  )
}

export function Pipes({ mats }: { mats: Mats }) {
  const pipes = useMemo(() => {
    const list: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = []
    for (const room of ALL_SPACES) {
      if (room.mood === "corridor") {
        list.push({ x: room.x + room.w * 0.28, y: room.h - 0.45, z: room.z, sx: 0.12, sy: 0.12, sz: room.d - 0.4 })
        list.push({ x: room.x - room.w * 0.28, y: room.h - 0.55, z: room.z, sx: 0.09, sy: 0.09, sz: room.d - 0.4 })
      } else {
        list.push({ x: room.x + room.w / 2 - 0.22, y: 2.4, z: room.z, sx: 0.14, sy: 0.14, sz: room.d * 0.7 })
      }
    }
    return list
  }, [])
  return (
    <Instanced
      count={pipes.length}
      material={mats.rib}
      set={(d, i) => {
        const p = pipes[i]
        d.position.set(p.x, p.y, p.z)
        d.scale.set(p.sx, p.sy, p.sz)
      }}
    />
  )
}

export function Columns({ mats }: { mats: Mats }) {
  const cols = useMemo(() => {
    const list: { x: number; y: number; z: number; h: number }[] = []
    for (const room of ALL_SPACES) {
      if (room.mood === "corridor") continue
      const inset = 1.1
      const spots = [
        [room.x + room.w / 2 - inset, room.z + room.d / 2 - inset],
        [room.x - room.w / 2 + inset, room.z + room.d / 2 - inset],
        [room.x + room.w / 2 - inset, room.z - room.d / 2 + inset],
        [room.x - room.w / 2 + inset, room.z - room.d / 2 + inset],
      ]
      for (const [x, z] of spots) list.push({ x, y: room.h / 2, z, h: room.h })
    }
    return list
  }, [])
  return (
    <Instanced
      count={cols.length}
      material={mats.wallLow}
      set={(d, i) => {
        const c = cols[i]
        d.position.set(c.x, c.y, c.z)
        d.scale.set(0.28, c.h, 0.28)
      }}
    />
  )
}
