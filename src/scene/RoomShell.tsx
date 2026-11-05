import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { BoxGeometry } from 'three'
import type * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { useQuality } from './quality'
import { Select } from '@react-three/postprocessing'
import type { ThreeEvent } from '@react-three/fiber'
import { ROOM } from './roomConfig'
import { ROOMS, WALL_SIDES, type RoomId, type WallSide } from './house'
import { isCameraBehindWall, localOpenings, skirtingRuns, wallFrame, wallPieces } from './walls'
import { createFloorMaps, type SurfaceMaps } from './textures'
import { materials } from './materials'
import { getFloorOption, wallFinishOf, type FloorId, type RoomFinishes, type WallFinish } from './finishes'
import { FLOOR_SELECTION, wallSelection } from './selection'
import { useTintedMaterial } from './furniture/useTintedMaterial'
import { Block } from './parts'
import { Window } from './furniture/Window'
import { Door } from './furniture/Door'
import { Ceiling } from './Ceiling'
import { Cutaway } from './Cutaway'
import { Curtains, ROOM_DECOR } from './rooms/decor'

export const SKIRTING_H = 0.09
export const SKIRTING_T = 0.015

type Vec3 = [number, number, number]

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
function ReflectiveMaterial({
  maps,
  roughness,
  strength,
  resolution,
}: {
  maps: SurfaceMaps
  roughness: number
  strength: number
  resolution: number
}) {
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
      resolution={resolution}
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
interface FloorProps {
  floor: FloorId
  width: number
  depth: number
  selected: boolean
  onPick: (point: Vec3) => void
}

export function Floor({ floor, width, depth, selected, onPick }: FloorProps) {
  const maps = getFloorMaps(floor, width, depth)
  const { roughness, reflection } = getFloorOption(floor)
  // Lower quality levels use a smaller reflection, or none (quality.ts).
  const { reflectionResolution } = useQuality()
  return (
    <Select enabled={selected}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={pickHandler(onPick)}>
        <planeGeometry args={[width, depth]} />
        {reflection > 0 && reflectionResolution > 0 ? (
          // key: switching floors or reflection size rebuilds the reflection cleanly.
          <ReflectiveMaterial
            key={`${floor}-${reflectionResolution}`}
            maps={maps}
            roughness={roughness}
            strength={reflection}
            resolution={reflectionResolution}
          />
        ) : (
          <meshStandardMaterial {...maps} roughness={roughness} metalness={0.02} />
        )}
      </mesh>
    </Select>
  )
}

/**
 * Click handler for walls and the floor. A click that was really the end of a
 * camera drag (the pointer moved more than a few pixels) is ignored, so orbiting
 * the view never selects anything.
 */
function pickHandler(onPick: (point: Vec3) => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4) return
    event.stopPropagation() // only the nearest surface is picked
    onPick([event.point.x, event.point.y, event.point.z])
  }
}

// ---------- Walls ----------

/**
 * Rewrites a box's texture coordinates so 1 unit = 1 metre, measured from the
 * wall's own origin. A tile texture then keeps the same size on every wall piece,
 * and the grout lines continue across the pieces around windows and doors.
 * (Box faces are stored in the order +x, -x, +y, -y, +z, -z, 4 corners each.)
 */
function setMetreUvs(geometry: THREE.BufferGeometry, [sx, sy, sz]: Vec3, [px, py]: Vec3) {
  const uv = geometry.getAttribute('uv')
  const bottom = py - sy / 2
  // [u size, v size, u offset, v offset] per face
  const faces: [number, number, number, number][] = [
    [sz, sy, 0, bottom],
    [sz, sy, 0, bottom],
    [sx, sz, px - sx / 2, 0],
    [sx, sz, px - sx / 2, 0],
    [sx, sy, px - sx / 2, bottom], // inside face (+z points into the room)
    [sx, sy, -(px + sx / 2), bottom],
  ]
  faces.forEach(([du, dv, ou, ov], face) => {
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k
      uv.setXY(i, uv.getX(i) * du + ou, uv.getY(i) * dv + ov)
    }
  })
  uv.needsUpdate = true
}

function WallPiece({ size, position, material }: { size: Vec3; position: Vec3; material: THREE.Material }) {
  const [sx, sy, sz] = size
  const [px, py, pz] = position
  // Built once per size and position (not on every render, which would rescale the UVs again).
  const geometry = useMemo(() => {
    const box = new BoxGeometry(sx, sy, sz)
    setMetreUvs(box, [sx, sy, sz], [px, py, pz])
    return box
  }, [sx, sy, sz, px, py, pz])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} position={position} material={material} castShadow receiveShadow />
}

interface WallProps {
  room: RoomId
  side: WallSide
  finish: WallFinish
  selected: boolean
  onPick: (point: Vec3) => void
}

/**
 * One wall with its windows, doors and skirting, built in the wall's own frame
 * (see walls.ts) and turned into place. It hides itself when it would block the view.
 */
function Wall({ room, side, finish, selected, onPick }: WallProps) {
  const info = ROOMS[room]
  // Each wall has its own material, so one wall can be painted or tiled differently.
  // All styles are kept ready so switching between them is instant.
  const paint = useTintedMaterial(materials.wall, finish.color)
  const tiles = useTintedMaterial(materials.wallTiles, finish.color)
  const paper = useTintedMaterial(materials.wallpaper, finish.color)
  const boards = useTintedMaterial(materials.panelling, finish.color)
  const tiled = finish.style === 'tiles'
  const material = { paint, tiles, wallpaper: paper, panelling: boards }[finish.style]
  const skirting = !tiled // tiled walls have no wooden skirting
  const frame = wallFrame(side, info)
  const openings = localOpenings(side, info)
  const pieces = wallPieces(frame.length, openings)
  const runs = skirting ? skirtingRuns(frame.innerLength, openings) : []
  const Decor = ROOM_DECOR[room].walls?.[side]
  const insideFace = ROOM.wallThickness / 2

  return (
    <Cutaway isBehind={(camera) => isCameraBehindWall(side, info, camera.position)}>
      <group position={frame.position} rotation={[0, frame.rotationY, 0]}>
        {/* Click the wall itself to select it (windows, doors and decor don't count). */}
        <Select enabled={selected}>
          <group onClick={pickHandler(onPick)}>
            {pieces.map((piece, i) => (
              <WallPiece key={i} position={piece.position} size={piece.size} material={material} />
            ))}
          </group>
        </Select>

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
interface RoomShellProps {
  room: RoomId
  finishes: RoomFinishes
  /** What's selected: 'wall:back' etc. or 'floor' get a blue outline. */
  selectedId: string | null
  onPickWall: (side: WallSide, point: Vec3) => void
  onPickFloor: (point: Vec3) => void
}

export function RoomShell({ room, finishes, selectedId, onPickWall, onPickFloor }: RoomShellProps) {
  const info = ROOMS[room]
  const FloorDecor = ROOM_DECOR[room].floor

  return (
    <group>
      <Floor floor={finishes.floor} width={info.width} depth={info.depth} selected={selectedId === FLOOR_SELECTION} onPick={onPickFloor} />
      {FloorDecor && <FloorDecor />}
      <Ceiling width={info.width} depth={info.depth} downlights={info.downlights} />
      {WALL_SIDES.map((side) => (
        <Wall
          key={side}
          room={room}
          side={side}
          finish={wallFinishOf(finishes, side)}
          selected={selectedId === wallSelection(side)}
          onPick={(point) => onPickWall(side, point)}
        />
      ))}
    </group>
  )
}
