import { materials } from '../materials'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { getVariant } from './catalog'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Pieces that go under a desk (Phase 15): a drawer unit and a PC tower. Both face
 * +z (their front) and are built at their option's size; a custom size scales them.
 */

/** "castors": three drawers on castors (rolls under a desk). "desk-height": a fixed pedestal with a file drawer. Colour = the body. */
export function DrawerUnit({ color, variant, frame }: ModelProps) {
  const handles = frameMaterial(frame, materials.metalBlack)
  const body = useTintedMaterial(materials.woodLight, color)
  const [w, d] = getVariant('drawerUnit', variant).footprint
  const onCastors = variant !== 'desk-height'
  const lift = onCastors ? 0.05 : 0.01
  const height = (onCastors ? 0.58 : 0.72) - lift
  // Drawer fronts from the top: two shallow ones and a deep (file) one.
  const fronts = onCastors ? [0.13, 0.13, 0.24] : [0.13, 0.13, 0.13, 0.27]
  const gap = 0.01
  let top = lift + height - 0.015
  return (
    <group>
      {onCastors &&
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz], i) => (
          <group key={i} position={[sx * (w / 2 - 0.05), 0.025, sz * (d / 2 - 0.05)]}>
            <Cylinder radiusTop={0.025} height={0.02} rotation={[0, 0, Math.PI / 2]} material={materials.metalBlack} />
            <Block size={[0.03, 0.02, 0.03]} position={[0, 0.02, 0]} material={materials.metalBlack} />
          </group>
        ))}
      <Block size={[w, height, d]} radius={0.006} position={[0, lift + height / 2, 0]} material={body} />
      {fronts.map((h) => {
        const y = top - h / 2
        top -= h + gap
        return (
          <group key={y}>
            <Block size={[w - 0.03, h, 0.012]} radius={0.003} position={[0, y, d / 2 + 0.004]} material={body} />
            <Block size={[0.12, 0.012, 0.018]} position={[0, y + h / 2 - 0.035, d / 2 + 0.014]} material={handles} />
          </group>
        )
      })}
    </group>
  )
}

/** Mid tower or small PC: a case with a glass side, front lights and feet. Colour = the case. */
export function PcTower({ color, variant }: ModelProps) {
  const body = useTintedMaterial(materials.metalBlack, color)
  const [w, d] = getVariant('pcTower', variant).footprint
  const height = variant === 'mini' ? 0.34 : 0.46
  const feet = 0.015
  const h = height - feet
  return (
    <group>
      {[-1, 1].map((sz) => (
        <Block key={sz} size={[w - 0.02, feet, 0.04]} position={[0, feet / 2, sz * (d / 2 - 0.05)]} material={materials.metalBlack} />
      ))}
      <Block size={[w, h, d]} radius={0.008} position={[0, feet + h / 2, 0]} material={body} />
      {/* Tinted glass side panel, with the glow of the parts inside */}
      <Block size={[0.004, h - 0.06, d - 0.08]} position={[w / 2 + 0.002, feet + h / 2, 0]} material={materials.glass} />
      <Block size={[0.002, h * 0.35, d * 0.5]} position={[w / 2 - 0.01, feet + h * 0.6, -0.02]} material={materials.screen} />
      {/* Front: a light strip and the power button */}
      <Block size={[0.006, h - 0.1, 0.004]} position={[0, feet + h / 2, d / 2 + 0.002]} material={materials.coveLight} />
      <Cylinder
        radiusTop={0.008}
        height={0.004}
        rotation={[Math.PI / 2, 0, 0]}
        position={[w / 2 - 0.035, feet + h - 0.03, d / 2 + 0.002]}
        material={materials.chrome}
      />
    </group>
  )
}
