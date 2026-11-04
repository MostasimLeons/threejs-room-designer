import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { ROOMS, type RoomId } from './house'

/**
 * Lighting setup:
 * - Hemisphere light: soft sky/ground fill so nothing is pitch black.
 * - "Ceiling" directional light: main light that gives furniture soft shadows.
 * - Sun: shines from outside through the window opening onto the floor.
 * - Environment: a procedural "room" of light panels (no downloads) for reflections and fill.
 * The floor lamp has its own warm point light (see FloorLamp.tsx).
 */
export function Lighting({ room }: { room: RoomId }) {
  // Each room has its own light directions (house.ts); the sun comes in through a window.
  const { ceiling, sun } = ROOMS[room].lights
  const ceilingTarget = useMemo(() => new THREE.Object3D(), [])
  const sunTarget = useMemo(() => new THREE.Object3D(), [])

  return (
    <>
      <hemisphereLight args={['#fff7ea', '#b89f80', 0.5]} />

      <primitive object={ceilingTarget} position={[0, 0, 0]} />
      <primitive object={sunTarget} position={[0, 0, 0]} />

      <directionalLight
        castShadow
        target={ceilingTarget}
        position={ceiling}
        intensity={1.0}
        color="#fffaf2"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-far={25}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <directionalLight
        castShadow
        target={sunTarget}
        position={sun}
        intensity={2.4}
        color="#ffeccc"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/*
        Environment: what shiny surfaces reflect, and a soft fill light from every direction.
        Built from glowing panels ("lightformers") arranged like the inside of a room, so it
        needs no HDR image download: warm walls all round, a bright softbox overhead, cool
        daylight on the window side (-z, where every room's main window is) and a warm wooden
        floor below. Rendered once, at start-up.
      */}
      <Environment resolution={256} environmentIntensity={0.5}>
        <color attach="background" args={['#cdbfae']} />
        <Lightformer form="rect" intensity={1.6} color="#fff6ea" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={4} color="#dcecff" position={[-2, 2, -9]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={3} color="#e6f0ff" position={[7, 2, -9]} scale={[3, 3, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#ffe9cf" position={[9, 2, 3]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#c99a6b" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
      </Environment>
      <ShadowsOncePerFrame />
    </>
  )
}

/**
 * Three.js normally redraws every shadow map on *every* render call. A polished
 * floor's reflection is a second render of the scene, which would redraw both
 * shadow maps again for nothing. This makes shadows update once per frame instead.
 * (Shadow maps don't depend on the camera, so the reflection can reuse them.)
 */
function ShadowsOncePerFrame() {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])
  // Runs before each frame is drawn; the first render in the frame consumes the flag.
  useFrame(() => {
    gl.shadowMap.needsUpdate = true
  })
  return null
}
