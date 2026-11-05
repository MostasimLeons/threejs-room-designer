import { materials } from '../materials'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { getVariant } from './catalog'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Smaller seating added in Phase 10: ottoman, desk chair and bench.
 * Each faces +z (its front) and the colour is the upholstery.
 */

/** "pouf": round knitted pouf. "leather": footstool on wooden legs (stand-in while its real model loads). */
export function Ottoman({ color, variant }: ModelProps) {
  const fabric = useTintedMaterial(materials.fabricSand, color)
  if (variant === 'leather') {
    const [w, d] = getVariant('ottoman', 'leather').footprint
    return (
      <group>
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz], i) => (
          <Cylinder
            key={i}
            radiusTop={0.02}
            radiusBottom={0.015}
            height={0.1}
            position={[sx * (w / 2 - 0.07), 0.05, sz * (d / 2 - 0.07)]}
            material={materials.woodDark}
          />
        ))}
        <Block size={[w, 0.3, d]} radius={0.05} position={[0, 0.25, 0]} material={materials.leather} />
      </group>
    )
  }
  return (
    <group>
      <Cylinder radiusTop={0.26} radiusBottom={0.275} height={0.38} segments={40} position={[0, 0.19, 0]} material={fabric} />
      {/* Slightly domed, softer top */}
      <mesh position={[0, 0.38, 0]} scale={[1, 0.18, 1]} material={fabric} castShadow receiveShadow>
        <sphereGeometry args={[0.26, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  )
}

const DESK_SEAT_Y = 0.48

/** "task": swivel office chair on five castors. "side": upholstered side chair on oak legs. */
export function DeskChair({ color, variant, frame }: ModelProps) {
  const metal = frameMaterial(frame, materials.metalBlack)
  const legs = frameMaterial(frame, materials.woodLight)
  const fabric = useTintedMaterial(materials.fabricWhite, color)

  if (variant === 'side') {
    return (
      <group>
        {[
          [-0.2, -0.2],
          [0.2, -0.2],
          [-0.2, 0.2],
          [0.2, 0.2],
        ].map(([x, z], i) => (
          <Cylinder
            key={i}
            radiusTop={0.02}
            radiusBottom={0.014}
            height={DESK_SEAT_Y - 0.04}
            position={[x, (DESK_SEAT_Y - 0.04) / 2, z]}
            material={legs}
          />
        ))}
        <Block size={[0.5, 0.09, 0.5]} radius={0.035} position={[0, DESK_SEAT_Y, 0.01]} material={fabric} />
        <Block
          size={[0.48, 0.42, 0.08]}
          radius={0.04}
          position={[0, DESK_SEAT_Y + 0.26, -0.22]}
          rotation={[-0.1, 0, 0]}
          material={fabric}
        />
      </group>
    )
  }

  // Swivel chair: star base, gas column, seat and a tall back on a curved support.
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Block size={[0.04, 0.03, 0.28]} position={[0, 0.07, 0.14]} material={metal} />
            <mesh position={[0, 0.03, 0.27]} material={metal} castShadow>
              <sphereGeometry args={[0.03, 10, 8]} />
            </mesh>
          </group>
        )
      })}
      <Cylinder radiusTop={0.025} height={0.33} position={[0, 0.25, 0]} material={frame ? metal : materials.chrome} />
      <Block size={[0.5, 0.08, 0.48]} radius={0.035} position={[0, DESK_SEAT_Y, 0.02]} material={fabric} />
      <Block size={[0.06, 0.32, 0.04]} position={[0, DESK_SEAT_Y + 0.12, -0.24]} material={metal} />
      <Block size={[0.46, 0.5, 0.07]} radius={0.04} position={[0, DESK_SEAT_Y + 0.42, -0.26]} rotation={[-0.12, 0, 0]} material={fabric} />
      {/* Armrests */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[0.03, 0.2, 0.03]} position={[s * 0.24, DESK_SEAT_Y + 0.1, -0.02]} material={metal} />
          <Block size={[0.06, 0.03, 0.26]} radius={0.01} position={[s * 0.24, DESK_SEAT_Y + 0.21, 0.0]} material={metal} />
        </group>
      ))}
    </group>
  )
}

/** "upholstered": padded bench on an oak frame (bed-end or dining). "wood": solid oak bench on slab legs. */
export function Bench({ color, variant, frame }: ModelProps) {
  const legs = frameMaterial(frame, materials.woodLight)
  // Both are made every time (hooks must run in the same order whichever style is chosen).
  const fabric = useTintedMaterial(materials.creamUpholstery, color)
  const wood = useTintedMaterial(materials.woodLight, color)
  const [w, d] = getVariant('bench', variant).footprint

  if (variant === 'wood') {
    return (
      <group>
        <Block size={[w, 0.05, d]} radius={0.01} position={[0, 0.43, 0]} material={wood} />
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.05, 0.41, d - 0.04]} position={[s * (w / 2 - 0.12), 0.205, 0]} material={wood} />
        ))}
      </group>
    )
  }
  return (
    <group>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Block key={i} size={[0.04, 0.34, 0.04]} position={[sx * (w / 2 - 0.05), 0.17, sz * (d / 2 - 0.05)]} material={legs} />
      ))}
      <Block size={[w, 0.04, d]} position={[0, 0.34, 0]} material={legs} />
      <Block size={[w - 0.02, 0.1, d - 0.02]} radius={0.035} position={[0, 0.41, 0]} material={fabric} />
    </group>
  )
}
