import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { DOOR_OPENING, ROOM, WINDOW_OPENING } from './roomConfig'
import { MeshReflectorMaterial } from '@react-three/drei'
import { createFloorMaps, type SurfaceMaps } from './textures'
import { materials } from './materials'
import { getFloorOption, type FloorId, type RoomFinishes } from './finishes'
import { useTintedMaterial } from './furniture/useTintedMaterial'
import { Block } from './parts'
import { Window } from './furniture/Window'
import { Door } from './furniture/Door'
import { Ceiling } from './Ceiling'

type Vec3 = [number, number, number]

export interface Opening {
  center: number
  width: number
  bottom: number
  top: number
}

interface WallProps extends Omit<ThreeElements['group'], 'children'> {
  length: number
  opening?: Opening
  material: THREE.Material
  /** Defaults to the normal wall thickness. The shared wall uses two half-thickness layers. */
  thickness?: number
}

/**
 * A wall built along its local x axis. If it has an opening (window/door),
 * the wall is assembled from up to four boxes around the hole, so light can
 * really shine through it.
 */
export function Wall({ length, opening, material, thickness = ROOM.wallThickness, ...props }: WallProps) {
  const { height: H } = ROOM
  const T = thickness
  const pieces: { position: Vec3; size: Vec3 }[] = []

  if (!opening) {
    pieces.push({ position: [0, H / 2, 0], size: [length, H, T] })
  } else {
    const left = -length / 2
    const right = length / 2
    const holeLeft = opening.center - opening.width / 2
    const holeRight = opening.center + opening.width / 2

    pieces.push({ position: [(left + holeLeft) / 2, H / 2, 0], size: [holeLeft - left, H, T] })
    pieces.push({ position: [(holeRight + right) / 2, H / 2, 0], size: [right - holeRight, H, T] })
    if (opening.bottom > 0) {
      pieces.push({
        position: [opening.center, opening.bottom / 2, 0],
        size: [opening.width, opening.bottom, T],
      })
    }
    pieces.push({
      position: [opening.center, (opening.top + H) / 2, 0],
      size: [opening.width, H - opening.top, T],
    })
  }

  return (
    <group {...props}>
      {pieces.map((piece, i) => (
        <Block key={i} position={piece.position} size={piece.size} material={material} />
      ))}
    </group>
  )
}

// Each floor's textures are drawn once per material and room size, then reused.
const floorMaps = new Map<string, SurfaceMaps>()

function getFloorMaps(id: FloorId, width: number, depth: number): SurfaceMaps {
  const key = `${id}:${width}x${depth}`
  let maps = floorMaps.get(key)
  if (!maps) {
    maps = createFloorMaps(id)
    const { tileSize } = getFloorOption(id)
    for (const texture of Object.values(maps)) texture.repeat.set(width / tileSize, depth / tileSize)
    floorMaps.set(key, maps)
  }
  return maps
}

interface FloorProps {
  floor: FloorId
  width?: number
  depth?: number
  /**
   * Polished floors mirror the room, but only in the room you're editing:
   * each reflection is an extra render of the whole scene.
   */
  reflect?: boolean
}

type ReflectorRef = ComponentRef<typeof MeshReflectorMaterial>

/**
 * Floor material that mirrors the room, softly blurred like polished stone.
 * Drei's reflector never frees its off-screen images (render targets) when it is
 * removed, so switching rooms or floors would slowly fill GPU memory. The cleanup
 * below frees them.
 */
function ReflectiveMaterial({ maps, roughness, strength }: { maps: SurfaceMaps; roughness: number; strength: number }) {
  const ref = useRef<ReflectorRef>(null)
  useEffect(() => {
    const material = ref.current
    return () => {
      if (!material) return
      for (const texture of [material.tDiffuse, material.tDiffuseBlur]) texture?.renderTarget?.dispose()
      material.tDepth?.dispose()
    }
  }, [])
  return (
    <MeshReflectorMaterial
      ref={ref}
      {...maps}
      roughness={roughness}
      metalness={0.02}
      // Softness comes from the low resolution (it is smoothed when stretched over the
      // floor) and from the floor's own surface detail rippling the reflection.
      // Drei's blur is left off on purpose: it allocates two more off-screen images
      // that it never frees and that this component can't reach to clean up.
      resolution={256}
      blur={[0, 0]}
      distortionMap={maps.normalMap}
      distortion={0.15}
      mixStrength={strength}
      mixContrast={1}
      mirror={0}
    />
  )
}

