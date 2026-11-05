import { useLayoutEffect, useRef } from 'react'
import type * as THREE from 'three'
import { ROOM } from './roomConfig'
import { materials } from './materials'
import { Cutaway, SHADOW_ONLY_LAYER } from './Cutaway'

const H = ROOM.height
const COVE_INSET = 0.3 // how far the glowing cove line sits in from the walls
const COVE_WIDTH = 0.06 // thinner lines break up into dots at a distance

interface CeilingProps {
  /** Inner size of the room in metres (along x and z). */
  width: number
  depth: number
  /** How far the ceiling reaches past each inner wall face, so it covers the wall tops. */
  overhang?: number
  /** Recessed downlights, as [x, z] positions relative to the room centre. */
  downlights?: [number, number][]
}

/**
 * Flat ceiling with a thin glowing cove line around the edge and recessed
 * downlights, all in room-local coordinates (origin = room centre on the floor).
 *
 * Every piece faces downwards only, and the whole ceiling is hidden while the camera
 * is above it, so it never blocks the usual view from above the room. It appears as
 * soon as the camera drops below 2.8 m.
 * It also casts no shadow, so the overhead light still reaches the room.
 *
 * The glow is visual only (it feeds the Bloom effect); no real lights are added,
 * because every light makes every material more expensive to draw.
 */
export function Ceiling({ width, depth, overhang = ROOM.wallThickness, downlights = [] }: CeilingProps) {
  const coveW = width - 2 * COVE_INSET
  const coveD = depth - 2 * COVE_INSET
  // Four strips: back, front, left, right. [x, z, length along x, length along z]
  const cove: [number, number, number, number][] = [
    [0, -coveD / 2, coveW, COVE_WIDTH],
    [0, coveD / 2, coveW, COVE_WIDTH],
    [-coveW / 2, 0, COVE_WIDTH, coveD],
    [coveW / 2, 0, COVE_WIDTH, coveD],
  ]

  return (
    <>
      <RoofShadow width={width + 2 * overhang} depth={depth + 2 * overhang} />
      {/*
        Hidden whenever the camera is above the ceiling. Backface culling would already
        hide it from the main view, but a reflective floor looks *up* and would mirror a
        ceiling (and its glowing lines) that you can't otherwise see.
      */}
      <Cutaway isBehind={(camera) => camera.position.y > H}>
        {/* Rotated so the planes, which face +z by default, face down (-y). */}
        <group position={[0, H, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.ceiling}>
            <planeGeometry args={[width + 2 * overhang, depth + 2 * overhang]} />
          </mesh>

          {cove.map(([x, z, w, d], i) => (
            <mesh key={i} position={[x, -0.002, z]} rotation={[Math.PI / 2, 0, 0]} material={materials.coveLight}>
              <planeGeometry args={[w, d]} />
            </mesh>
          ))}

          {downlights.map(([x, z]) => (
            <group key={`${x},${z}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
              {/* Metal trim ring, then the glowing lens inside it */}
              <mesh position={[0, 0, 0.002]} material={materials.downlightTrim}>
                <circleGeometry args={[0.065, 32]} />
              </mesh>
              <mesh position={[0, 0, 0.004]} material={materials.coveLight}>
                <circleGeometry args={[0.045, 32]} />
              </mesh>
            </group>
          ))}
        </group>
      </Cutaway>
    </>
  )
}

/**
 * An invisible roof that only the sun's shadow sees (SHADOW_ONLY_LAYER), so a high
 * midday sun can't shine straight through the ceiling. The visible ceiling casts no
 * shadow, so the overhead fill light still reaches into the cut-open room.
 */
function RoofShadow({ width, depth }: { width: number; depth: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => {
    ref.current?.layers.set(SHADOW_ONLY_LAYER)
  }, [])
  return (
    <mesh ref={ref} position={[0, H + 0.03, 0]} material={materials.ceiling} castShadow>
      <boxGeometry args={[width, 0.06, depth]} />
    </mesh>
  )
}
