import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { addAfterEffect, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { materials } from './materials'
import { daylightAt, type RoomLighting } from './sun'
import { InteriorLightContext } from './interiorLight'
import { SHADOW_ONLY_LAYER } from './Cutaway'
import { useRoomInfo } from './roomContext'
import { useQuality } from './quality'
import { shadowSignature } from './shadowUpdates'

/** The ceiling lights' glow colour at full brightness (see materials.coveLight). */
const COVE_BASE = new THREE.Color('#fff1dc')
const SKY_COLOR = new THREE.Color()

/** How far from the room the sun light sits. Only its direction matters; this just keeps it outside. */
const SUN_DISTANCE = 14

/**
 * Lighting for one moment of the day (sun.ts works out the numbers):
 * - Sun: from the real sun direction for this time and room orientation, so it only
 *   shines in through a window when the sun is on that side. Warm and dim when low.
 * - "Ceiling" fill: a directional light standing in for daylight bouncing around the
 *   room; it fades to a faint blue at night.
 * - Hemisphere light: soft sky/ground fill, cooler and dimmer at night.
 * - Room lights: two warm point lights at the ceiling downlights, off by day and on
 *   at night. Their number never changes (only brightness), because adding or removing
 *   a light makes Three.js rebuild every material.
 * - Glow: ceiling lights, lamp shades and bulbs get brighter at night; the sky in the
 *   windows goes from blue to orange to night blue.
 * - Environment: a procedural "room" of light panels (no downloads) for reflections and fill.
 */
export function Lighting({ lighting }: { lighting: RoomLighting }) {
  const info = useRoomInfo()
  const { ceiling } = info.lights
  const { downlights } = info
  // The shadow cameras cover the room plus a margin; 6 and 7 m for the standard Living Room (7 × 6 m).
  const reach = Math.max(info.width, info.depth) / 2
  const fillHalf = reach + 2.5
  const sunHalf = reach + 3.5
  const ceilingTarget = useMemo(() => new THREE.Object3D(), [])
  const sunTarget = useMemo(() => new THREE.Object3D(), [])
  const state = daylightAt(lighting)
  const [dx, dy, dz] = state.sunDirection
  const invalidate = useThree((s) => s.invalidate)
  const quality = useQuality()
  const shadowSize = quality.shadowMapSize

  // The sun's shadow also sees hidden walls and the invisible roof (see Cutaway.tsx),
  // so it only gets in through windows. The fill light's shadow doesn't.
  const sunRef = useRef<THREE.DirectionalLight>(null)
  useLayoutEffect(() => {
    sunRef.current?.shadow.camera.layers.enable(SHADOW_ONLY_LAYER)
  }, [shadowSize])

  // Glowing materials are shared by every room, so they're updated in place.
  useEffect(() => {
    materials.coveLight.color.copy(COVE_BASE).multiplyScalar(0.9 + 3.1 * state.interior)
    materials.lampShade.emissiveIntensity = 0.25 + 1.0 * state.interior
    materials.bulb.emissiveIntensity = 1 + 3 * state.interior
    materials.sky.color.copy(SKY_COLOR.set(state.sky.color)).multiplyScalar(state.sky.brightness)
    invalidate()
  }, [state.interior, state.sky.color, state.sky.brightness, invalidate])

  // At most two room lights: enough to light the room at night without making every material slower.
  const roomLights = downlights.slice(0, 2)

  return (
    <InteriorLightContext.Provider value={state.interior}>
      <color attach="background" args={[state.background]} />
      <hemisphereLight args={[state.hemisphere.sky, state.hemisphere.ground, state.hemisphere.intensity]} />

      <primitive object={ceilingTarget} position={[0, 0, 0]} />
      <primitive object={sunTarget} position={[0, 0, 0]} />

      {/* key: a new shadow size needs a new shadow map, so the light is rebuilt. */}
      <directionalLight
        key={`fill-${shadowSize}`}
        castShadow={quality.fillShadows}
        target={ceilingTarget}
        position={ceiling}
        intensity={state.fillIntensity}
        color={state.fillColor}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-fillHalf}
        shadow-camera-right={fillHalf}
        shadow-camera-top={fillHalf}
        shadow-camera-bottom={-fillHalf}
        shadow-camera-far={25}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <directionalLight
        key={`sun-${shadowSize}`}
        ref={sunRef}
        castShadow
        target={sunTarget}
        position={[dx * SUN_DISTANCE, Math.max(dy, 0.02) * SUN_DISTANCE, dz * SUN_DISTANCE]}
        intensity={state.sunIntensity}
        color={state.sunColor}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-sunHalf}
        shadow-camera-right={sunHalf}
        shadow-camera-top={sunHalf}
        shadow-camera-bottom={-sunHalf}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {roomLights.map(([x, z]) => (
        <pointLight key={`${x},${z}`} position={[x, 2.55, z]} color="#ffd9a8" intensity={5 * state.interior} distance={7} decay={2} />
      ))}

      {/*
        Environment: what shiny surfaces reflect, and a soft fill light from every direction.
        Built from glowing panels ("lightformers") arranged like the inside of a room, so it
        needs no HDR image download: warm walls all round, a bright softbox overhead, cool
        daylight on the window side (-z, where every room's main window is) and a warm wooden
        floor below. Rendered once, at start-up.
      */}
      <Environment resolution={256} environmentIntensity={state.environment}>
        <color attach="background" args={['#cdbfae']} />
        <Lightformer form="rect" intensity={1.6} color="#fff6ea" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={4} color="#dcecff" position={[-2, 2, -9]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={3} color="#e6f0ff" position={[7, 2, -9]} scale={[3, 3, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#ffe9cf" position={[9, 2, 3]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#c99a6b" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
      </Environment>
      <ShadowsWhenChanged />
    </InteriorLightContext.Provider>
  )
}

/**
 * Three.js normally redraws every shadow map on *every* render call: each frame,
 * and again for a polished floor's reflection. But shadow maps don't depend on the
 * camera, so while you orbit or zoom nothing about them changes. This redraws them
 * only when something that casts a shadow moved, appeared, disappeared or changed,
 * or a light moved (see shadowSignature).
 *
 * The check runs once at the end of each frame, when the scene is in its normal
 * state (effects such as the selection outline briefly hide things while they draw).
 * If something changed, the shadows are redrawn in one extra frame right after,
 * about 16 ms later, which you can't see.
 */
function ShadowsWhenChanged() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    let last: number | null = null
    const unsubscribe = addAfterEffect(() => {
      scene.updateMatrixWorld()
      const signature = shadowSignature(scene)
      if (signature === last) return
      const first = last === null
      last = signature
      if (first) return // the first frame already drew them (needsUpdate above)
      gl.shadowMap.needsUpdate = true
      // Ask for that frame from outside the render loop (a request made here is dropped).
      requestAnimationFrame(() => invalidate())
    })
    return () => {
      unsubscribe()
      gl.shadowMap.autoUpdate = true
    }
  }, [gl, scene, invalidate])
  return null
}
