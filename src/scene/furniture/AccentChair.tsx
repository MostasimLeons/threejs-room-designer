import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Bedroom accent chair on tapered oak legs.
 * "tub" = rounded barrel back; "wingback" = tall back with side wings. Faces +z.
 */
export function AccentChair({ color, variant }: ModelProps) {
  const fabric = useTintedMaterial(materials.creamUpholstery, color)
  const legs: [number, number][] = [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]

  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder key={i} radiusTop={0.022} radiusBottom={0.012} height={0.18} position={[x, 0.09, z]} material={materials.woodLight} />
      ))}

      {variant === 'wingback' ? (
        <>
          <Block size={[0.72, 0.18, 0.7]} radius={0.04} position={[0, 0.27, 0]} material={fabric} />
          <Block size={[0.6, 0.12, 0.58]} radius={0.05} position={[0, 0.41, 0.04]} material={fabric} />
          {/* Tall back and wings */}
          <Block size={[0.72, 0.78, 0.14]} radius={0.05} position={[0, 0.7, -0.29]} rotation={[-0.08, 0, 0]} material={fabric} />
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.12, 0.62, 0.42]} radius={0.05} position={[s * 0.33, 0.62, -0.1]} material={fabric} />
          ))}
        </>
      ) : (
        <>
          {/* Round seat base and cushion */}
          <Cylinder radiusTop={0.36} radiusBottom={0.34} height={0.2} segments={40} position={[0, 0.28, 0]} material={fabric} />
          <Cylinder radiusTop={0.3} height={0.1} segments={40} position={[0, 0.42, 0.03]} material={fabric} />
          {/* Barrel back: a thick ring segment wrapping round the back of the seat */}
          <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, Math.PI]} material={fabric} castShadow receiveShadow>
            <torusGeometry args={[0.3, 0.07, 14, 40, Math.PI]} />
          </mesh>
          <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, Math.PI]} material={fabric} castShadow receiveShadow>
            <torusGeometry args={[0.3, 0.07, 14, 40, Math.PI]} />
          </mesh>
        </>
      )}
      {/* Small sand cushion */}
      <Block size={[0.34, 0.3, 0.1]} radius={0.05} position={[0, 0.58, -0.14]} rotation={[-0.25, 0, 0.05]} material={materials.fabricSand} />
    </group>
  )
}
