import type { ThreeElements } from '@react-three/fiber'
import { ROOM } from '../roomConfig'
import { materials } from '../materials'
import { Block } from '../parts'

type GroupProps = ThreeElements['group']

interface WindowProps extends GroupProps {
  width: number
  height: number
  /**
   * How far the "outdoors" backdrop may reach to the left and right of the window's
   * centre, so near a corner it stops at the wall's end instead of showing past it.
   */
  skyReach?: [number, number]
}

/**
 * White window frame placed inside the wall opening. The group origin is at the
 * bottom-centre of the opening, in the middle of the wall's thickness.
 */
export function Window({ width: w, height: h, skyReach = [Infinity, Infinity], ...props }: WindowProps) {
  // The backdrop is 40 cm wider than the window on each side, but never past the wall's ends.
  const skyLeft = Math.min(w / 2 + 0.4, skyReach[0])
  const skyRight = Math.min(w / 2 + 0.4, skyReach[1])
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
      <mesh position={[(skyRight - skyLeft) / 2, h / 2, -0.35]} material={materials.sky}>
        <planeGeometry args={[skyLeft + skyRight, h + 0.4]} />
      </mesh>
    </group>
  )
}
