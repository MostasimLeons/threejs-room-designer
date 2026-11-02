import { useMemo } from 'react'
import { materials } from '../materials'
import { Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** Potted indoor plant made of flattened spheres arranged in a spiral. */
export function Plant({ color, variant }: ModelProps) {
  const pot = useTintedMaterial(materials.terracotta, color)
  // Pre-compute leaf positions once. The "golden angle" spreads them evenly.
  const leaves = useMemo(() => {
    const count = 22
    return Array.from({ length: count }, (_, i) => {
      const t = i / count
      return {
        angle: i * GOLDEN_ANGLE,
        height: 0.5 + t * 0.75,
        reach: 0.06 + Math.sin(i * 1.7) * 0.03 + (1 - t) * 0.08,
        tilt: 0.25 + ((i * 37) % 10) / 20,
        scale: 0.85 + ((i * 53) % 10) / 30,
        dark: i % 3 === 0,
      }
    })
  }, [])

  // The small plant is the same model, scaled down.
  const scale = variant === 'small' ? 0.65 : 1
  return (
    <group scale={scale}>
      {/* Pot, soil and trunk */}
      <Cylinder radiusTop={0.2} radiusBottom={0.15} height={0.42} position={[0, 0.21, 0]} segments={32} material={pot} />
      <Cylinder radiusTop={0.185} height={0.02} position={[0, 0.41, 0]} material={materials.soil} />
      <Cylinder radiusTop={0.015} radiusBottom={0.025} height={0.85} position={[0, 0.83, 0]} material={materials.woodDark} />

      {leaves.map((leaf, i) => (
        // Outer group: turns to face outward and sits at the leaf's height.
        <group key={i} position={[0, leaf.height, 0]} rotation={[0, -leaf.angle, 0]}>
          {/* Inner mesh: pushed outward and tilted up, like a real leaf. */}
          <mesh
            position={[leaf.reach + 0.13 * leaf.scale, 0, 0]}
            rotation={[0.3, 0, leaf.tilt]}
            scale={[0.17 * leaf.scale, 0.012, 0.075 * leaf.scale]}
            material={leaf.dark ? materials.leafDark : materials.leaf}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
