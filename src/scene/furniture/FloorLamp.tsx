import { useContext } from 'react'
import { materials } from '../materials'
import { InteriorLightContext } from '../interiorLight'
import { Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/** Floor lamp with a glowing fabric shade and a warm point light inside. */
export function FloorLamp({ color, variant }: ModelProps) {
  const shade = useTintedMaterial(materials.lampShade, color)
  // Brighter in the evening (0 = daylight, 1 = night). The shade is this lamp's own copy, so it's set here.
  const interior = useContext(InteriorLightContext)
  shade.emissiveIntensity = 0.25 + 1.0 * interior
  const shadeY = 1.5
  // [top radius, bottom radius, height] of the shade
  const [top, bottom, height] = variant === 'drum' ? [0.21, 0.21, 0.28] : [0.15, 0.22, 0.3]
  return (
    <group>
      <Cylinder radiusTop={0.15} radiusBottom={0.16} height={0.03} position={[0, 0.015, 0]} segments={32} material={materials.metalBlack} />
      <Cylinder radiusTop={0.012} height={1.45} position={[0, 0.75, 0]} material={materials.brass} />

      {/* Open-ended cylinder = lamp shade. It doesn't cast shadows so the light can escape. */}
      <mesh position={[0, shadeY, 0]} material={shade}>
        <cylinderGeometry args={[top, bottom, height, 32, 1, true]} />
      </mesh>
      <mesh position={[0, shadeY - 0.04, 0]} material={materials.bulb}>
        <sphereGeometry args={[0.045, 16, 12]} />
      </mesh>

      {/* Warm light. `decay` 2 = physically realistic fall-off. */}
      <pointLight position={[0, shadeY - 0.05, 0]} color="#ffcf8f" intensity={0.4 + 2.6 * interior} distance={6} decay={2} />
    </group>
  )
}
