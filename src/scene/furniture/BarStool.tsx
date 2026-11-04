import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

const SEAT_Y = 0.75

/** Counter-height bar stool on a black pedestal with a foot ring. Faces +z; "low-back" adds a curved backrest. */
export function BarStool({ color, variant }: ModelProps) {
  const seat = useTintedMaterial(materials.fabricWhite, color)
  return (
    <group>
      <Cylinder radiusTop={0.19} radiusBottom={0.2} height={0.02} position={[0, 0.01, 0]} segments={32} material={materials.metalBlack} />
      <Cylinder radiusTop={0.022} height={SEAT_Y - 0.05} position={[0, (SEAT_Y - 0.05) / 2, 0]} material={materials.metalBlack} />
      {/* Foot ring */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.metalBlack} castShadow>
        <torusGeometry args={[0.15, 0.008, 8, 32]} />
      </mesh>
      <Cylinder radiusTop={0.19} radiusBottom={0.17} height={0.07} position={[0, SEAT_Y - 0.035, 0]} segments={32} material={seat} />
      {variant === 'low-back' && (
        <group position={[0, SEAT_Y + 0.12, -0.15]}>
          <Block size={[0.3, 0.14, 0.035]} radius={0.015} rotation={[-0.15, 0, 0]} material={seat} />
          {[-0.11, 0.11].map((x) => (
            <Cylinder key={x} radiusTop={0.008} height={0.12} position={[x, -0.08, 0.005]} material={materials.metalBlack} />
          ))}
        </group>
      )}
    </group>
  )
}
