import { materials } from '../materials'
import { Block } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

const HEIGHT = 1.85

/**
 * Fridge, front facing +z. "single" is a fridge over a freezer drawer;
 * "double" is an American-style side-by-side. The colour is the finish:
 * the steel material is tinted, so it stays metallic in any colour.
 */
export function Fridge({ color, variant }: ModelProps) {
  const finish = useTintedMaterial(materials.steel, color)
  const [width, depth] = useFootprint('fridge', variant)
  const front = depth / 2
  const double = variant === 'double'

  return (
    <group>
      <Block size={[width, HEIGHT, depth]} radius={0.02} position={[0, HEIGHT / 2 + 0.02, 0]} material={finish} />
      {/* Small feet */}
      <Block size={[width - 0.08, 0.02, depth - 0.1]} position={[0, 0.01, 0]} material={materials.metalBlack} />

      {double ? (
        <>
          {/* Gap between the two doors, and a handle each side of it */}
          <Block size={[0.006, HEIGHT - 0.04, 0.004]} position={[0, HEIGHT / 2 + 0.02, front + 0.001]} material={materials.slatBacking} />
          {[-0.05, 0.05].map((x) => (
            <Block key={x} size={[0.02, 0.9, 0.03]} position={[x, 1.1, front + 0.02]} material={materials.metalBlack} />
          ))}
          {/* Water and ice dispenser */}
          <Block size={[0.18, 0.26, 0.012]} position={[-0.22, 1.25, front + 0.004]} material={materials.screen} />
        </>
      ) : (
        <>
          <Block size={[width - 0.02, 0.006, 0.004]} position={[0, 0.66, front + 0.001]} material={materials.slatBacking} />
          <Block size={[0.02, 0.55, 0.03]} position={[width / 2 - 0.07, 1.05, front + 0.02]} material={materials.metalBlack} />
          <Block size={[width * 0.5, 0.02, 0.03]} position={[0, 0.58, front + 0.02]} material={materials.metalBlack} />
        </>
      )}
    </group>
  )
}
