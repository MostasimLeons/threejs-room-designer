import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { ROOM } from './roomConfig'
import { BEDROOM_WINDOW, CONNECTING_DOOR, ROOMS, SHARED_WALL, type RoomId } from './house'
import { materials } from './materials'
import type { RoomFinishes } from './finishes'
import { Block, Cylinder } from './parts'
import { Cutaway, Floor, SKIRTING_H, SKIRTING_T, Wall } from './Room'
import { useTintedMaterial } from './furniture/useTintedMaterial'
import { Window } from './furniture/Window'
import { Door } from './furniture/Door'

const T = ROOM.wallThickness
const BED = ROOMS.bedroom
const [CX, CZ] = BED.center
const HALF_W = BED.width / 2 // 2.5
const HALF_D = BED.depth / 2 // 2

/** Curtain panel made of vertical "pleats" (squashed cylinders) so it looks folded. */
function Curtain({ fromX, toX, z }: { fromX: number; toX: number; z: number }) {
  const pleats = Math.max(3, Math.round((toX - fromX) / 0.055))
  const step = (toX - fromX) / pleats
  const height = 2.44
  return (
    <group>
      {Array.from({ length: pleats }, (_, i) => (
        <Cylinder
          key={i}
          radiusTop={0.032}
          height={height}
          segments={10}
          position={[fromX + step * (i + 0.5), 0.05 + height / 2, z + (i % 2 ? 0.012 : -0.012)]}
          scale={[1, 1, 0.7]}
          material={materials.curtain}
        />
      ))}
    </group>
  )
}

/** Window with a brass curtain rod and two cream curtains drawn to the sides. */
function CurtainedWindow() {
  const { center, width, bottom, top } = BEDROOM_WINDOW
  const left = center - width / 2
  const right = center + width / 2
  const z = -HALF_D + 0.2 // in front of the window sill
  const rodLeft = left - 0.33
  const rodRight = Math.min(right + 0.33, HALF_W - 0.02)
  return (
    <group>
      <Window width={width} height={top - bottom} position={[center, bottom, -HALF_D - T / 2]} />
      <Cylinder
        radiusTop={0.013}
        height={rodRight - rodLeft}
        rotation={[0, 0, Math.PI / 2]}
        position={[(rodLeft + rodRight) / 2, 2.52, z]}
        material={materials.brass}
      />
      <Curtain fromX={rodLeft + 0.02} toX={left + 0.1} z={z} />
      <Curtain fromX={right - 0.1} toX={rodRight - 0.02} z={z} />
    </group>
  )
}

/** Vertical natural-oak slats on a dark backing, behind the bed. One InstancedMesh = one draw call for all slats. */
function SlatAccentWall() {
  // Centred behind the bed (x = -0.35), stopping before the curtains
  const from = -1.85
  const to = 1.15
  const height = 2.6
  const slatW = 0.035
  const pitch = 0.06
  const count = Math.floor((to - from) / pitch)
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      matrix.makeTranslation(from + pitch * (i + 0.5), height / 2, -HALF_D + 0.03)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, from])

  return (
    <group>
      <Block
        size={[to - from, height, 0.015]}
        position={[(from + to) / 2, height / 2, -HALF_D + 0.0075]}
        material={materials.slatBacking}
      />
      <instancedMesh ref={ref} args={[undefined, undefined, count]} material={materials.woodLight} castShadow receiveShadow>
        <boxGeometry args={[slatW, height, 0.03]} />
      </instancedMesh>
      {/* Oak cap along the top */}
      <Block
        size={[to - from + 0.02, 0.03, 0.06]}
        position={[(from + to) / 2, height + 0.015, -HALF_D + 0.03]}
        material={materials.woodLight}
      />
    </group>
  )
}

function Carpet() {
  return (
    <group position={[-0.35, 0, -0.35]}>
      <mesh position={[0, 0.005, 0]} material={materials.carpetBorder} receiveShadow>
        <boxGeometry args={[3.2, 0.01, 2.5]} />
      </mesh>
      <mesh position={[0, 0.0055, 0]} material={materials.carpet} receiveShadow>
        <boxGeometry args={[3.06, 0.011, 2.36]} />
      </mesh>
    </group>
  )
}

interface BedroomShellProps {
  finishes: RoomFinishes
}

/**
 * Bedroom floor, back wall (window + curtains + slat accent wall), right wall and carpet.
 * Built in bedroom-local coordinates (origin = bedroom centre), then moved into place.
 * The shared wall with the Living Room is a separate component (below).
 */
