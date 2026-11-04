import { Bloom, EffectComposer, N8AO, Outline, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import type { ViewMode } from './roomConfig'

/**
 * Effects applied to the finished image, in this order:
 *
 * 1. N8AO (ambient occlusion): soft darkening where surfaces meet, such as under
 *    the sofa, in room corners and between cushions. This is the biggest single
 *    step towards a "real photo" look. It runs at full resolution: N8AO's faster
 *    half-resolution mode crashes with Three.js 0.187 (see README, Known limitations).
 * 2. Outline: a blue edge around the selected furniture, wall or floor. Parts hidden
 *    behind other things show a darker blue, so you can find a chair under a table.
 * 3. Bloom: a soft glow around things brighter than white (bulbs, the cove line,
 *    the daylight in the windows). Ordinary surfaces never glow.
 * 4. Tone mapping (Khronos "Neutral"): turns the high-range light values into
 *    screen colours. Neutral keeps paint and fabric colours close to their swatches,
 *    which matters in a design tool; ACES/AgX would shift and desaturate them.
 * 5. Vignette: a slight darkening at the edges that draws the eye to the room.
 * 6. SMAA: smooths jagged edges. It replaces the browser's built-in antialiasing,
 *    which doesn't apply once the image goes through post-processing.
 */
export function PostEffects({ view }: { view: ViewMode }) {
  const plan = view === 'plan'
  return (
    // autoClear off: required for the Outline effect's <Selection> (see the library's docs).
    <EffectComposer multisampling={0} autoClear={false}>
      <N8AO
        // Half resolution would be faster, but crashes with Three.js 0.187.
        halfRes={false}
        quality="medium"
        // World-space radius in metres: how far contact shadows spread from a corner.
        aoRadius={plan ? 0.4 : 0.7}
        distanceFalloff={1}
        intensity={plan ? 2.5 : 3.5}
        color="#2a2018"
      />
      {/* Blue outline around whatever is selected (furniture, a wall, the floor); see <Select>. */}
      {/* Alpha blending: the default "screen" blend only brightens, so blue edges vanish on light walls. */}
      <Outline blendFunction={BlendFunction.ALPHA} visibleEdgeColor="#2f6fed" hiddenEdgeColor="#5f86d6" edgeStrength={40} blur xRay />
      <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.2} intensity={0.55} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.32} darkness={plan ? 0.2 : 0.38} />
      <SMAA />
    </EffectComposer>
  )
}
