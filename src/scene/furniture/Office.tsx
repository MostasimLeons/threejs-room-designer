import { materials } from '../materials'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

/**
 * Office furniture (Phase 16): the office desk and the office chair. Both face +z,
 * so you sit on the +z side of the desk and the chair's back is at its -z side
 * when it's turned to face away from you. The desk is built from its footprint,
 * so a custom width or depth keeps the frame the same thickness.
 */

const DESK_H = 0.75
const TOP = 0.025

/**
 * "straight" / "compact": a wood top on a steel sled frame (a closed rectangle at
 * each end) with a cable tray underneath. "standing": a sit-stand desk on two
 * telescopic columns with T feet and a small control panel. Colour = the top.
 */
export function OfficeDesk({ color, variant, frame }: ModelProps) {
  const steel = frameMaterial(frame, materials.metalBlack)
  const top = useTintedMaterial(materials.woodLight, color)
  const [w, d] = useFootprint('officeDesk', variant)
  const legX = w / 2 - 0.08
  const frameY = DESK_H - TOP
  return (
    <group>
      <Block size={[w, TOP, d]} radius={0.006} position={[0, DESK_H - TOP / 2, 0]} material={top} />
      {/* Rails under the top, front and back */}
      {[-1, 1].map((sz) => (
        <Block key={sz} size={[w - 0.12, 0.05, 0.03]} position={[0, frameY - 0.025, sz * (d / 2 - 0.08)]} material={steel} />
      ))}
      {/* Cable tray at the back */}
      <Block size={[w * 0.6, 0.015, 0.12]} position={[0, frameY - 0.1, -d / 2 + 0.14]} material={steel} />
      {variant === 'standing'
        ? [-1, 1].map((sx) => (
            <group key={sx} position={[sx * legX, 0, 0]}>
              {/* Two-stage column: wider below, narrower above */}
              <Block size={[0.08, 0.38, 0.06]} position={[0, 0.03 + 0.19, 0]} material={steel} />
              <Block size={[0.065, frameY - 0.4, 0.05]} position={[0, 0.4 + (frameY - 0.4) / 2, 0]} material={steel} />
              <Block size={[0.07, 0.03, d - 0.08]} radius={0.01} position={[0, 0.015, 0]} material={steel} />
              <Block size={[0.06, 0.04, 0.08]} position={[0, frameY - 0.03, 0]} material={steel} />
            </group>
          ))
        : [-1, 1].map((sx) => (
            <group key={sx} position={[sx * legX, 0, 0]}>
              {[-1, 1].map((sz) => (
                <Block
                  key={sz}
                  size={[0.04, frameY - 0.02, 0.04]}
                  position={[0, (frameY - 0.02) / 2, sz * (d / 2 - 0.06)]}
                  material={steel}
                />
              ))}
              <Block size={[0.04, 0.03, d - 0.08]} position={[0, 0.015, 0]} material={steel} />
              <Block size={[0.04, 0.04, d - 0.08]} position={[0, frameY - 0.02, 0]} material={steel} />
            </group>
          ))}
      {variant === 'standing' && (
        // Up / down buttons under the front edge, on the right.
        <Block
          size={[0.12, 0.02, 0.05]}
          radius={0.005}
          position={[w / 2 - 0.25, DESK_H - TOP - 0.01, d / 2 - 0.03]}
          material={materials.metalBlack}
        />
      )}
    </group>
  )
}

const SEAT_Y = 0.48

/**
 * Swivel office chair: five-star base on castors, gas column, padded seat, a mesh
 * back on a curved support and armrests. "ergonomic" adds a lumbar pad and a
 * headrest. Colour = the seat and back.
 */
export function OfficeChair({ color, variant, frame }: ModelProps) {
  const base = frameMaterial(frame, materials.metalBlack)
  const fabric = useTintedMaterial(materials.fabricSand, color)
  const ergonomic = variant !== 'task'
  const reach = ergonomic ? 0.31 : 0.27
  const backTop = ergonomic ? 0.95 : 0.88
  const backH = backTop - (SEAT_Y + 0.12)
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
          <Block size={[0.045, 0.03, reach]} position={[0, 0.075, reach / 2]} material={base} />
          <mesh position={[0, 0.03, reach]} material={materials.metalBlack} castShadow>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
        </group>
      ))}
      <Cylinder radiusTop={0.028} height={SEAT_Y - 0.12} position={[0, 0.06 + (SEAT_Y - 0.12) / 2, 0]} material={materials.chrome} />
      <Block size={[0.5, 0.08, 0.48]} radius={0.035} position={[0, SEAT_Y, 0.02]} material={fabric} />
      {/* Back support and mesh back */}
      <Block size={[0.06, 0.3, 0.04]} position={[0, SEAT_Y + 0.1, -0.24]} material={base} />
      <Block
        size={[0.46, backH, 0.05]}
        radius={0.04}
        position={[0, SEAT_Y + 0.12 + backH / 2, -0.27]}
        rotation={[-0.1, 0, 0]}
        material={fabric}
      />
      {ergonomic && (
        <>
          <Block size={[0.36, 0.08, 0.04]} radius={0.02} position={[0, SEAT_Y + 0.22, -0.23]} material={materials.metalBlack} />
          <Block size={[0.04, 0.14, 0.03]} position={[0, backTop + 0.05, -0.31]} material={base} />
          <Block size={[0.3, 0.12, 0.05]} radius={0.03} position={[0, backTop + 0.17, -0.31]} rotation={[-0.15, 0, 0]} material={fabric} />
        </>
      )}
      {/* Armrests */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[0.03, 0.2, 0.03]} position={[s * 0.25, SEAT_Y + 0.1, -0.04]} material={base} />
          <Block size={[0.07, 0.03, 0.25]} radius={0.012} position={[s * 0.25, SEAT_Y + 0.21, -0.02]} material={materials.metalBlack} />
        </group>
      ))}
    </group>
  )
}
