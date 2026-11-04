import { useEffect, useRef, type ComponentRef } from 'react'
import type * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { ROOM } from './roomConfig'
import { ROOMS, WALL_SIDES, type RoomId, type WallSide } from './house'
import { isCameraBehindWall, localOpenings, skirtingRuns, wallFrame, wallPieces } from './walls'
import { createFloorMaps, type SurfaceMaps } from './textures'
import { materials } from './materials'
import { getFloorOption, type FloorId, type RoomFinishes } from './finishes'
import { useTintedMaterial } from './furniture/useTintedMaterial'
import { Block } from './parts'
import { Window } from './furniture/Window'
import { Door } from './furniture/Door'
import { Ceiling } from './Ceiling'
import { Cutaway } from './Cutaway'
import { Curtains, ROOM_DECOR } from './rooms/decor'

export const SKIRTING_H = 0.09
export const SKIRTING_T = 0.015

// ---------- Floor ----------

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

type ReflectorRef = ComponentRef<typeof MeshReflectorMaterial>

/**
 * Floor material that mirrors the room, softly, like polished stone.
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

/** Textured floor. Polished floors (concrete, tiles) also mirror the room. */
export function Floor({ floor, width, depth }: { floor: FloorId; width: number; depth: number }) {
  const maps = getFloorMaps(floor, width, depth)
  const { roughness, reflection } = getFloorOption(floor)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      {reflection > 0 ? (
        // key: switching between floors with different settings rebuilds the reflection cleanly.
        <ReflectiveMaterial key={floor} maps={maps} roughness={roughness} strength={reflection} />
      ) : (
        <meshStandardMaterial {...maps} roughness={roughness} metalness={0.02} />
      )}
    </mesh>
  )
}

// ---------- Walls ----------

interface WallProps {
  room: RoomId
  side: WallSide
  material: THREE.Material
}

/**
 * One wall with its windows, doors and skirting, built in the wall's own frame
 * (see walls.ts) and turned into place. It hides itself when it would block the view.
 */
function Wall({ room, side, material }: WallProps) {
  const info = ROOMS[room]
  const frame = wallFrame(side, info)
  const openings = localOpenings(side, info)
  const pieces = wallPieces(frame.length, openings)
  const runs = skirtingRuns(frame.innerLength, openings)
  const Decor = ROOM_DECOR[room].walls?.[side]
  const insideFace = ROOM.wallThickness / 2

  return (
    <Cutaway isBehind={(camera) => isCameraBehindWall(side, info, camera.position)}>
      <group position={frame.position} rotation={[0, frame.rotationY, 0]}>
        {pieces.map((piece, i) => (
          <Block key={i} position={piece.position} size={piece.size} material={material} />
        ))}

        {openings.map((o) =>
          o.kind === 'window' ? (
            <group key={o.label}>
              <Window width={o.width} height={o.top - o.bottom} position={[o.center, o.bottom, 0]} />
              {o.curtains && <Curtains left={o.center - o.width / 2} right={o.center + o.width / 2} wallHalf={frame.innerLength / 2} />}
            </group>
          ) : (
            <Door key={o.label} width={o.width} height={o.top} position={[o.center, 0, 0]} />
          ),
        )}

        {runs.map(([start, end]) => (
          <Block
            key={start}
            size={[end - start, SKIRTING_H, SKIRTING_T]}
            position={[(start + end) / 2, SKIRTING_H / 2, insideFace + SKIRTING_T / 2]}
            material={materials.trim}
          />
        ))}
      </group>
      {/* Wall decor is placed in room coordinates, but hides together with its wall. */}
      {Decor && <Decor />}
    </Cutaway>
  )
}

/**
 * A complete room built from its entry in house.ts: floor, ceiling, four walls
 * with their windows and doors, and the room's own decor (rug, carpet, slat wall).
 */
export function RoomShell({ room, finishes }: { room: RoomId; finishes: RoomFinishes }) {
  const info = ROOMS[room]
  // One paint material shared by every wall piece, recoloured when you pick a new wall colour.
  const wallMaterial = useTintedMaterial(materials.wall, finishes.wallColor)
  const FloorDecor = ROOM_DECOR[room].floor

  return (
    <group>
      <Floor floor={finishes.floor} width={info.width} depth={info.depth} />
      {FloorDecor && <FloorDecor />}
      <Ceiling width={info.width} depth={info.depth} downlights={info.downlights} />
      {WALL_SIDES.map((side) => (
        <Wall key={side} room={room} side={side} material={wallMaterial} />
      ))}
    </group>
  )
}
