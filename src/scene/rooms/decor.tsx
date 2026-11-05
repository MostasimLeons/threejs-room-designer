import { useLayoutEffect, useRef, type ComponentType } from 'react'
import * as THREE from 'three'
import { ROOM } from '../roomConfig'
import { KITCHEN_UNIT_DEPTH, ROOMS, type Opening, type RoomId, type WallSide } from '../house'
import { useRoomInfo } from '../roomContext'
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

/**
 * How much the room has been resized compared with its standard size (1 = standard),
 * so decor keeps its place: a rug stays under the sofa area, shrinking with a smaller room.
 */
function useResize(room: RoomId) {
  const info = useRoomInfo()
  const base = ROOMS[room]
  return { info, sx: info.width / base.width, sz: info.depth / base.depth }
}

/**
 * Free stretches of a wall between its openings, as [from, to] along the wall (room
 * coordinates). `margin` keeps clear of each opening (e.g. for curtains).
 */
function freeStretches(length: number, openings: Opening[], margin: number): [number, number][] {
  const runs: [number, number][] = []
  let x = -length / 2
  for (const o of openings.toSorted((a, b) => a.at - b.at)) {
    const from = o.at - o.width / 2 - margin
    if (from > x) runs.push([x, from])
    x = Math.max(x, o.at + o.width / 2 + margin)
  }
  if (length / 2 > x) runs.push([x, length / 2])
  return runs
}

// ---------- Living Room ----------

function LivingRug() {
  // Under the seating area; smaller in a smaller room (never bigger than the standard 3 × 2.2 m).
  const { sx, sz } = useResize('living')
  const w = 3.0 * Math.min(1, sx)
  const d = 2.2 * Math.min(1, sz)
  return (
    <group position={[0.2 * sx, 0, -1.15 * sz]}>
      <mesh position={[0, 0.004, 0]} material={materials.rugBorder} receiveShadow>
        <boxGeometry args={[w, 0.008, d]} />
      </mesh>
      <mesh position={[0, 0.0045, 0]} material={materials.rug} receiveShadow>
        <boxGeometry args={[w - 0.16, 0.009, d - 0.16]} />
      </mesh>
    </group>
  )
}

// ---------- Bedroom ----------

function BedroomCarpet() {
  const { sx, sz } = useResize('bedroom')
  const w = 3.2 * Math.min(1, sx)
  const d = 2.5 * Math.min(1, sz)
  return (
    <group position={[-0.35 * sx, 0, -0.35 * sz]}>
      <mesh position={[0, 0.005, 0]} material={materials.carpetBorder} receiveShadow>
        <boxGeometry args={[w, 0.01, d]} />
      </mesh>
      <mesh position={[0, 0.0055, 0]} material={materials.carpet} receiveShadow>
        <boxGeometry args={[w - 0.14, 0.011, d - 0.14]} />
      </mesh>
    </group>
  )
}

/**
 * Vertical natural-oak slats on a dark backing, behind the bed. One InstancedMesh =
 * one draw call for all slats. Up to 3 m wide, centred behind the bed and kept clear
 * of any window or door on the back wall (and its curtains); left out if there's no room.
 */
function SlatAccentWall() {
  const { info, sx } = useResize('bedroom')
  const backFace = -info.depth / 2
  const centre = -0.35 * sx // behind the bed
  const stretch =
    freeStretches(info.width, info.openings.back ?? [], 0.35).find(([a, b]) => a <= centre && centre <= b) ??
    freeStretches(info.width, info.openings.back ?? [], 0.35).toSorted((a, b) => b[1] - b[0] - (a[1] - a[0]))[0]
  const [runFrom, runTo] = stretch ?? [0, 0]
  const half = Math.min(1.5, (runTo - runFrom - 0.1) / 2)
  const mid = Math.min(Math.max(centre, runFrom + half + 0.05), runTo - half - 0.05)
  const from = mid - half
  const to = mid + half
  const height = Math.min(2.6, info.height - 0.2)
  const slatW = 0.035
  const pitch = 0.06
  const count = Math.max(0, Math.floor((to - from) / pitch))
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
  }, [count, from, backFace, height])

  if (count < 10) return null
  return (
    <group>
      <Block
        size={[to - from, height, 0.015]}
        position={[(from + to) / 2, height / 2, backFace + 0.0075]}
        material={materials.slatBacking}
      />
      {/* key: a different number of slats needs a new InstancedMesh */}
      <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]} material={materials.woodLight} castShadow receiveShadow>
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
function CurtainPanel({ fromX, toX, z, height }: { fromX: number; toX: number; z: number; height: number }) {
  const pleats = Math.max(3, Math.round((toX - fromX) / 0.055))
  const step = (toX - fromX) / pleats
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
  /** Ceiling height: the rod hangs just below it. */
  ceiling?: number
}

/**
 * A brass rod with two cream curtains drawn to the sides, in the wall's local
 * frame (+z points into the room; see walls.ts).
 */
export function Curtains({ left, right, wallHalf, ceiling = ROOM.height }: CurtainsProps) {
  const rodY = Math.min(2.52, ceiling - 0.08)
  const z = T / 2 + 0.2 // in front of the window sill
  const rodLeft = Math.max(left - 0.33, -wallHalf + 0.02)
  const rodRight = Math.min(right + 0.33, wallHalf - 0.02)
  return (
    <group>
      <Cylinder
        radiusTop={0.013}
        height={rodRight - rodLeft}
        rotation={[0, 0, Math.PI / 2]}
        position={[(rodLeft + rodRight) / 2, rodY, z]}
        material={materials.brass}
      />
      <CurtainPanel fromX={rodLeft + 0.02} toX={left + 0.1} z={z} height={rodY - 0.08} />
      <CurtainPanel fromX={right - 0.1} toX={rodRight - 0.02} z={z} height={rodY - 0.08} />
    </group>
  )
}

