import { materials } from '../materials'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

const SEAT_Y = 0.47

/**
 * Dining chair, facing +z (the seat front). "upholstered" has a padded back;
 * "spindle" has a wooden back made of thin rods. The colour is the seat fabric.
 */
export function DiningChair({ color, variant, frame }: ModelProps) {
  const tinted = useTintedMaterial(materials.fabricWhite, color)
  // The leather option keeps its own brown leather (like its real model).
  const fabric = variant === 'leather' ? materials.leather : tinted
  const wood = frameMaterial(frame, materials.woodLight)
  const legs: [number, number][] = [
    [-0.19, -0.19],
    [0.19, -0.19],
    [-0.19, 0.19],
    [0.19, 0.19],
  ]

  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder
          key={i}
          radiusTop={0.018}
          radiusBottom={0.014}
          height={SEAT_Y - 0.03}
          position={[x, (SEAT_Y - 0.03) / 2, z]}
          material={wood}
        />
      ))}
      <Block size={[0.46, 0.07, 0.46]} radius={0.025} position={[0, SEAT_Y, 0]} material={fabric} />

      {variant === 'spindle' ? (
        <group position={[0, 0, -0.2]}>
          {[-0.2, 0.2].map((x) => (
            <Cylinder key={x} radiusTop={0.016} height={0.48} position={[x, SEAT_Y + 0.24, 0]} material={wood} />
          ))}
          {[-0.12, -0.04, 0.04, 0.12].map((x) => (
            <Cylinder key={x} radiusTop={0.008} height={0.36} position={[x, SEAT_Y + 0.21, 0]} material={wood} />
          ))}
          <Block size={[0.44, 0.06, 0.03]} radius={0.01} position={[0, SEAT_Y + 0.43, 0]} material={wood} />
        </group>
      ) : (
        <Block size={[0.44, 0.46, 0.07]} radius={0.03} position={[0, SEAT_Y + 0.27, -0.205]} rotation={[-0.08, 0, 0]} material={fabric} />
      )}
    </group>
  )
}
