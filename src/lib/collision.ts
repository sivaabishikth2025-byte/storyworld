import type { AABB } from "./types"

export function resolvePlayer(
  x: number,
  z: number,
  radius: number,
  colliders: AABB[],
  doorClosed: Set<string>,
  iterations = 4,
) {
  let px = x
  let pz = z
  for (let n = 0; n < iterations; n++) {
    for (const box of colliders) {
      if (box.kind === "door" && !doorClosed.has(box.id.replace("-body", ""))) continue
      const minX = box.min[0] - radius
      const maxX = box.max[0] + radius
      const minZ = box.min[2] - radius
      const maxZ = box.max[2] + radius
      if (px < minX || px > maxX || pz < minZ || pz > maxZ) continue
      const overlapX = Math.min(px - minX, maxX - px)
      const overlapZ = Math.min(pz - minZ, maxZ - pz)
      if (overlapX < overlapZ) {
        px += px - minX < maxX - px ? -overlapX : overlapX
      } else {
        pz += pz - minZ < maxZ - pz ? -overlapZ : overlapZ
      }
    }
  }
  return { x: px, z: pz }
}

export function doorAABB(id: string, x: number, z: number, rotationY: number, width: number, height: number): AABB {
  const alongX = Math.abs(Math.cos(rotationY)) > 0.7
  const t = 0.18
  if (alongX) {
    return {
      id: `${id}-body`,
      kind: "door",
      min: [x - width / 2, 0, z - t],
      max: [x + width / 2, height, z + t],
    }
  }
  return {
    id: `${id}-body`,
    kind: "door",
    min: [x - t, 0, z - width / 2],
    max: [x + t, height, z + width / 2],
  }
}