// ---------- Dining Room ----------

const pendantShade = new THREE.MeshStandardMaterial({ color: '#1f1f22', roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide })

/** Black cone pendant hanging over the table's starting position, with a glowing bulb. */
function DiningPendant() {
  const { info, sz } = useResize('dining')
  const top = info.height
  const shadeY = 1.6
  return (
    <group position={[0, 0, -0.1 * sz]}>
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

/** Positions of the seams between wall-unit doors (about 46 cm wide) on a run from `from` to `to`. */
function seams(from: number, to: number) {
  const n = Math.max(1, Math.round((to - from) / 0.46))
  return Array.from({ length: n - 1 }, (_, i) => from + ((to - from) * (i + 1)) / n)
}

/**
 * Built-in kitchen along the whole back wall: base units with a stone worktop, the
 * sink under the back-wall window (if there is one), a hob with an extractor, a
 * glossy splashback and wall units beside the window(s), with a light strip under
 * the first wall unit. Everything is worked out from the wall's width and openings,
 * so it follows the layout editor.
 */
function KitchenUnits() {
  const info = useRoomInfo()
  const W = info.width
  const back = -info.depth / 2
  const D = KITCHEN_UNIT_DEPTH
  const front = back + D - 0.04
  const doors = Math.max(2, Math.round(W / 0.67))
  const doorW = W / doors
  const openings = info.openings.back ?? []
  const backWindow = openings.find((o) => o.kind === 'window')
  const clampX = (x: number, half: number) => Math.min(Math.max(x, -W / 2 + half), W / 2 - half)
  const sinkX = clampX(backWindow ? backWindow.at : W / 4, 0.4)
  // The hob 1.6 m to the left of the sink, or to its right if that's off the end.
  const hobX = sinkX - 1.6 >= -W / 2 + 0.4 ? sinkX - 1.6 : clampX(sinkX + 1.3, 0.4)
  // Wall units and splashback: the back wall minus its openings (5 cm clear of each).
  const runs = freeStretches(W, openings, 0.05).filter(([a, b]) => b - a >= 0.35)
  const lit = runs.toSorted((a, b) => b[1] - b[0] - (a[1] - a[0]))[0]

  return (
    <group>
      {/* Base units */}
      <Block size={[W, 0.1, D - 0.08]} position={[0, 0.05, back + (D - 0.08) / 2]} material={materials.slatBacking} />
      <Block size={[W, 0.78, D - 0.04]} position={[0, 0.49, back + (D - 0.04) / 2]} material={materials.creamLacquer} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -W / 2 + doorW * (i + 0.5)
        return (
          <group key={i}>
            {i > 0 && (
              <Block size={[0.005, 0.76, 0.004]} position={[x - doorW / 2, 0.49, front + 0.002]} material={materials.slatBacking} />
            )}
            <Block size={[doorW * 0.4, 0.012, 0.016]} position={[x, 0.8, front + 0.01]} material={materials.metalBlack} />
          </group>
        )
      })}
      <Block size={[W, 0.04, D]} position={[0, 0.9, back + D / 2]} material={materials.stone} />

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

      {/* Splashback on the free wall, and a strip under each window that sits above the worktop */}
      {runs.map(([a, b]) => (
        <Block key={`s${a}`} size={[b - a, 0.53, 0.01]} position={[(a + b) / 2, 1.185, back + 0.005]} material={materials.splashback} />
      ))}
      {openings
        .filter((o) => o.kind === 'window' && o.bottom > 0.95)
        .map((o) => (
          <Block
            key={`u${o.at}`}
            size={[o.width, o.bottom - 0.92, 0.01]}
            position={[o.at, (0.92 + o.bottom) / 2, back + 0.005]}
            material={materials.splashback}
          />
        ))}

      {/* Wall units on the free wall, with seams */}
      {runs.map(([a, b]) => (
        <group key={`w${a}`}>
          <Block size={[b - a, 0.7, 0.34]} position={[(a + b) / 2, 1.85, back + 0.17]} material={materials.creamLacquer} />
          {seams(a, b).map((x) => (
            <Block key={x} size={[0.005, 0.68, 0.004]} position={[x, 1.85, back + 0.342]} material={materials.slatBacking} />
          ))}
        </group>
      ))}
      {/* Light strip under the longest wall unit: lights the worktop and glows */}
      {lit && (
        <mesh position={[(lit[0] + lit[1]) / 2, 1.495, back + 0.3]} material={materials.coveLight}>
          <boxGeometry args={[lit[1] - lit[0] - 0.15, 0.01, 0.02]} />
        </mesh>
      )}
    </group>
  )
}

// ---------- Bathroom ----------

/** Wall-hung toilet in front of a concealed cistern, with a chrome flush plate. */
function Toilet() {
  // Where the toilet's zone is for this room size (toiletZones in house.ts), so the two always agree.
  const zone = useRoomInfo().fixedZones.find((z) => z.label === 'toilet')
  if (!zone) return null
  const [x, z] = zone.position
  const [w, d] = zone.size
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
