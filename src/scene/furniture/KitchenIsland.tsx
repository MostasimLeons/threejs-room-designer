import { materials } from '../materials'
import { Block } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

const BODY_H = 0.88
const TOP_T = 0.04

/**
 * Kitchen island with a stone worktop. The cooking side (-z) has drawers with
 * black bar handles; the seating side (+z) is a plain panel with a recessed
 * toe-kick, so bar stools can tuck in. The colour is the cabinet paint.
 */
export function KitchenIsland({ color, variant }: ModelProps) {
  const paint = useTintedMaterial(materials.creamLacquer, color)
  const [width, depth] = useFootprint('kitchenIsland', variant)
  const plinth = 0.1
  const back = -depth / 2 + 0.01
  const drawers = Math.round(width / 0.6)
  const drawerW = (width - 0.04) / drawers

  return (
    <group>
      {/* Dark recessed plinth */}
      <Block size={[width - 0.08, plinth, depth - 0.08]} position={[0, plinth / 2, 0]} material={materials.slatBacking} />
      <Block size={[width - 0.02, BODY_H - plinth, depth - 0.04]} position={[0, plinth + (BODY_H - plinth) / 2, 0]} material={paint} />
      <Block size={[width, TOP_T, depth]} radius={0.008} position={[0, BODY_H + TOP_T / 2, 0]} material={materials.stone} />

      {/* Drawer fronts on the cooking side, two rows */}
      {Array.from({ length: drawers }, (_, i) => {
        const x = -width / 2 + 0.02 + drawerW * (i + 0.5)
        return [0.3, 0.66].map((y) => (
          <group key={`${i}-${y}`}>
            <Block size={[drawerW - 0.012, 0.33, 0.012]} position={[x, plinth + y, back - 0.006]} material={paint} />
            <Block size={[drawerW * 0.45, 0.012, 0.016]} position={[x, plinth + y + 0.13, back - 0.018]} material={materials.metalBlack} />
          </group>
        ))
      })}

      {/* Fruit bowl */}
      <mesh position={[width / 2 - 0.35, BODY_H + TOP_T + 0.04, 0]} material={materials.ceramic} castShadow>
        <sphereGeometry args={[0.13, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
    </group>
  )
}
