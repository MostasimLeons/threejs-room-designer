import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useFootprint } from './footprintContext'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

const TOP_Y = 0.75 // table height

/** Dining table: a rectangle for six or a long one for eight on tapered legs, or a round table on a pedestal. */
export function DiningTable({ color, variant, bare }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)

  // Before the early return below: hooks must run every time.
  const [w, d] = useFootprint('diningTable', variant)
  if (variant === 'round') {
    return (
      <group>
        <Cylinder radiusTop={0.6} height={0.04} position={[0, TOP_Y - 0.02, 0]} segments={56} material={wood} />
        <Cylinder radiusTop={0.07} radiusBottom={0.09} height={TOP_Y - 0.08} position={[0, (TOP_Y - 0.04) / 2 + 0.02, 0]} material={wood} />
        <Cylinder radiusTop={0.26} radiusBottom={0.3} height={0.04} position={[0, 0.02, 0]} segments={40} material={wood} />
        {/* A bowl in the middle (not when something else stands there) */}
        {!bare && (
          <Cylinder
            radiusTop={0.13}
            radiusBottom={0.07}
            height={0.07}
            position={[0, TOP_Y + 0.035, 0]}
            segments={28}
            material={materials.ceramic}
          />
        )}
      </group>
    )
  }

  const legX = w / 2 - 0.1
  const legZ = d / 2 - 0.09
  return (
    <group>
      <Block size={[w, 0.04, d]} radius={0.012} position={[0, TOP_Y - 0.02, 0]} material={wood} />
      {/* Apron under the top, set in from the edge */}
      <Block size={[w - 0.2, 0.08, d - 0.18]} position={[0, TOP_Y - 0.08, 0]} material={wood} />
      {[
        [-legX, -legZ],
        [legX, -legZ],
        [-legX, legZ],
        [legX, legZ],
      ].map(([x, z], i) => (
        <Cylinder
          key={i}
          radiusTop={0.032}
          radiusBottom={0.022}
          height={TOP_Y - 0.04}
          position={[x, (TOP_Y - 0.04) / 2, z]}
          material={wood}
        />
      ))}
      {!bare && (
        <>
          {/* Runner and two vases */}
          <Block size={[w * 0.6, 0.004, 0.32]} position={[0, TOP_Y + 0.002, 0]} material={materials.linen} />
          <Cylinder radiusTop={0.04} radiusBottom={0.055} height={0.22} position={[-0.18, TOP_Y + 0.11, 0]} material={materials.ceramic} />
          <Cylinder
            radiusTop={0.035}
            radiusBottom={0.045}
            height={0.14}
            position={[0.12, TOP_Y + 0.07, 0.04]}
            material={materials.terracotta}
          />
        </>
      )}
    </group>
  )
}