/** Textured floor. The size defaults to the Living Room; the Bedroom passes its own. */
export function Floor({ floor, width = ROOM.width, depth = ROOM.depth, reflect = false }: FloorProps) {
  const maps = getFloorMaps(floor, width, depth)
  const { roughness, reflection } = getFloorOption(floor)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      {reflect && reflection > 0 ? (
        // key: switching between floors with different settings rebuilds the reflection cleanly.
        <ReflectiveMaterial key={floor} maps={maps} roughness={roughness} strength={reflection} />
      ) : (
        <meshStandardMaterial {...maps} roughness={roughness} metalness={0.02} />
      )}
    </mesh>
  )
}

/**
 * "Cutaway" walls: hides its children whenever the camera is outside the room
 * behind them, so the wall never blocks your view. Checked every frame.
 */
export function Cutaway({ isBehind, children }: { isBehind: (camera: THREE.Camera) => boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = !isBehind(camera)
  })
  return <group ref={ref}>{children}</group>
}

export const SKIRTING_H = 0.09
export const SKIRTING_T = 0.015

function BackWall({ wallMaterial }: { wallMaterial: THREE.Material }) {
  const { width: W, depth: D, wallThickness: T } = ROOM
  return (
    <Cutaway isBehind={(camera) => camera.position.z < -D / 2}>
      {/* Slightly longer than the room so it covers the corner. */}
      <Wall length={W + 2 * T} opening={WINDOW_OPENING} material={wallMaterial} position={[0, 0, -D / 2 - T / 2]} />
      <Window
        width={WINDOW_OPENING.width}
        height={WINDOW_OPENING.top - WINDOW_OPENING.bottom}
        position={[WINDOW_OPENING.center, WINDOW_OPENING.bottom, -D / 2 - T / 2]}
      />
      <Block size={[W, SKIRTING_H, SKIRTING_T]} position={[0, SKIRTING_H / 2, -D / 2 + SKIRTING_T / 2]} material={materials.trim} />
    </Cutaway>
  )
}

function LeftWall({ wallMaterial }: { wallMaterial: THREE.Material }) {
  const { width: W, depth: D, wallThickness: T } = ROOM
  // The skirting is split in two so it stops at the door frame.
  const doorStart = DOOR_OPENING.center - DOOR_OPENING.width / 2 - 0.07
  const doorEnd = DOOR_OPENING.center + DOOR_OPENING.width / 2 + 0.07
  const backLen = doorStart + D / 2
  const frontLen = D / 2 - doorEnd
  const x = -W / 2 + SKIRTING_T / 2

  return (
    <Cutaway isBehind={(camera) => camera.position.x < -W / 2}>
      {/* Rotated 90°, so the wall's local x axis points toward -z.
          That is why the door's centre is negated here. */}
      <Wall
        length={D}
        opening={{ ...DOOR_OPENING, center: -DOOR_OPENING.center }}
        material={wallMaterial}
        position={[-W / 2 - T / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Door
        width={DOOR_OPENING.width}
        height={DOOR_OPENING.top}
        position={[-W / 2 - T / 2, 0, DOOR_OPENING.center]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Block size={[SKIRTING_T, SKIRTING_H, backLen]} position={[x, SKIRTING_H / 2, -D / 2 + backLen / 2]} material={materials.trim} />
      <Block size={[SKIRTING_T, SKIRTING_H, frontLen]} position={[x, SKIRTING_H / 2, doorEnd + frontLen / 2]} material={materials.trim} />
    </Cutaway>
  )
}

function Rug() {
  return (
    <group position={[0.2, 0, -1.15]}>
      <mesh position={[0, 0.004, 0]} material={materials.rugBorder} receiveShadow>
        <boxGeometry args={[3.0, 0.008, 2.2]} />
      </mesh>
      <mesh position={[0, 0.0045, 0]} material={materials.rug} receiveShadow>
        <boxGeometry args={[2.84, 0.009, 2.04]} />
      </mesh>
    </group>
  )
}

/** Four downlights in a grid, clear of the walls. */
const LIVING_DOWNLIGHTS: [number, number][] = [
  [-1.8, -1.5],
  [1.8, -1.5],
  [-1.8, 1.5],
  [1.8, 1.5],
]

/** Floor, rug, ceiling, back wall (with window) and left wall (with door), in the chosen finishes. */
export function Room({ finishes, active }: { finishes: RoomFinishes; active: boolean }) {
  // One paint material shared by every wall piece, recoloured when you pick a new wall colour.
  const wallMaterial = useTintedMaterial(materials.wall, finishes.wallColor)
  return (
    <group>
      <Floor floor={finishes.floor} reflect={active} />
      <Rug />
      <Ceiling width={ROOM.width} depth={ROOM.depth} downlights={LIVING_DOWNLIGHTS} />
      <BackWall wallMaterial={wallMaterial} />
      <LeftWall wallMaterial={wallMaterial} />
    </group>
  )
}
