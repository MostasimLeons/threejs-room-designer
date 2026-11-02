import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { DOOR_OPENING, ROOM, WINDOW_OPENING } from './roomConfig'
import { createFloorTexture } from './textures'
import { materials } from './materials'
import { getFloorOption, type FloorId, type RoomFinishes } from './finishes'
import { useTintedMaterial } from './furniture/useTintedMaterial'
import { Block } from './parts'
import { Window } from './furniture/Window'
import { Door } from './furniture/Door'

type Vec3 = [number, number, number]

interface Opening {
  center: number
  width: number
  bottom: number
  top: number
}

interface WallProps extends Omit<ThreeElements['group'], 'children'> {
  length: number
  opening?: Opening
  material: THREE.Material
}

/**
 * A wall built along its local x axis. If it has an opening (window/door),
 * the wall is assembled from up to four boxes around the hole, so light can
 * really shine through it.
 */
function Wall({ length, opening, material, ...props }: WallProps) {
  const { height: H, wallThickness: T } = ROOM
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

// Each floor texture is drawn once and then reused when you switch back to it.
const floorTextures = new Map<FloorId, THREE.CanvasTexture>()

function getFloorTexture(id: FloorId) {
  let texture = floorTextures.get(id)
  if (!texture) {
    texture = createFloorTexture(id)
    const { tileSize } = getFloorOption(id)
    texture.repeat.set(ROOM.width / tileSize, ROOM.depth / tileSize)
    floorTextures.set(id, texture)
  }
  return texture
}

function Floor({ floor }: { floor: FloorId }) {
  const texture = getFloorTexture(floor)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[ROOM.width, ROOM.depth]} />
      <meshStandardMaterial map={texture} roughness={getFloorOption(floor).roughness} metalness={0.02} />
    </mesh>
  )
}

/**
 * "Cutaway" walls: hides its children whenever the camera is outside the room
 * behind them, so the wall never blocks your view. Checked every frame.
 */
function Cutaway({ isBehind, children }: { isBehind: (camera: THREE.Camera) => boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = !isBehind(camera)
  })
  return <group ref={ref}>{children}</group>
}

const SKIRTING_H = 0.09
const SKIRTING_T = 0.015

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

/** Floor, rug, back wall (with window) and left wall (with door), in the chosen finishes. */
export function Room({ finishes }: { finishes: RoomFinishes }) {
  // One paint material shared by every wall piece, recoloured when you pick a new wall colour.
  const wallMaterial = useTintedMaterial(materials.wall, finishes.wallColor)
  return (
    <group>
      <Floor floor={finishes.floor} />
      <Rug />
      <BackWall wallMaterial={wallMaterial} />
      <LeftWall wallMaterial={wallMaterial} />
    </group>
  )
}
