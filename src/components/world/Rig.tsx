"use client"

import { doorAABB, resolvePlayer } from "@/lib/collision"
import { DOORS, EYE_HEIGHT, INTERACTABLES, LANDMARKS, PLAYER_RADIUS, STATIC_COLLIDERS } from "@/lib/layout"
import { storyAudio } from "@/lib/audio"
import { useStoryworld } from "@/store/useStoryworld"
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

export function Rig() {
  const { camera, gl } = useThree()
  const { world } = useRapier()
  const cam = camera as THREE.PerspectiveCamera
  const body = useRef<RapierRigidBody>(null)
  const yaw = useRef(useStoryworld.getState().playerYaw)
  const pitch = useRef(useStoryworld.getState().playerPitch)
  const pos = useRef(new THREE.Vector3(LANDMARKS.spawn[0], 0, LANDMARKS.spawn[2]))
  const vy = useRef(0)
  const bob = useRef(0)
  const stepAcc = useRef(0)
  const enterT = useRef(0)
  const enterFrom = useRef(new THREE.Vector3())
  const enterQuat = useRef(new THREE.Quaternion())
  const flash = useRef<THREE.SpotLight>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null)

  useEffect(() => bindKeys(), [])

  useEffect(() => {
    return useStoryworld.subscribe((state, prev) => {
      if (state.phase === "entering" && prev.phase !== "entering") {
        pos.current.set(state.playerX, state.playerY || 0, state.playerZ)
        yaw.current = state.playerYaw
        pitch.current = state.playerPitch
        body.current?.setNextKinematicTranslation({
          x: state.playerX,
          y: Math.max(0.05, state.playerY || 0),
          z: state.playerZ,
        })
      }
    })
  }, [])

  useEffect(() => {
    const ctrl = world.createCharacterController(0.08)
    ctrl.setApplyImpulsesToDynamicBodies(true)
    ctrl.enableAutostep(0.4, 0.28, true)
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
      const phase = useStoryworld.getState().phase
      if (phase !== "play" || document.pointerLockElement !== el) return
      yaw.current -= e.movementX * 0.0022
      pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.0022, -1.2, 1.2)
    }
    const onClick = () => {
      const phase = useStoryworld.getState().phase
      if (phase === "play") el.requestPointerLock()
    }
    el.addEventListener("mousemove", onMove)
    el.addEventListener("click", onClick)
    return () => {
      el.removeEventListener("mousemove", onMove)
      el.removeEventListener("click", onClick)
    }
  }, [gl])

  useFrame((state, dt) => {
    const store = useStoryworld.getState()
    const phase = store.phase
    const clamped = Math.min(dt, 0.05)

    if (phase === "landing" || phase === "generating" || phase === "video-wait") {
      const t = state.clock.elapsedTime
      const pushing = phase === "generating" || phase === "video-wait"
      const radius = pushing ? 7.2 : 11.2
      const ang = t * (pushing ? 0.09 : 0.13)
      cam.position.set(Math.cos(ang) * radius, pushing ? 3.6 : 5.4, Math.sin(ang) * radius * 0.62)
      cam.lookAt(0, 2.1, 0)
      cam.fov = pushing ? 42 : 52
      cam.updateProjectionMatrix()
      return
    }

    if (phase === "video") {
      return
    }

    dummy.rotation.set(pitch.current, yaw.current, 0, "YXZ")
    cam.quaternion.copy(dummy.quaternion)
    cam.getWorldDirection(forward)
    forward.y = 0
    if (forward.lengthSq() > 0.0001) forward.normalize()
    right.crossVectors(forward, cam.up).normalize()

    if (phase === "cinema-hold" || phase === "entering") {
      if (phase === "entering") {
        if (enterT.current === 0) {
          enterFrom.current.copy(cam.position)
          enterQuat.current.copy(cam.quaternion)
        }
        enterT.current += clamped
        const t = Math.min(1, enterT.current / 1.05)
        const ease = t * t * (3 - 2 * t)
        const eye = tmp.set(pos.current.x, EYE_HEIGHT, pos.current.z)
        cam.position.lerpVectors(enterFrom.current, eye, ease)
        dummy.rotation.set(pitch.current, yaw.current, 0, "YXZ")
        cam.quaternion.slerpQuaternions(enterQuat.current, dummy.quaternion, ease)
        cam.fov = THREE.MathUtils.damp(cam.fov, 68, 4, clamped)
        cam.updateProjectionMatrix()
        if (t >= 1) {
          enterT.current = 0
          snapBody()
          store.finishEnter()
        }
        return
      }
      cam.position.set(pos.current.x, EYE_HEIGHT + 0.4, pos.current.z)
      cam.lookAt(pos.current.x + forward.x * 4, EYE_HEIGHT, pos.current.z + forward.z * 4)
      cam.fov = THREE.MathUtils.damp(cam.fov, 58, 3, clamped)
      cam.updateProjectionMatrix()
      return
    }

    if (phase !== "play" && phase !== "paused" && phase !== "terminal") return

    if (phase === "play") {
      const sprint = keys.shift
      const speed = sprint ? 6.6 : 3.7
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
      } else {
        mx = 0
        mz = 0
      }

      const rb = body.current
      const ctrl = controller.current
      if (rb && ctrl && rb.numColliders() > 0) {
        const collider = rb.collider(0)
        vy.current -= 22 * clamped
        ctrl.computeColliderMovement(collider, { x: mx, y: vy.current * clamped, z: mz })
        const delta = ctrl.computedMovement()
        const t = rb.translation()
        const next = { x: t.x + delta.x, y: t.y + delta.y, z: t.z + delta.z }
        if (ctrl.computedGrounded()) vy.current = 0
        if (next.y < -2.5) {
          next.x = LANDMARKS.spawn[0]
          next.y = 0.2
          next.z = LANDMARKS.spawn[2]
          vy.current = 0
        }
        rb.setNextKinematicTranslation(next)
        pos.current.set(next.x, next.y, next.z)
      } else {
        pos.current.x += mx
        pos.current.z += mz
        const closed = new Set(DOORS.filter((d) => !store.openDoors.includes(d.id)).map((d) => d.id))
        const boxes = STATIC_COLLIDERS.concat(
          DOORS.map((d) => doorAABB(d.id, d.position[0], d.position[2], d.rotationY, d.width, d.height)),
        )
        const resolved = resolvePlayer(pos.current.x, pos.current.z, PLAYER_RADIUS, boxes, closed)
        pos.current.x = resolved.x
        pos.current.z = resolved.z
      }

      if (moving) {
        bob.current += clamped * (sprint ? 14 : 9)
        stepAcc.current += clamped
        if (stepAcc.current > (sprint ? 0.32 : 0.46)) {
          stepAcc.current = 0
          storyAudio.footstep(sprint)
        }
      } else {
        bob.current *= 0.9
      }
      store.setPlayerPose(pos.current.x, pos.current.z, yaw.current, pitch.current, pos.current.y)
      updateNearby(pos.current.x, pos.current.z, forward)
    }

    const head = Math.sin(bob.current) * 0.045
    cam.position.set(pos.current.x, pos.current.y + EYE_HEIGHT + head, pos.current.z)
    cam.fov = THREE.MathUtils.damp(cam.fov, 68, 6, clamped)
    cam.updateProjectionMatrix()

    if (flash.current) {
      flash.current.visible = store.flashlight && phase === "play"
      flash.current.position.copy(cam.position)
      cam.getWorldDirection(tmp)
      tmp.multiplyScalar(8).add(cam.position)
      flash.current.target.position.copy(tmp)
      flash.current.target.updateMatrixWorld()
    }
  })

  function snapBody() {
    const rb = body.current
    if (!rb) return
    rb.setNextKinematicTranslation({ x: pos.current.x, y: Math.max(0.05, pos.current.y), z: pos.current.z })
  }

  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[LANDMARKS.spawn[0], 0.05, LANDMARKS.spawn[2]]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.5, 0.32]} position={[0, 0.82, 0]} />
      </RigidBody>
      <spotLight
        ref={flash}
        color="#fff2d2"
        intensity={8}
        distance={18}
        angle={0.42}
        penumbra={0.45}
        decay={2}
      >
        <object3D attach="target" />
      </spotLight>
    </>
  )
}

