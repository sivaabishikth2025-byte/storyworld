"use client"

import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import * as THREE from "three"

type Props = {
  url: string
  scale: number
  ground: number
  rotation: [number, number, number, number]
}

export function MarbleCollider({ url, scale, ground, rotation }: Props) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.visible = false
        if (mesh.geometry) mesh.geometry = mesh.geometry.clone()
      }
    })
    return clone
  }, [gltf.scene])

  return (
    <RigidBody type="fixed" colliders="trimesh" scale={scale} position={[0, -ground, 0]} quaternion={rotation}>
      <primitive object={scene} />
    </RigidBody>
  )
}
