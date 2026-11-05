import { useLayoutEffect, useRef, type ComponentType } from 'react'
import * as THREE from 'three'
import { ROOM } from '../roomConfig'
import { KITCHEN_UNIT_DEPTH, ROOMS, TOILET_POSITION, TOILET_SIZE, type RoomId, type WallSide } from '../house'
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
  dining: { floor: DiningPendant },
  // The units hide with the back wall, so they never block the view from behind.
  kitchen: { walls: { back: KitchenUnits } },
  bathroom: { floor: Toilet },
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

// ---------- Dining Room ----------

const pendantShade = new THREE.MeshStandardMaterial({ color: '#1f1f22', roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide })

/** Black cone pendant hanging over the table's starting position, with a glowing bulb. */
function DiningPendant() {
  const top = ROOM.height
  const shadeY = 1.6
  return (
    <group position={[0, 0, -0.1]}>
      <Cylinder radiusTop={0.06} height={0.02} position={[0, top - 0.01, 0]} material={materials.metalBlack} />
      <Cylinder
        radiusTop={0.004}
        height={top - shadeY - 0.12}
        position={[0, (top + shadeY + 0.12) / 2, 0]}
        material={materials.metalBlack}
      />
      <mesh position={[0, shadeY, 0]} material={pendantShade} castShadow>
        <cylinderGeometry args={[0.05, 0.26, 0.24, 40, 1, true]} />
      </mesh>
      <mesh position={[0, shadeY - 0.07, 0]} material={materials.bulb}>
        <sphereGeometry args={[0.05, 20, 14]} />
      </mesh>
    </group>
  )
}

// ---------- Kitchen ----------

/**
 * Built-in kitchen along the back wall (4 m): base units with a stone worktop,
 * sink under the window, hob with an extractor, glossy splashback and wall units
 * either side of the window, with a light strip under the left wall unit.
 */
function KitchenUnits() {
  const back = -ROOMS.kitchen.depth / 2
  const D = KITCHEN_UNIT_DEPTH
  const front = back + D - 0.04
  const doors = 6
  const doorW = 4 / doors
  const sinkX = 0.6 // centred under the window
  const hobX = -1.0

  return (
    <group>
      {/* Base units */}
      <Block size={[4, 0.1, D - 0.08]} position={[0, 0.05, back + (D - 0.08) / 2]} material={materials.slatBacking} />
      <Block size={[4, 0.78, D - 0.04]} position={[0, 0.49, back + (D - 0.04) / 2]} material={materials.creamLacquer} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -2 + doorW * (i + 0.5)
        return (
          <group key={i}>
            {i > 0 && (
              <Block size={[0.005, 0.76, 0.004]} position={[x - doorW / 2, 0.49, front + 0.002]} material={materials.slatBacking} />
            )}
            <Block size={[doorW * 0.4, 0.012, 0.016]} position={[x, 0.8, front + 0.01]} material={materials.metalBlack} />
          </group>
        )
      })}
      <Block size={[4, 0.04, D]} position={[0, 0.9, back + D / 2]} material={materials.stone} />

      {/* Sink and tap */}
      <Block size={[0.56, 0.006, 0.4]} position={[sinkX, 0.922, back + 0.33]} material={materials.steel} />
      <Block size={[0.5, 0.004, 0.34]} position={[sinkX, 0.925, back + 0.33]} material={materials.metalBlack} />
      <Cylinder radiusTop={0.014} height={0.32} position={[sinkX, 1.08, back + 0.08]} material={materials.chrome} />
      <Block size={[0.025, 0.025, 0.2]} radius={0.01} position={[sinkX, 1.23, back + 0.17]} material={materials.chrome} />

      {/* Hob with four rings, and the extractor above it */}
      <Block size={[0.6, 0.006, 0.5]} position={[hobX, 0.922, back + 0.32]} material={materials.screen} />
      {[
        [-0.14, -0.12],
        [0.14, -0.12],
        [-0.14, 0.12],
        [0.14, 0.12],
      ].map(([dx, dz], i) => (
        <Cylinder
          key={i}
          radiusTop={0.08}
          height={0.002}
          position={[hobX + dx, 0.926, back + 0.32 + dz]}
          segments={28}
          material={materials.steel}
        />
      ))}
      <Block size={[0.6, 0.05, 0.32]} position={[hobX, 1.47, back + 0.16]} material={materials.steel} />

      {/* Splashback: either side of the window, and a strip under it */}
      <Block size={[1.98, 0.53, 0.01]} position={[-1.01, 1.185, back + 0.005]} material={materials.splashback} />
      <Block size={[0.78, 0.53, 0.01]} position={[1.61, 1.185, back + 0.005]} material={materials.splashback} />
      <Block size={[1.2, 0.11, 0.01]} position={[sinkX, 0.975, back + 0.005]} material={materials.splashback} />

      {/* Wall units either side of the window, with seams */}
      <Block size={[1.85, 0.7, 0.34]} position={[-1.075, 1.85, back + 0.17]} material={materials.creamLacquer} />
      <Block size={[0.65, 0.7, 0.34]} position={[1.675, 1.85, back + 0.17]} material={materials.creamLacquer} />
      {[-1.53, -1.07, -0.61].map((x) => (
        <Block key={x} size={[0.005, 0.68, 0.004]} position={[x, 1.85, back + 0.342]} material={materials.slatBacking} />
      ))}
      {/* Light strip under the left wall unit: lights the worktop and glows */}
      <mesh position={[-1.075, 1.495, back + 0.3]} material={materials.coveLight}>
        <boxGeometry args={[1.7, 0.01, 0.02]} />
      </mesh>
    </group>
  )
}

// ---------- Bathroom ----------

/** Wall-hung toilet in front of a concealed cistern, with a chrome flush plate. */
function Toilet() {
  const [x, z] = TOILET_POSITION
  const [w, d] = TOILET_SIZE
  const wallZ = z - d / 2 // the zone's back edge is the back wall
  const frameD = 0.14
  return (
    <group position={[x, 0, 0]}>
      <Block size={[w, 0.9, frameD]} radius={0.01} position={[0, 0.45, wallZ + frameD / 2]} material={materials.enamel} />
      <Block size={[0.18, 0.12, 0.01]} radius={0.004} position={[0, 0.78, wallZ + frameD + 0.005]} material={materials.chrome} />
      <Block
        size={[0.36, 0.2, d - frameD]}
        radius={0.08}
        position={[0, 0.32, wallZ + frameD + (d - frameD) / 2]}
        material={materials.enamel}
      />
      <Block
        size={[0.37, 0.025, d - frameD - 0.02]}
        radius={0.01}
        position={[0, 0.43, wallZ + frameD + (d - frameD) / 2]}
        material={materials.enamel}
      />
    </group>
  )
}
