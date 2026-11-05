import { materials } from '../materials'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

/**
 * Sofa built from its width, so the same code makes a 2-, 3- or 4-seater.
 * Faces +z in its local space.
 */
export function Sofa({ color, variant, frame }: ModelProps) {
  const legMaterial = frameMaterial(frame, materials.woodDark)
  const fabric = useTintedMaterial(materials.fabricWhite, color)
  const [width] = useFootprint('sofa', variant)
  const inner = width - 0.36 // space between the two arms
  const cushions = variant === '4-seat' ? 3 : 2
  const cushionW = (inner - 0.04) / cushions
  // x position of each seat/back cushion, centred around 0
  const cushionX = Array.from({ length: cushions }, (_, i) => (i - (cushions - 1) / 2) * (cushionW + 0.02))
  const legX = width / 2 - 0.1
  const legs: [number, number][] = [
    [-legX, -0.36],
    [legX, -0.36],
    [-legX, 0.36],
    [legX, 0.36],
  ]
  const pillowX = inner / 2 - 0.26

  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder key={i} radiusTop={0.025} radiusBottom={0.018} height={0.1} position={[x, 0.05, z]} material={legMaterial} />
      ))}

      {/* Base frame */}
      <Block size={[width, 0.22, 0.9]} radius={0.04} position={[0, 0.21, 0]} material={fabric} />
      {/* Arms */}
      <Block size={[0.18, 0.54, 0.9]} radius={0.07} position={[-(width / 2 - 0.09), 0.37, 0]} material={fabric} />
      <Block size={[0.18, 0.54, 0.9]} radius={0.07} position={[width / 2 - 0.09, 0.37, 0]} material={fabric} />
      {/* Backrest */}
      <Block size={[inner, 0.5, 0.2]} radius={0.07} position={[0, 0.57, -0.35]} material={fabric} />

      {cushionX.map((x) => (
        <group key={x}>
          {/* Seat cushion */}
          <Block size={[cushionW, 0.16, 0.68]} radius={0.06} position={[x, 0.4, 0.08]} material={fabric} />
          {/* Back cushion, tilted slightly backwards */}
          <Block size={[cushionW, 0.42, 0.16]} radius={0.07} position={[x, 0.66, -0.2]} rotation={[-0.12, 0, 0]} material={fabric} />
        </group>
      ))}

      {/* Throw pillows */}
      <Block
        size={[0.42, 0.42, 0.12]}
        radius={0.06}
        position={[-pillowX, 0.66, -0.05]}
        rotation={[-0.25, 0, 0.1]}
        material={materials.fabricSage}
      />
      <Block
        size={[0.42, 0.42, 0.12]}
        radius={0.06}
        position={[pillowX, 0.66, -0.05]}
        rotation={[-0.25, 0, -0.1]}
        material={materials.fabricSand}
      />
    </group>
  )
}
