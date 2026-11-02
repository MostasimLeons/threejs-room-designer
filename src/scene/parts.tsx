import type { ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type * as THREE from 'three'

type Vec3 = [number, number, number]
type MeshProps = Omit<ThreeElements['mesh'], 'args' | 'material' | 'ref'>

interface BlockProps extends MeshProps {
  size: Vec3
  material: THREE.Material
  /** Corner rounding in metres. Leave out for a sharp-edged box. */
  radius?: number
}

/** A box that casts and receives shadows. Rounded when `radius` is given. */
export function Block({ size, material, radius, ...props }: BlockProps) {
  if (radius) {
    return (
      <RoundedBox
        args={size}
        radius={radius}
        smoothness={4}
        material={material}
        castShadow
        receiveShadow
        {...props}
      />
    )
  }
  return (
    <mesh material={material} castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
    </mesh>
  )
}

interface CylinderProps extends MeshProps {
  radiusTop: number
  radiusBottom?: number
  height: number
  material: THREE.Material
  segments?: number
  openEnded?: boolean
}

/** A cylinder that casts and receives shadows. */
export function Cylinder({
  radiusTop,
  radiusBottom = radiusTop,
  height,
  material,
  segments = 24,
  openEnded = false,
  ...props
}: CylinderProps) {
  return (
    <mesh material={material} castShadow receiveShadow {...props}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, segments, 1, openEnded]} />
    </mesh>
  )
}
