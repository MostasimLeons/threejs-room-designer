import { useLayoutEffect, useRef, type ComponentType } from 'react'
import * as THREE from 'three'
import { ROOM } from '../roomConfig'
import { ROOMS, type RoomId, type WallSide } from '../house'
import { materials } from '../materials'
import { Block, Cylinder } from '../parts'

/**
 * Built-in decor that makes a room more than four walls: things that aren't
 * furniture (you can't move them) and aren't windows or doors.
 * Floor decor sits in room coordinates. Wall decor also uses room coordinates but
 * is drawn inside its wall's Cutaway, so it hides together with that wall.
 */
export const ROOM_DECOR: Record<RoomId, { floor?: ComponentType; walls?: Partial<Record<WallSide, ComponentType>> }> = {
  living: { floor: LivingRug },
  bedroom: { floor: BedroomCarpet, walls: { back: SlatAccentWall } },
  dining: {},
  kitchen: {},
  bathroom: {},
}

const T = ROOM.wallThickness

// ---------- Living Room ----------

function LivingRug() {
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

// ---------- Bedroom ----------

function BedroomCarpet() {
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

/** Vertical natural-oak slats on a dark backing, behind the bed. One InstancedMesh = one draw call for all slats. */
function SlatAccentWall() {
  const backFace = -ROOMS.bedroom.depth / 2
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
      matrix.makeTranslation(from + pitch * (i + 0.5), height / 2, backFace + 0.03)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, from, backFace])

  return (
    <group>
      <Block
        size={[to - from, height, 0.015]}
        position={[(from + to) / 2, height / 2, backFace + 0.0075]}
        material={materials.slatBacking}
      />
      <instancedMesh ref={ref} args={[undefined, undefined, count]} material={materials.woodLight} castShadow receiveShadow>
        <boxGeometry args={[slatW, height, 0.03]} />
      </instancedMesh>
      {/* Oak cap along the top */}
      <Block
        size={[to - from + 0.02, 0.03, 0.06]}
        position={[(from + to) / 2, height + 0.015, backFace + 0.03]}
        material={materials.woodLight}
      />
    </group>
  )
}

// ---------- Curtains (any window with `curtains: true`) ----------

/** Curtain panel made of vertical "pleats" (squashed cylinders) so it looks folded. */
function CurtainPanel({ fromX, toX, z }: { fromX: number; toX: number; z: number }) {
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

interface CurtainsProps {
  /** Window edges along the wall (wall-local x). */
  left: number
  right: number
  /** Half the inside length of the wall, so the rod never pokes through the next wall. */
  wallHalf: number
}

/**
 * A brass rod with two cream curtains drawn to the sides, in the wall's local
 * frame (+z points into the room; see walls.ts).
 */
export function Curtains({ left, right, wallHalf }: CurtainsProps) {
  const z = T / 2 + 0.2 // in front of the window sill
  const rodLeft = Math.max(left - 0.33, -wallHalf + 0.02)
  const rodRight = Math.min(right + 0.33, wallHalf - 0.02)
  return (
    <group>
      <Cylinder
        radiusTop={0.013}
        height={rodRight - rodLeft}
        rotation={[0, 0, Math.PI / 2]}
        position={[(rodLeft + rodRight) / 2, 2.52, z]}
        material={materials.brass}
      />
      <CurtainPanel fromX={rodLeft + 0.02} toX={left + 0.1} z={z} />
      <CurtainPanel fromX={right - 0.1} toX={rodRight - 0.02} z={z} />
    </group>
  )
}
