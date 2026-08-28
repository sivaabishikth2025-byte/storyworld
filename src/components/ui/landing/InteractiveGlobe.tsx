"use client"

import gsap from "gsap"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const VERTEX_SHADER = `
uniform sampler2D u_map_tex;
uniform float u_dot_size;
uniform float u_time_since_click;
uniform vec3 u_pointer;

#define PI 3.14159265359

varying float vOpacity;
varying vec2 vUv;

void main() {
  vUv = uv;
  float visibility = step(.2, texture2D(u_map_tex, uv).r);
  gl_PointSize = visibility * u_dot_size;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vOpacity = (1. / length(mvPosition.xyz) - .7);
  vOpacity = clamp(vOpacity, .03, 1.);
  float t = u_time_since_click - .1;
  t = max(0., t);
  float max_amp = .15;
  float dist = 1. - .5 * length(position - u_pointer);
  float damping = 1. / (1. + 20. * t);
  float delta = max_amp * damping * sin(5. * t * (1. + 2. * dist) - PI);
  delta *= 1. - smoothstep(.8, 1., dist);
  vec3 pos = position;
  pos *= (1. + delta);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
`

const FRAGMENT_SHADER = `
uniform sampler2D u_map_tex;
varying float vOpacity;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(u_map_tex, vUv).rgb;
  color -= .2 * length(gl_PointCoord.xy - vec2(.5));
  float dot = 1. - smoothstep(.38, .4, length(gl_PointCoord.xy - vec2(.5)));
  if (dot < 0.5) discard;
  gl_FragColor = vec4(color, dot * vOpacity);
}
`

const EARTH_MAP = "https://ksenia-k.com/img/earth-map-colored.png"

type Props = {
  className?: string
  label?: string
  title?: string
}

