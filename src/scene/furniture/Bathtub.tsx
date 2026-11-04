import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * "freestanding": a bath on four small feet. The outside takes the colour, the
 * inside is white enamel. Built as a rounded shell (four sides and a floor)
 * so it really is hollow.
 * "shower": a low tray with a glass screen, a ceiling-height chrome riser and a
 * rain head. The colour is the tray.
 */
export function Bathtub({ color, variant }: ModelProps) {
  const outside = useTintedMaterial(materials.enamel, color)
  return variant === 'shower' ? <Shower tray={outside} /> : <FreestandingBath outside={outside} />
}

function FreestandingBath({ outside }: { outside: typeof materials.enamel }) {
  const L = 1.7
  const W = 0.78
  const H = 0.58
  const wall = 0.06
  const base = 0.08 // the shell sits on feet this high
  const inner = materials.enamel
  return (
    <group>
      {/* Feet */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Cylinder
          key={i}
          radiusTop={0.03}
          radiusBottom={0.02}
          height={base}
          position={[sx * (L / 2 - 0.2), base / 2, sz * (W / 2 - 0.12)]}
          material={materials.chrome}
        />
      ))}

      <group position={[0, base, 0]}>
        {/* Outer shell: long sides, ends and floor */}
        <Block size={[L, H, wall]} radius={0.025} position={[0, H / 2, -W / 2 + wall / 2]} material={outside} />
        <Block size={[L, H, wall]} radius={0.025} position={[0, H / 2, W / 2 - wall / 2]} material={outside} />
        <Block size={[wall, H, W]} radius={0.025} position={[-L / 2 + wall / 2, H / 2, 0]} material={outside} />
        <Block size={[wall, H, W]} radius={0.025} position={[L / 2 - wall / 2, H / 2, 0]} material={outside} />
        <Block size={[L - 0.04, 0.05, W - 0.04]} radius={0.02} position={[0, 0.025, 0]} material={outside} />
        {/* White enamel lining on the inside faces and floor */}
        <Block size={[L - 2 * wall, H - 0.06, 0.004]} position={[0, H / 2 + 0.02, -W / 2 + wall + 0.002]} material={inner} />
        <Block size={[L - 2 * wall, H - 0.06, 0.004]} position={[0, H / 2 + 0.02, W / 2 - wall - 0.002]} material={inner} />
        <Block size={[0.004, H - 0.06, W - 2 * wall]} position={[-L / 2 + wall + 0.002, H / 2 + 0.02, 0]} material={inner} />
        <Block size={[0.004, H - 0.06, W - 2 * wall]} position={[L / 2 - wall - 0.002, H / 2 + 0.02, 0]} material={inner} />
        <Block size={[L - 2 * wall, 0.004, W - 2 * wall]} position={[0, 0.052, 0]} material={inner} />
        {/* Deck-mounted mixer tap on the right-hand rim, spout over the water */}
        <group position={[L / 2 - wall / 2, H, 0]}>
          <Cylinder radiusTop={0.016} height={0.2} position={[0, 0.1, 0]} material={materials.chrome} />
          <Block size={[0.16, 0.022, 0.022]} radius={0.008} position={[-0.07, 0.19, 0]} material={materials.chrome} />
        </group>
      </group>
    </group>
  )
}

function Shower({ tray }: { tray: typeof materials.enamel }) {
  const L = 1.2
  const W = 0.8
  return (
    <group>
      <Block size={[L, 0.05, W]} radius={0.01} position={[0, 0.025, 0]} material={tray} />
      {/* Linear drain */}
      <Block size={[0.6, 0.004, 0.04]} position={[0, 0.052, W / 2 - 0.12]} material={materials.chrome} />
      {/* Fixed glass panel along the front, leaving a walk-in gap at the left */}
      <Block size={[0.9, 1.95, 0.01]} position={[0.15, 0.05 + 1.95 / 2, W / 2 - 0.01]} material={materials.glass} />
      <Block size={[0.9, 0.02, 0.02]} position={[0.15, 2.01, W / 2 - 0.01]} material={materials.chrome} />
      {/* Riser rail, rain head and arm at the back */}
      <Cylinder radiusTop={0.012} height={1.9} position={[0.35, 1.0, -W / 2 + 0.05]} material={materials.chrome} />
      <Block size={[0.03, 0.03, 0.25]} position={[0.35, 1.97, -W / 2 + 0.17]} material={materials.chrome} />
      <Cylinder radiusTop={0.12} height={0.015} position={[0.35, 1.95, -W / 2 + 0.3]} segments={32} material={materials.chrome} />
      <Block size={[0.12, 0.06, 0.04]} radius={0.01} position={[0.35, 1.05, -W / 2 + 0.03]} material={materials.chrome} />
    </group>
  )
}
