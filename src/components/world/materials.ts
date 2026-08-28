"use client"

import type { ThemePack } from "@/lib/theme"
import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"

export function useWorldMaterials(theme: ThemePack, emergency: boolean) {
  const [diff, nor, rough] = useTexture([
    "/tex/metal_diff.jpg",
    "/tex/metal_nor.jpg",
    "/tex/metal_rough.jpg",
  ])
  return useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace
    for (const t of [diff, nor, rough]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = 8
      t.repeat.set(3, 3)
    }
    const strip = emergency ? "#ff3b3b" : theme.trim
    const wallColor = emergency ? "#2a1416" : theme.wall
    const lowColor = emergency ? "#1d0e10" : theme.wallLow
    const floorColor = emergency ? "#1a1012" : theme.floor
    const wall = new THREE.MeshStandardMaterial({
      color: wallColor,
      map: diff,
      normalMap: nor,
      roughnessMap: rough,
      metalness: theme.id === "lab" || theme.id === "manor" ? 0.12 : 0.78,
      roughness: theme.id === "lab" ? 0.55 : 0.42,
    })
    const wallLow = new THREE.MeshStandardMaterial({
      color: lowColor,
      map: diff,
      normalMap: nor,
      roughnessMap: rough,
      metalness: 0.82,
      roughness: 0.34,
    })
    wallLow.map = diff.clone()
    wallLow.map.repeat.set(2, 0.7)
    wallLow.map.needsUpdate = true
    const rib = new THREE.MeshStandardMaterial({
      color: "#07090c",
      metalness: 0.92,
      roughness: 0.22,
    })
    const trim = new THREE.MeshStandardMaterial({
      color: strip,
      emissive: strip,
      emissiveIntensity: emergency ? 2.4 : 1.5,
      metalness: 0.4,
      roughness: 0.28,
    })
    const glass = new THREE.MeshStandardMaterial({
      color: theme.id === "temple" ? "#ffb45a" : theme.id === "hotel" ? "#ff7ad2" : "#8fd7ff",
      metalness: 0.08,
      roughness: 0.12,
      transparent: true,
      opacity: 0.42,
      emissive: theme.accent,
      emissiveIntensity: 0.25,
    })
    const crate = new THREE.MeshStandardMaterial({
      color: theme.id === "manor" ? "#5a3a24" : "#3a4450",
      map: diff,
      roughnessMap: rough,
      metalness: 0.4,
      roughness: 0.55,
    })
    const warn = new THREE.MeshStandardMaterial({
      color: "#d9a441",
      emissive: "#d9a441",
      emissiveIntensity: 0.75,
      metalness: 0.3,
      roughness: 0.45,
    })
    const dark = new THREE.MeshStandardMaterial({
      color: "#07080a",
      metalness: 0.8,
      roughness: 0.5,
    })
    const screen = new THREE.MeshStandardMaterial({
      color: "#041016",
      emissive: emergency ? "#3a0808" : theme.accent,
      emissiveIntensity: 1.4,
      metalness: 0.2,
      roughness: 0.25,
    })
    const wood = new THREE.MeshStandardMaterial({
      color: theme.wallLow,
      roughness: 0.7,
      metalness: 0.05,
    })
    return { wall, wallLow, rib, trim, glass, crate, warn, dark, screen, wood, strip, floorColor }
  }, [diff, nor, rough, theme, emergency])
}

export type Mats = ReturnType<typeof useWorldMaterials>
