import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/** Coffee table (rectangular or round) with a lower shelf, books and a small vase. */
export function CoffeeTable({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const round = variant === 'round'
  const legs: [number, number][] = round
    ? [
        [-0.25, -0.25],
        [0.25, -0.25],
        [-0.25, 0.25],
        [0.25, 0.25],
      ]
    : [
        [-0.52, -0.24],
        [0.52, -0.24],
        [-0.52, 0.24],
        [0.52, 0.24],
      ]
  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder key={i} radiusTop={0.025} height={0.38} position={[x, 0.19, z]} material={wood} />
      ))}
      {round ? (
        <>
          <Cylinder radiusTop={0.45} height={0.05} position={[0, 0.405, 0]} segments={48} material={wood} />
          <Cylinder radiusTop={0.37} height={0.025} position={[0, 0.12, 0]} segments={48} material={wood} />
        </>
      ) : (
        <>
          <Block size={[1.2, 0.05, 0.6]} radius={0.02} position={[0, 0.405, 0]} material={wood} />
          <Block size={[1.06, 0.025, 0.5]} position={[0, 0.12, 0]} material={wood} />
        </>
      )}

      {/* Decoration: two books and a vase */}
      <group position={[round ? 0.1 : 0, 0, 0]}>
        <Block size={[0.3, 0.035, 0.22]} position={[-0.3, 0.448, 0.02]} rotation={[0, 0.15, 0]} material={materials.bookA} />
        <Block size={[0.26, 0.03, 0.2]} position={[-0.29, 0.481, 0.02]} rotation={[0, -0.1, 0]} material={materials.bookB} />
      </group>
      <Cylinder
        radiusTop={0.045}
        radiusBottom={0.06}
        height={0.16}
        position={[round ? 0.2 : 0.32, 0.51, -0.05]}
        material={materials.ceramic}
      />
    </group>
  )
}
