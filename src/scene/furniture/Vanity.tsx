import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

const CABINET_BOTTOM = 0.3 // wall-hung, floor visible underneath
const CABINET_H = 0.5
const TOP_Y = CABINET_BOTTOM + CABINET_H

/**
 * Wall-hung vanity unit: a wooden cabinet, stone counter, round vessel basin(s)
 * with chrome taps, and a mirror with a glowing light strip above each basin.
 * Its back (-z) goes against the wall; it faces +z.
 */
export function Vanity({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const [width, depth] = useFootprint('vanity', variant)
  const basins = variant === 'double' ? [-0.3, 0.3] : [0]
  const backZ = -depth / 2

  return (
    <group>
      <Block size={[width, CABINET_H, depth - 0.02]} radius={0.01} position={[0, CABINET_BOTTOM + CABINET_H / 2, 0.01]} material={wood} />
      {/* Handle-less drawer: a shadow gap under the counter */}
      <Block size={[width - 0.04, 0.012, 0.004]} position={[0, TOP_Y - 0.06, depth / 2 + 0.001]} material={materials.slatBacking} />
      <Block size={[width + 0.02, 0.03, depth]} radius={0.005} position={[0, TOP_Y + 0.015, 0]} material={materials.stone} />

      {basins.map((x) => (
        <group key={x} position={[x, TOP_Y + 0.03, 0.03]}>
          <Cylinder radiusTop={0.19} radiusBottom={0.14} height={0.13} position={[0, 0.065, 0]} segments={36} material={materials.enamel} />
          <Cylinder radiusTop={0.165} height={0.006} position={[0, 0.128, 0]} segments={36} material={materials.screen} />
          {/* Tap rising from the counter behind the basin */}
          <Cylinder radiusTop={0.012} height={0.26} position={[0, 0.13, -0.22]} material={materials.chrome} />
          <Block size={[0.025, 0.02, 0.12]} radius={0.008} position={[0, 0.25, -0.17]} material={materials.chrome} />

          {/* Mirror on the wall above, with a light strip */}
          <group position={[0, 0, backZ - 0.02]}>
            <Block size={[0.5, 0.75, 0.02]} radius={0.008} position={[0, 0.85, 0]} material={materials.mirror} />
            <mesh position={[0, 1.27, 0.03]} material={materials.coveLight}>
              <boxGeometry args={[0.42, 0.02, 0.02]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}
