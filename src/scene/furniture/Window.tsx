import type { ThreeElements } from '@react-three/fiber'
import { ROOM } from '../roomConfig'
import { materials } from '../materials'
import { Block } from '../parts'

type GroupProps = ThreeElements['group']

interface WindowProps extends GroupProps {
  width: number
  height: number
}

/**
 * White window frame placed inside the wall opening. The group origin is at the
 * bottom-centre of the opening, in the middle of the wall's thickness.
 */
export function Window({ width: w, height: h, ...props }: WindowProps) {
  const f = 0.06 // frame thickness
  const d = ROOM.wallThickness + 0.03 // frame depth
  return (
    <group {...props}>
      <Block size={[w, f, d]} position={[0, h - f / 2, 0]} material={materials.trim} />
      <Block size={[w, f, d]} position={[0, f / 2, 0]} material={materials.trim} />
      <Block size={[f, h, d]} position={[-w / 2 + f / 2, h / 2, 0]} material={materials.trim} />
      <Block size={[f, h, d]} position={[w / 2 - f / 2, h / 2, 0]} material={materials.trim} />
      <Block size={[0.04, h - 2 * f, 0.05]} position={[0, h / 2, 0]} material={materials.trim} />

      {/* Window sill sticking out into the room */}
      <Block size={[w + 0.16, 0.035, 0.2]} position={[0, -0.0175, ROOM.wallThickness / 2 + 0.05]} material={materials.trim} />

      {/* Glass: transparent and does not block sunlight */}
      <mesh position={[0, h / 2, 0]} material={materials.glass}>
        <boxGeometry args={[w - 2 * f, h - 2 * f, 0.01]} />
      </mesh>

      {/* Bright "outdoors" backdrop behind the glass, kept small so it never shows above the wall */}
      <mesh position={[0, h / 2, -0.35]} material={materials.sky}>
        <planeGeometry args={[w + 0.8, h + 0.4]} />
      </mesh>
    </group>
  )
}
