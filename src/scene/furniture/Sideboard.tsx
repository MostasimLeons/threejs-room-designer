import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

/** Low sideboard on slim black legs, with door seams, brass knobs, a vase and books on top. Faces +z. */
export function Sideboard({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const [width, depth] = useFootprint('sideboard', variant)
  const doors = variant === '200' ? 4 : 3
  const legH = 0.14
  const bodyH = 0.62
  const front = depth / 2 + 0.002
  const doorW = width / doors

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
          radiusTop={0.014}
          height={legH}
          position={[sx * (width / 2 - 0.06), legH / 2, sz * (depth / 2 - 0.06)]}
          material={materials.metalBlack}
        />
      ))}
      <Block size={[width, bodyH, depth]} radius={0.012} position={[0, legH + bodyH / 2, 0]} material={wood} />

      {/* Seams between the doors, and a small brass knob on each */}
      {Array.from({ length: doors - 1 }, (_, i) => (
        <Block
          key={i}
          size={[0.006, bodyH - 0.06, 0.004]}
          position={[-width / 2 + doorW * (i + 1), legH + bodyH / 2, front]}
          material={materials.slatBacking}
        />
      ))}
      {Array.from({ length: doors }, (_, i) => (
        <Cylinder
          key={i}
          radiusTop={0.012}
          height={0.02}
          rotation={[Math.PI / 2, 0, 0]}
          position={[-width / 2 + doorW * (i + 0.5), legH + bodyH * 0.62, front + 0.01]}
          material={materials.brass}
        />
      ))}

      {/* Decoration */}
      <Cylinder
        radiusTop={0.05}
        radiusBottom={0.07}
        height={0.3}
        position={[-width / 2 + 0.25, legH + bodyH + 0.15, -0.04]}
        material={materials.ceramic}
      />
      <Block
        size={[0.26, 0.05, 0.2]}
        position={[width / 2 - 0.3, legH + bodyH + 0.025, 0]}
        rotation={[0, 0.2, 0]}
        material={materials.bookA}
      />
      <Block
        size={[0.22, 0.04, 0.18]}
        position={[width / 2 - 0.3, legH + bodyH + 0.07, 0]}
        rotation={[0, -0.1, 0]}
        material={materials.bookB}
      />
    </group>
  )
}