export function BedroomShell({ finishes }: BedroomShellProps) {
  const wallMaterial = useTintedMaterial(materials.wall, finishes.wallColor)
  // The back wall runs from the shared wall to past the right wall, covering that corner.
  const backLength = BED.width + T
  const backCenterX = T / 2

  return (
    <group position={[CX, 0, CZ]}>
      <Floor floor={finishes.floor} width={BED.width} depth={BED.depth} />
      <Carpet />

      {/* Back wall, lined up with the Living Room's back wall */}
      <Cutaway isBehind={(camera) => camera.position.z < CZ - HALF_D}>
        <Wall
          length={backLength}
          opening={{ ...BEDROOM_WINDOW, center: BEDROOM_WINDOW.center - backCenterX }}
          material={wallMaterial}
          position={[backCenterX, 0, -HALF_D - T / 2]}
        />
        <CurtainedWindow />
        <SlatAccentWall />
        <Block
          size={[BED.width, SKIRTING_H, SKIRTING_T]}
          position={[0, SKIRTING_H / 2, -HALF_D + SKIRTING_T / 2]}
          material={materials.trim}
        />
      </Cutaway>

      {/* Right (outside) wall */}
      <Cutaway isBehind={(camera) => camera.position.x > CX + HALF_W}>
        <Wall length={BED.depth} material={wallMaterial} position={[HALF_W + T / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <Block
          size={[SKIRTING_T, SKIRTING_H, BED.depth]}
          position={[HALF_W - SKIRTING_T / 2, SKIRTING_H / 2, 0]}
          material={materials.trim}
        />
      </Cutaway>
    </group>
  )
}

interface SharedWallProps {
  livingWallColor: string
  bedroomWallColor: string
  activeRoom: RoomId
}

/**
 * The wall between the two rooms, with an open connecting door.
 * It is two half-thickness layers so each side shows its own room's paint.
 * It hides when the camera is outside the room you're viewing, on the far side of it.
 */
export function SharedWall({ livingWallColor, bedroomWallColor, activeRoom }: SharedWallProps) {
  const livingPaint = useTintedMaterial(materials.wall, livingWallColor)
  const bedroomPaint = useTintedMaterial(materials.wall, bedroomWallColor)
  const { x, zStart, zEnd } = SHARED_WALL
  const length = zEnd - zStart
  const zCenter = (zStart + zEnd) / 2
  // The wall is rotated 90°, so its local x axis points toward -z: the door centre is mirrored.
  const opening = { ...CONNECTING_DOOR, center: -(CONNECTING_DOOR.center - zCenter) }
  const half = T / 2

  // Skirting stops at the door casing, on both sides.
  const doorStart = CONNECTING_DOOR.center - CONNECTING_DOOR.width / 2 - 0.07
  const doorEnd = CONNECTING_DOOR.center + CONNECTING_DOOR.width / 2 + 0.07
  const backLen = doorStart - zStart
  const frontLen = zEnd - doorEnd
  const livingFace = x - T / 2
  const bedroomFace = x + T / 2

  const isBehind = (camera: THREE.Camera) => (activeRoom === 'living' ? camera.position.x > livingFace : camera.position.x < bedroomFace)

  return (
    <Cutaway isBehind={isBehind}>
      <Wall
        length={length}
        thickness={half}
        opening={opening}
        material={livingPaint}
        position={[x - half / 2, 0, zCenter]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Wall
        length={length}
        thickness={half}
        opening={opening}
        material={bedroomPaint}
        position={[x + half / 2, 0, zCenter]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Connecting door, standing open into the bedroom */}
      <Door
        width={CONNECTING_DOOR.width}
        height={CONNECTING_DOOR.top}
        openAngle={95}
        position={[x, 0, CONNECTING_DOOR.center]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Oak threshold strip so there's no gap in the floor under the doorway */}
      <Block size={[T + 0.02, 0.012, CONNECTING_DOOR.width]} position={[x, 0.006, CONNECTING_DOOR.center]} material={materials.woodLight} />

      {[livingFace - SKIRTING_T / 2, bedroomFace + SKIRTING_T / 2].map((sx) => (
        <group key={sx}>
          <Block size={[SKIRTING_T, SKIRTING_H, backLen]} position={[sx, SKIRTING_H / 2, zStart + backLen / 2]} material={materials.trim} />
          <Block
            size={[SKIRTING_T, SKIRTING_H, frontLen]}
            position={[sx, SKIRTING_H / 2, doorEnd + frontLen / 2]}
            material={materials.trim}
          />
        </group>
      ))}
    </Cutaway>
  )
}
