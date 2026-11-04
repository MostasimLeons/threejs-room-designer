import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { getVariant } from './catalog'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Oak dressing table with a cream drawer, a brass-framed mirror (round or tall rectangle)
 * and an upholstered stool tucked in front. Back edge at the wall, faces +z.
 */
export function DressingTable({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const [width, depth] = getVariant('dressingTable', variant).footprint
  const back = -depth / 2
  const tableD = 0.45
  const tableZ = back + tableD / 2
  const topY = 0.76
  const legs: [number, number][] = [
    [-width / 2 + 0.05, tableZ - tableD / 2 + 0.05],
    [width / 2 - 0.05, tableZ - tableD / 2 + 0.05],
    [-width / 2 + 0.05, tableZ + tableD / 2 - 0.05],
    [width / 2 - 0.05, tableZ + tableD / 2 - 0.05],
  ]
  const mirrorZ = back + 0.04

  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder key={i} radiusTop={0.022} radiusBottom={0.014} height={topY - 0.03} position={[x, (topY - 0.03) / 2, z]} material={wood} />
      ))}
      <Block size={[width, 0.035, tableD]} radius={0.01} position={[0, topY - 0.0175, tableZ]} material={wood} />
      {/* Drawer under the top */}
      <Block size={[width - 0.14, 0.12, tableD - 0.06]} position={[0, topY - 0.1, tableZ]} material={materials.creamLacquer} />
      <Block size={[0.14, 0.012, 0.015]} position={[0, topY - 0.1, tableZ + tableD / 2 - 0.02]} material={materials.brass} />

      {/* Mirror standing on the table's back edge */}
      {variant === 'round' ? (
        <group position={[0, topY + 0.45, mirrorZ]}>
          {/* A torus already stands upright facing +z; the disc (a flat cylinder) is turned to match */}
          <mesh material={materials.brass} castShadow>
            <torusGeometry args={[0.33, 0.016, 12, 64]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.mirror}>
            <cylinderGeometry args={[0.32, 0.32, 0.012, 64]} />
          </mesh>
        </group>
      ) : (
        <group position={[0, topY + 0.5, mirrorZ]}>
          <Block size={[0.62, 0.98, 0.025]} radius={0.01} material={materials.brass} />
          <Block size={[0.58, 0.94, 0.012]} position={[0, 0, 0.012]} material={materials.mirror} />
        </group>
      )}

      {/* Small items: a perfume bottle and a tray */}
      <Cylinder radiusTop={0.02} radiusBottom={0.03} height={0.11} position={[width / 2 - 0.18, topY + 0.055, tableZ - 0.05]} material={materials.glass} />
      <Block size={[0.24, 0.015, 0.14]} position={[-width / 2 + 0.2, topY + 0.008, tableZ]} material={materials.brass} />

      {/* Upholstered stool tucked in front */}
      <group position={[0, 0, back + tableD + 0.12]}>
        {[-1, 1].map((s) => (
          <Cylinder key={s} radiusTop={0.012} height={0.42} position={[s * 0.15, 0.21, 0]} material={materials.brass} />
        ))}
        <Block size={[0.42, 0.1, 0.32]} radius={0.04} position={[0, 0.46, 0]} material={materials.creamUpholstery} />
      </group>
    </group>
  )
}
