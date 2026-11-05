import type { ThreeElements } from '@react-three/fiber'
import { ROOM } from '../roomConfig'
import { materials } from '../materials'
import { Block, Cylinder } from '../parts'

type GroupProps = ThreeElements['group']

interface DoorProps extends GroupProps {
  width: number
  height: number
  /** Swing the leaf open (into the +z side) by this many degrees. Leave out for a closed door. */
  openAngle?: number
  /** Thickness of the wall it's in (the casing and panel follow it). */
  wallThickness?: number
}

/** Panelled white door with a casing and brass lever handle. Faces +z. */
export function Door({ width: w, height: h, openAngle = 0, wallThickness = ROOM.wallThickness, ...props }: DoorProps) {
  const casing = 0.07
  const casingDepth = wallThickness + 0.04
  const panelZ = wallThickness / 2 - 0.03

  return (
    <group {...props}>
      {/* Casing (frame) around the opening */}
      <Block size={[casing, h + casing, casingDepth]} position={[-w / 2 - casing / 2, (h + casing) / 2, 0]} material={materials.trim} />
      <Block size={[casing, h + casing, casingDepth]} position={[w / 2 + casing / 2, (h + casing) / 2, 0]} material={materials.trim} />
      <Block size={[w + 2 * casing, casing, casingDepth]} position={[0, h + casing / 2, 0]} material={materials.trim} />

      {/* The leaf turns around its hinge (left edge). Closed = no rotation, the original position. */}
      <group position={[-w / 2, 0, panelZ]} rotation={[0, (-openAngle * Math.PI) / 180, 0]}>
        <group position={[w / 2, 0, -panelZ]}>
          {/* Door leaf with two raised panels */}
          <Block size={[w, h, 0.04]} position={[0, h / 2, panelZ]} material={materials.door} />
          <Block size={[w - 0.24, 0.85, 0.012]} position={[0, 1.5, panelZ + 0.026]} material={materials.door} />
          <Block size={[w - 0.24, 0.7, 0.012]} position={[0, 0.55, panelZ + 0.026]} material={materials.door} />

          {/* Handle: round rosette + lever */}
          <Cylinder
            radiusTop={0.028}
            height={0.03}
            rotation={[Math.PI / 2, 0, 0]}
            position={[w / 2 - 0.1, 1.0, panelZ + 0.035]}
            material={materials.brass}
          />
          <Block size={[0.12, 0.018, 0.018]} position={[w / 2 - 0.15, 1.0, panelZ + 0.06]} material={materials.brass} />
        </group>
      </group>
    </group>
  )
}
