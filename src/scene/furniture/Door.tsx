import type { ThreeElements } from '@react-three/fiber'
import { ROOM } from '../roomConfig'
import { materials } from '../materials'
import { Block, Cylinder } from '../parts'

type GroupProps = ThreeElements['group']

interface DoorProps extends GroupProps {
  width: number
  height: number
}

/** Panelled white door with a casing and brass lever handle. Faces +z. */
export function Door({ width: w, height: h, ...props }: DoorProps) {
  const casing = 0.07
  const casingDepth = ROOM.wallThickness + 0.04
  const panelZ = ROOM.wallThickness / 2 - 0.03

  return (
    <group {...props}>
      {/* Casing (frame) around the opening */}
      <Block size={[casing, h + casing, casingDepth]} position={[-w / 2 - casing / 2, (h + casing) / 2, 0]} material={materials.trim} />
      <Block size={[casing, h + casing, casingDepth]} position={[w / 2 + casing / 2, (h + casing) / 2, 0]} material={materials.trim} />
      <Block size={[w + 2 * casing, casing, casingDepth]} position={[0, h + casing / 2, 0]} material={materials.trim} />

      {/* Door leaf with two raised panels */}
      <Block size={[w, h, 0.04]} position={[0, h / 2, panelZ]} material={materials.door} />
      <Block size={[w - 0.24, 0.85, 0.012]} position={[0, 1.5, panelZ + 0.026]} material={materials.door} />
      <Block size={[w - 0.24, 0.7, 0.012]} position={[0, 0.55, panelZ + 0.026]} material={materials.door} />

      {/* Handle: round rosette + lever */}
      <Cylinder radiusTop={0.028} height={0.03} rotation={[Math.PI / 2, 0, 0]} position={[w / 2 - 0.1, 1.0, panelZ + 0.035]} material={materials.brass} />
      <Block size={[0.12, 0.018, 0.018]} position={[w / 2 - 0.15, 1.0, panelZ + 0.06]} material={materials.brass} />
    </group>
  )
}
