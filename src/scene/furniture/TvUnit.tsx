import { materials } from '../materials'
import { Block } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/** Low wooden media cabinet with a 55" or 65" flat-screen TV on top. Faces +z. */
export function TvUnit({ color, variant }: ModelProps) {
  const body = useTintedMaterial(materials.woodDark, color)
  const cabinetTop = 0.53
  // TV body size [width, height] for each screen size.
  const [tvW, tvH] = variant === '65' ? [1.45, 0.84] : [1.23, 0.72]
  return (
    <group>
      {/* Short metal feet */}
      {[-0.8, 0.8].map((x) => (
        <Block key={x} size={[0.04, 0.08, 0.36]} position={[x, 0.04, 0]} material={materials.metalBlack} />
      ))}

      {/* Cabinet body and three door fronts */}
      <Block size={[1.8, 0.45, 0.42]} position={[0, 0.305, 0]} material={body} />
      {[-0.59, 0, 0.59].map((x) => (
        <Block key={x} size={[0.57, 0.41, 0.02]} position={[x, 0.305, 0.215]} material={materials.woodLight} />
      ))}

      {/* TV stand */}
      <Block size={[0.32, 0.02, 0.2]} position={[0, cabinetTop + 0.01, 0]} material={materials.metalBlack} />
      <Block size={[0.06, 0.1, 0.03]} position={[0, cabinetTop + 0.07, -0.02]} material={materials.metalBlack} />

      {/* TV body and glossy screen */}
      <Block size={[tvW, tvH, 0.04]} position={[0, cabinetTop + 0.12 + tvH / 2, -0.02]} material={materials.metalBlack} />
      <mesh position={[0, cabinetTop + 0.125 + tvH / 2, 0.001]} material={materials.screen}>
        <planeGeometry args={[tvW - 0.04, tvH - 0.04]} />
      </mesh>
    </group>
  )
}
