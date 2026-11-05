import { materials } from '../materials'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

/**
 * L-shaped corner sofa: a three-seat sofa along the back with a chaise longue
 * coming forward on one side ("left" or "right", seen from the front). Faces +z.
 * Its footprint is the whole rectangle around the L, so the space in front of the
 * seats counts as taken for overlap warnings.
 */
export function CornerSofa({ color, variant, frame }: ModelProps) {
  const legMaterial = frameMaterial(frame, materials.woodDark)
  const fabric = useTintedMaterial(materials.fabricWhite, color)
  const [w, d] = useFootprint('cornerSofa', variant)
  const side = variant === 'right' ? 1 : -1 // which end the chaise is on
  const legH = 0.08
  const baseH = 0.28
  const seatTop = legH + baseH
  const back = -d / 2
  const mainD = 0.92 // depth of the sofa part
  const chaiseW = 0.9
  const chaiseX = side * (w / 2 - chaiseW / 2)
  const armX = -side * (w / 2 - 0.1) // arm on the end without the chaise
  const seatsW = w - chaiseW - 0.2 // seat cushions between the arm and the chaise
  const seatsX = (side * (0.2 - chaiseW)) / 2 // centre of the seat run, halfway from the arm to the chaise
  const cushionW = (seatsW - 0.04) / 2

  const legs: [number, number][] = [
    [-w / 2 + 0.08, back + 0.08],
    [w / 2 - 0.08, back + 0.08],
    [-side * (w / 2 - 0.08), back + mainD - 0.08],
    [chaiseX - side * (chaiseW / 2 - 0.08), d / 2 - 0.08],
    [chaiseX + side * (chaiseW / 2 - 0.08), d / 2 - 0.08],
  ]

  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cylinder key={i} radiusTop={0.022} radiusBottom={0.016} height={legH} position={[x, legH / 2, z]} material={legMaterial} />
      ))}

      {/* Base of the sofa part and of the chaise */}
      <Block size={[w, baseH, mainD]} radius={0.03} position={[0, legH + baseH / 2, back + mainD / 2]} material={fabric} />
      <Block
        size={[chaiseW, baseH, d - mainD + 0.02]}
        radius={0.03}
        position={[chaiseX, legH + baseH / 2, (back + mainD + d / 2) / 2]}
        material={fabric}
      />

      {/* Back cushion along the whole back, and the arm */}
      <Block size={[w, 0.46, 0.22]} radius={0.06} position={[0, seatTop + 0.2, back + 0.11]} material={fabric} />
      <Block size={[0.2, 0.24, mainD]} radius={0.06} position={[armX, seatTop + 0.1, back + mainD / 2]} material={fabric} />

      {/* Seat cushions: two on the sofa part, one long one on the chaise */}
      {[-0.5, 0.5].map((k) => (
        <Block
          key={k}
          size={[cushionW, 0.13, mainD - 0.26]}
          radius={0.05}
          position={[seatsX + k * (cushionW + 0.02), seatTop + 0.065, back + 0.22 + (mainD - 0.26) / 2]}
          material={fabric}
        />
      ))}
      <Block
        size={[chaiseW - 0.06, 0.13, d - 0.26]}
        radius={0.05}
        position={[chaiseX, seatTop + 0.065, back + 0.22 + (d - 0.26) / 2]}
        material={fabric}
      />

      {/* Scatter cushions */}
      <Block
        size={[0.42, 0.38, 0.12]}
        radius={0.06}
        position={[seatsX - side * 0.25, seatTop + 0.3, back + 0.32]}
        rotation={[-0.25, 0, -side * 0.1]}
        material={materials.fabricSage}
      />
      <Block
        size={[0.42, 0.38, 0.12]}
        radius={0.06}
        position={[chaiseX, seatTop + 0.3, back + 0.32]}
        rotation={[-0.25, 0, side * 0.08]}
        material={materials.fabricSand}
      />
    </group>
  )
}