export function InteractiveGlobe({ className = "", label = "FEATURED WORLD", title = "Explore your story" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvas3DRef = useRef<HTMLCanvasElement>(null)
  const canvas2DRef = useRef<HTMLCanvasElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const containerEl = rootRef.current
    const canvas3D = canvas3DRef.current
    const canvas2D = canvas2DRef.current
    const popupEl = popupRef.current
    if (!containerEl || !canvas3D || !canvas2D || !popupEl) return

    const overlayCtx = canvas2D.getContext("2d")
    if (!overlayCtx) return

    const container = containerEl
    const popup = popupEl
    const canvasOverlay = canvas2D
    const overlay = overlayCtx

    let renderer: THREE.WebGLRenderer
    let scene: THREE.Scene
    let camera: THREE.OrthographicCamera
    let rayCaster: THREE.Raycaster
    let controls: OrbitControls
    let clock: THREE.Clock
    let mouse = new THREE.Vector2(-1, -1)
    let pointer: THREE.Mesh
    let globe: THREE.Points
    let globeMesh: THREE.Mesh
    let mapMaterial: THREE.ShaderMaterial
    let popupOpenTl: gsap.core.Timeline
    let popupCloseTl: gsap.core.Timeline
    let popupVisible = false
    let dragged = false
    let pointerPos: THREE.Vector3 | null = null
    const coordinates2D = [0, 0]
    let raf = 0
    let disposed = false

    function formatCoordinate(coordinate: number, positiveDirection: string, negativeDirection: string) {
      const direction = coordinate >= 0 ? positiveDirection : negativeDirection
      return `${Math.abs(coordinate).toFixed(4)}°&nbsp;${direction}`
    }

    function cartesianToLatLong() {
      const pos = pointer.position
      const lat = 90 - (Math.acos(pos.y) * 180) / Math.PI
      const lng = ((270 + Math.atan2(pos.x, pos.z) * 180) / Math.PI) % 360 - 180
      return `${formatCoordinate(lat, "N", "S")},&nbsp;${formatCoordinate(lng, "E", "W")}`
    }

    function drawPopupConnector(startX: number, startY: number, midX: number, midY: number, endX: number, endY: number) {
      overlay.strokeStyle = "#d4b07a"
      overlay.lineWidth = 2
      overlay.lineCap = "round"
      overlay.clearRect(0, 0, container.offsetWidth, container.offsetHeight)
      overlay.beginPath()
      overlay.moveTo(startX, startY)
      overlay.quadraticCurveTo(midX, midY, endX, endY)
      overlay.stroke()
    }

    function showPopupAnimation(lifted: boolean) {
      if (lifted) {
        const positionLifted = pointer.position.clone().multiplyScalar(1.3)
        gsap.from(pointer.position, {
          duration: 0.25,
          x: positionLifted.x,
          y: positionLifted.y,
          z: positionLifted.z,
          ease: "power3.out",
        })
      }
      popupCloseTl.pause(0)
      popupOpenTl.play(0)
    }

    function createPopupTimelines() {
      popupOpenTl = gsap
        .timeline({ paused: true })
        .to(pointer.material, { duration: 0.2, opacity: 1 }, 0)
        .fromTo(canvasOverlay, { opacity: 0 }, { duration: 0.3, opacity: 1 }, 0.15)
        .fromTo(popup, { opacity: 0, scale: 0.9, transformOrigin: "center bottom" }, { duration: 0.1, opacity: 1, scale: 1 }, 0.25)

      popupCloseTl = gsap
        .timeline({ paused: true })
        .to(pointer.material, { duration: 0.3, opacity: 0.2 }, 0)
        .to(canvasOverlay, { duration: 0.3, opacity: 0 }, 0)
        .to(popup, { duration: 0.3, opacity: 0, scale: 0.9, transformOrigin: "center bottom" }, 0)
    }

    function updateOverlayGraphic() {
      const activePointPosition = pointer.position.clone()
      activePointPosition.applyMatrix4(globe.matrixWorld)
      const activePointPositionProjected = activePointPosition.clone()
      activePointPositionProjected.project(camera)
      coordinates2D[0] = (activePointPositionProjected.x + 1) * container.offsetWidth * 0.5
      coordinates2D[1] = (1 - activePointPositionProjected.y) * container.offsetHeight * 0.5

      const matrixWorldInverse = controls.object.matrixWorldInverse
      activePointPosition.applyMatrix4(matrixWorldInverse)

      if (activePointPosition.z > -1) {
        if (!popupVisible) {
          popupVisible = true
          showPopupAnimation(false)
        }

        let popupX = coordinates2D[0]
        popupX -= activePointPositionProjected.x * container.offsetWidth * 0.3

        let popupY = coordinates2D[1]
        const upDown = activePointPositionProjected.y > 0.6
        popupY += upDown ? 20 : -20

        gsap.set(popup, {
          x: popupX,
          y: popupY,
          xPercent: -35,
          yPercent: upDown ? 0 : -100,
        })

        popupY += upDown ? -5 : 5
        const curveMidX = popupX + activePointPositionProjected.x * 100
        const curveMidY = popupY + (upDown ? -0.5 : 0.1) * coordinates2D[1]
        drawPopupConnector(coordinates2D[0], coordinates2D[1], curveMidX, curveMidY, popupX, popupY)
      } else if (popupVisible) {
        popupOpenTl.pause(0)
        popupCloseTl.play(0)
        popupVisible = false
      }
    }

    function checkIntersects() {
      rayCaster.setFromCamera(mouse, camera)
      const intersects = rayCaster.intersectObject(globeMesh)
      document.body.style.cursor = intersects.length ? "pointer" : "auto"
      return intersects
    }

    function updateMousePosition(eX: number, eY: number) {
      const rect = container.getBoundingClientRect()
      mouse.x = ((eX - rect.left) / rect.width) * 2 - 1
      mouse.y = -(((eY - rect.top) / rect.height) * 2 - 1)
    }

    function updateSize() {
      const minSide = Math.min(container.parentElement?.clientWidth || 400, 520)
      const side = Math.max(280, minSide)
      container.style.width = `${side}px`
      container.style.height = `${side}px`
      renderer.setSize(side, side)
      canvasOverlay.width = side
      canvasOverlay.height = side
      if (mapMaterial) mapMaterial.uniforms.u_dot_size.value = 0.04 * side
    }

    function createGlobe(earthTexture: THREE.Texture) {
      const globeGeometry = new THREE.IcosahedronGeometry(1, 22)
      mapMaterial = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          u_map_tex: { value: earthTexture },
          u_dot_size: { value: 0 },
          u_pointer: { value: new THREE.Vector3(0, 0, 1) },
          u_time_since_click: { value: 0 },
        },
        alphaTest: 0,
        transparent: true,
      })

      globe = new THREE.Points(globeGeometry, mapMaterial)
      scene.add(globe)

      globeMesh = new THREE.Mesh(
        globeGeometry,
        new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.05 }),
      )
      scene.add(globeMesh)
    }

    function createPointer() {
      const geometry = new THREE.SphereGeometry(0.04, 16, 16)
      const material = new THREE.MeshBasicMaterial({ color: 0xd4b07a, transparent: true, opacity: 0 })
      pointer = new THREE.Mesh(geometry, material)
      scene.add(pointer)
    }

    function onMove(e: MouseEvent) {
      updateMousePosition(e.clientX, e.clientY)
    }

    function onClick(e: MouseEvent) {
      if (dragged) return
      updateMousePosition(e.clientX, e.clientY)
      const res = checkIntersects()
      if (!res.length) return
      pointerPos = res[0].face!.normal.clone()
      pointer.position.copy(res[0].face!.normal)
      mapMaterial.uniforms.u_pointer.value = res[0].face!.normal
      popup.innerHTML = cartesianToLatLong()
      showPopupAnimation(true)
      clock.start()
    }

    function render() {
      if (disposed) return
      mapMaterial.uniforms.u_time_since_click.value = clock.getElapsedTime()
      checkIntersects()
      if (pointer) updateOverlayGraphic()
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }

    renderer = new THREE.WebGLRenderer({ canvas: canvas3D, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    scene = new THREE.Scene()
    camera = new THREE.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0, 3)
    camera.position.z = 1.1

    rayCaster = new THREE.Raycaster()
    rayCaster.far = 1.15
    clock = new THREE.Clock()

    controls = new OrbitControls(camera, canvas3D)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = true
    controls.minPolarAngle = 0.4 * Math.PI
    controls.maxPolarAngle = 0.4 * Math.PI
    controls.autoRotate = true

    let timestamp = 0
    controls.addEventListener("start", () => {
      timestamp = Date.now()
    })
    controls.addEventListener("end", () => {
      dragged = Date.now() - timestamp > 600
    })

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")
    loader.load(
      EARTH_MAP,
      (earthTexture) => {
        if (disposed) return
        earthTexture.repeat.set(1, 1)
        createGlobe(earthTexture)
        createPointer()
        createPopupTimelines()
        updateSize()
        render()
      },
      undefined,
      () => {
        if (disposed) return
        const fallback = new THREE.DataTexture(new Uint8Array([40, 80, 120, 255]), 1, 1)
        fallback.needsUpdate = true
        createGlobe(fallback)
        createPointer()
        createPopupTimelines()
        updateSize()
        render()
      },
    )

    container.addEventListener("mousemove", onMove)
    container.addEventListener("click", onClick)
    window.addEventListener("resize", updateSize)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      container.removeEventListener("mousemove", onMove)
      container.removeEventListener("click", onClick)
      window.removeEventListener("resize", updateSize)
      controls.dispose()
      renderer.dispose()
      popupOpenTl?.kill()
      popupCloseTl?.kill()
      document.body.style.cursor = "auto"
    }
  }, [])

  return (
    <div className={`globe-hero ${className}`}>
      <div ref={rootRef} className="globe-wrapper">
        <canvas ref={canvas3DRef} id="globe-3d" />
        <canvas ref={canvas2DRef} id="globe-2d-overlay" />
        <div id="globe-popup-overlay">
          <div ref={popupRef} className="globe-popup" />
        </div>
      </div>
      <p className="globe-hint font-mono text-[9px] tracking-[0.28em] text-white/40">CLICK TO DROP A POINTER</p>
      <div className="globe-caption">
        <p className="font-mono text-[10px] tracking-[0.3em] text-gold/80">{label}</p>
        <p className="mt-2 font-serif text-2xl text-white">{title}</p>
      </div>
    </div>
  )
}
