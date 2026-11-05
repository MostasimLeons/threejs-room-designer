import { materials } from '../materials'
import { Block } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

/**
 * Tall sliding-door wardrobe: natural oak cabinet with cream lacquered doors on two
 * tracks (alternate doors sit slightly forward, like real sliding doors) and long brass pulls.
 * 2-door = 200 cm, 3-door = 270 cm. Faces +z.
 */
export function Wardrobe({ color, variant }: ModelProps) {
  const doorMaterial = useTintedMaterial(materials.creamLacquer, color)
  const [width, depth] = useFootprint('wardrobe', variant)
  const height = 2.3
  const plinth = 0.07
  const doors = variant === '3-door' ? 3 : 2
  const doorW = (width - 0.06) / doors + 0.03 // overlap a little, like sliding doors
  const doorH = height - plinth - 0.08
  const front = depth / 2

  return (
    <group>
      <Block size={[width - 0.06, plinth, depth - 0.06]} position={[0, plinth / 2, -0.02]} material={materials.slatBacking} />
      {/* Oak carcass */}
      <Block
        size={[width, height - plinth, depth - 0.05]}
        position={[0, plinth + (height - plinth) / 2, -0.025]}
        material={materials.woodLight}
      />

      {Array.from({ length: doors }, (_, i) => {
        const x = -(width - 0.06) / 2 + (doorW - 0.03) * i + doorW / 2
        const z = front - 0.015 + (i % 2 ? 0.02 : 0)
        // Pull on the edge that meets the next door
        const pullX = i < doors - 1 ? doorW / 2 - 0.06 : -doorW / 2 + 0.06
        return (
          <group key={i} position={[x, plinth + 0.04 + doorH / 2, z]}>
            <Block size={[doorW, doorH, 0.022]} material={doorMaterial} />
            <Block size={[0.014, 0.6, 0.02]} position={[pullX, 0.05, 0.02]} material={materials.brass} />
          </group>
        )
      })}

      {/* Top track */}
      <Block size={[width - 0.04, 0.03, 0.06]} position={[0, height - 0.025, front - 0.02]} material={materials.woodLight} />
    </group>
  )
}
