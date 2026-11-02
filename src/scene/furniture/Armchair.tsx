import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/** Single armchair with wooden legs, with or without arms. Faces +z in its local space. */
export function Armchair({ color, variant }: ModelProps) {
  const fabric = useTintedMaterial(materials.fabricWhite, color)
  const armless = variant === 'armless'
  const width = armless ? 0.7 : 0.92
  const lx = width / 2 - 0.08
  const legs: [number, number][] = [[-lx, -0.32], [lx, -0.32], [-lx, 0.32], [lx, 0.32]]
  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder key={i} radiusTop={0.025} radiusBottom={0.018} height={0.14} position={[x, 0.07, z]} material={materials.woodLight} />
      ))}
      <Block size={[width, 0.2, 0.82]} radius={0.04} position={[0, 0.24, 0]} material={fabric} />
      {!armless && (
        <>
          <Block size={[0.16, 0.48, 0.82]} radius={0.07} position={[-0.38, 0.42, 0]} material={fabric} />
          <Block size={[0.16, 0.48, 0.82]} radius={0.07} position={[0.38, 0.42, 0]} material={fabric} />
        </>
      )}
      <Block size={[armless ? 0.68 : 0.6, armless ? 0.62 : 0.5, 0.18]} radius={0.07} position={[0, armless ? 0.66 : 0.6, -0.32]} rotation={[-0.1, 0, 0]} material={fabric} />
      <Block size={[armless ? 0.68 : 0.6, 0.15, 0.62]} radius={0.06} position={[0, 0.41, 0.08]} material={fabric} />
      <Block size={[0.38, 0.36, 0.11]} radius={0.05} position={[0, 0.64, -0.18]} rotation={[-0.25, 0, 0.06]} material={materials.fabricSand} />
    </group>
  )
}
