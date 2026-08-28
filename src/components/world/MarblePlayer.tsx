"use client"

import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

const keys = { w: false, a: false, s: false, d: false, shift: false }

function bindKeys() {
  const down = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === "w") keys.w = true
    if (k === "a") keys.a = true
    if (k === "s") keys.s = true
    if (k === "d") keys.d = true
    if (e.key === "Shift") keys.shift = true
  }
  const up = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === "w") keys.w = false
    if (k === "a") keys.a = false
    if (k === "s") keys.s = false
    if (k === "d") keys.d = false
    if (e.key === "Shift") keys.shift = false
  }
  window.addEventListener("keydown", down)
  window.addEventListener("keyup", up)
  return () => {
    window.removeEventListener("keydown", down)
    window.removeEventListener("keyup", up)
  }
}

export function MarblePlayer({ eye = 1.55 }: { eye?: number }) {
  const { camera, gl } = useThree()
  const { world } = useRapier()
  const body = useRef<RapierRigidBody>(null)
  const yaw = useRef(0)
  const pitch = useRef(0)
  const vy = useRef(0)
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null)

  useEffect(() => bindKeys(), [])

  useEffect(() => {
    const ctrl = world.createCharacterController(0.08)
    ctrl.setApplyImpulsesToDynamicBodies(true)
    ctrl.enableAutostep(0.35, 0.25, true)
    ctrl.enableSnapToGround(0.45)
    controller.current = ctrl
    return () => {
      world.removeCharacterController(ctrl)
      controller.current = null
    }
  }, [world])

  useEffect(() => {
    const el = gl.domElement
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return
      yaw.current -= e.movementX * 0.0022
      pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.0022, -1.2, 1.2)
    }
    const onClick = () => {
      if (document.pointerLockElement !== el) el.requestPointerLock()
    }
    el.addEventListener("mousemove", onMove)
    el.addEventListener("click", onClick)
    return () => {
      el.removeEventListener("mousemove", onMove)
      el.removeEventListener("click", onClick)
      if (document.pointerLockElement === el) document.exitPointerLock()
    }
  }, [gl])

  useFrame((_, dt) => {
    const clamped = Math.min(dt, 0.05)
    const cam = camera as THREE.PerspectiveCamera
    dummy.rotation.set(pitch.current, yaw.current, 0, "YXZ")
    cam.quaternion.copy(dummy.quaternion)
    cam.getWorldDirection(forward)
    forward.y = 0
    if (forward.lengthSq() > 0.0001) forward.normalize()
    right.crossVectors(forward, cam.up).normalize()

    const sprint = keys.shift
    const speed = sprint ? 5.2 : 2.8
    let mx = 0
    let mz = 0
    if (keys.w) {
      mx += forward.x
      mz += forward.z
    }
    if (keys.s) {
      mx -= forward.x
      mz -= forward.z
    }
    if (keys.d) {
      mx += right.x
      mz += right.z
    }
    if (keys.a) {
      mx -= right.x
      mz -= right.z
    }
    const moving = Math.hypot(mx, mz) > 0
    if (moving) {
      const inv = 1 / Math.hypot(mx, mz)
      mx *= inv * speed * clamped
      mz *= inv * speed * clamped
    }

    const rb = body.current
    const ctrl = controller.current
    if (rb && ctrl && rb.numColliders() > 0) {
      const collider = rb.collider(0)
      vy.current -= 18 * clamped
      ctrl.computeColliderMovement(collider, { x: mx, y: vy.current * clamped, z: mz })
      const delta = ctrl.computedMovement()
      const t = rb.translation()
      const next = { x: t.x + delta.x, y: t.y + delta.y, z: t.z + delta.z }
      if (ctrl.computedGrounded()) vy.current = 0
      rb.setNextKinematicTranslation(next)
      cam.position.set(next.x, next.y + eye, next.z)
    }
    cam.fov = THREE.MathUtils.damp(cam.fov, 68, 6, clamped)
    cam.updateProjectionMatrix()
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, eye, 0.2]}
    >
      <CapsuleCollider args={[0.42, 0.28]} position={[0, 0.42, 0]} />
    </RigidBody>
  )
}
