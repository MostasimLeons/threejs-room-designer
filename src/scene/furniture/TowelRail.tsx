import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Chrome towel rail with a towel over it. Its back (-z) goes against the wall.
 * "ladder" is a heated ladder rail standing on the floor; "bar" is a single bar
 * fixed to the wall at 1.1 m. The colour is the towel.
 */
export function TowelRail({ color, variant }: ModelProps) {
  const towel = useTintedMaterial(materials.linen, color)

  if (variant === 'bar') {
    return (
      <group position={[0, 1.1, -0.02]}>
        <Cylinder radiusTop={0.01} height={0.6} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.04]} material={materials.chrome} />
        {[-0.27, 0.27].map((x) => (
          <Block key={x} size={[0.02, 0.02, 0.06]} position={[x, 0, 0.01]} material={materials.chrome} />
        ))}
        <Block size={[0.4, 0.55, 0.025]} radius={0.01} position={[0, -0.27, 0.04]} material={towel} />
      </group>
    )
  }

  const rungs = [0.25, 0.42, 0.59, 0.76, 0.93, 1.1]
  return (
    <group position={[0, 0, 0]}>
      {[-0.22, 0.22].map((x) => (
        <Cylinder key={x} radiusTop={0.013} height={1.15} position={[x, 0.575, 0]} material={materials.chrome} />
      ))}
      {rungs.map((y) => (
        <Cylinder key={y} radiusTop={0.008} height={0.44} rotation={[0, 0, Math.PI / 2]} position={[0, y, 0]} material={materials.chrome} />
      ))}
      {/* Towel folded over the top rungs, hanging down at the front */}
      <Block size={[0.34, 0.5, 0.03]} radius={0.012} position={[0, 0.88, 0.025]} material={towel} />
      <Block size={[0.34, 0.03, 0.07]} radius={0.012} position={[0, 1.12, 0]} material={towel} />
    </group>
  )
}