function updateNearby(x: number, z: number, forward: THREE.Vector3) {
  const store = useStoryworld.getState()
  let bestDist = 2.45
  let best = null as ReturnType<typeof useStoryworld.getState>["nearby"]
  const consider = (id: string, kind: NonNullable<typeof best>["kind"], label: string, prompt: string, px: number, pz: number) => {
    const dx = px - x
    const dz = pz - z
    const dist = Math.hypot(dx, dz)
    if (dist > bestDist) return
    if (dist > 0.2) {
      const dot = (dx / dist) * forward.x + (dz / dist) * forward.z
      if (dot < 0.12 && dist > 1.2) return
    }
    bestDist = dist
    best = { id, kind, label, prompt, distance: dist }
  }
  for (const item of INTERACTABLES) {
    if (store.taken.includes(item.id)) continue
    consider(item.id, item.kind, item.label, item.prompt || "Inspect", item.position[0], item.position[2])
  }
  for (const door of DOORS) {
    if (store.openDoors.includes(door.id)) continue
    const locked = door.locked && !store.openDoors.includes(door.id)
    const hasKey = door.key ? store.inventory.some((i) => i.id === `pickup-${door.key}`) : true
    const prompt = locked && !hasKey ? `Locked — needs ${door.key}` : `Open ${door.label}`
    consider(door.id, "door", door.label, prompt, door.position[0], door.position[2])
  }
  const current = store.nearby
  if ((current?.id || null) !== (best?.id || null)) store.setNearby(best)
}
