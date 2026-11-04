import { materials } from '../materials'
import { Block } from '../parts'
import { getVariant } from './catalog'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Upholstered bed with a channel-tufted headboard, oak plinth, linen bedding and pillows.
 * King = 180 × 200 cm mattress, Queen = 160 × 200 cm. Headboard at the back, faces +z.
 */
export function Bed({ color, variant }: ModelProps) {
  const upholstery = useTintedMaterial(materials.creamUpholstery, color)
  const [width, depth] = getVariant('bed', variant).footprint
  const mattressW = width - 0.1 // 1.8 m for a king
  const frameD = depth - 0.12 // frame in front of the headboard
  const frameZ = (depth - frameD) / 2 // shift the frame forward of the headboard
  const back = -depth / 2

  // Headboard channels (vertical tufted strips)
  const channels = 7
  const channelW = (width + 0.04) / channels

  return (
    <group>
      {/* Recessed oak plinth: makes the bed look like it floats */}
      <Block size={[width - 0.16, 0.06, frameD - 0.16]} position={[0, 0.03, frameZ]} material={materials.woodLight} />
      {/* Upholstered base */}
      <Block size={[width, 0.28, frameD]} radius={0.03} position={[0, 0.2, frameZ]} material={upholstery} />
      {/* Mattress */}
      <Block size={[mattressW, 0.22, frameD - 0.08]} radius={0.05} position={[0, 0.45, frameZ]} material={materials.linen} />
      {/* Duvet over the front two-thirds, and a sand throw across the foot */}
      <Block size={[mattressW + 0.06, 0.07, frameD * 0.68]} radius={0.03} position={[0, 0.58, frameZ + frameD * 0.15]} material={materials.linen} />
      <Block size={[mattressW + 0.1, 0.075, 0.5]} radius={0.03} position={[0, 0.6, frameZ + frameD / 2 - 0.33]} material={materials.fabricSand} />

      {/* Pillows: two sleeping pillows and two smaller accent cushions */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block size={[mattressW / 2 - 0.1, 0.17, 0.42]} radius={0.07} position={[side * (mattressW / 4), 0.64, back + 0.42]} rotation={[-0.35, 0, 0]} material={materials.linen} />
          <Block size={[0.42, 0.3, 0.12]} radius={0.06} position={[side * (mattressW / 4 - 0.05), 0.72, back + 0.6]} rotation={[-0.3, 0, side * 0.08]} material={materials.fabricSand} />
        </group>
      ))}

      {/* Upholstered headboard with channel tufting */}
      <Block size={[width + 0.04, 1.25, 0.08]} radius={0.02} position={[0, 0.66, back + 0.04]} material={upholstery} />
      {Array.from({ length: channels }, (_, i) => (
        <Block
          key={i}
          size={[channelW - 0.012, 1.05, 0.06]}
          radius={0.025}
          position={[-(width + 0.04) / 2 + channelW * (i + 0.5), 0.74, back + 0.1]}
          material={upholstery}
        />
      ))}
    </group>
  )
}
