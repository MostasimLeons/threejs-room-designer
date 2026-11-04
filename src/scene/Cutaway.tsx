import { useRef, type ReactNode } from 'react'
import type * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Objects on this layer aren't drawn (cameras only see layer 0) but still cast
 * shadows for the sun, whose shadow camera also looks at this layer (Lighting.tsx).
 * The overhead fill light doesn't, so a hidden wall blocks sunlight but not the
 * soft "daylight" that keeps the cut-open room bright.
 */
export const SHADOW_ONLY_LAYER = 1

/**
 * Hides its children whenever the camera is on the far side of them (outside the
 * room behind a wall, or above the ceiling), so they never block your view.
 * Checked every frame.
 *
 * Hidden children move to SHADOW_ONLY_LAYER instead of disappearing, so a wall
 * you can't see still stops the sun: afternoon sun from the right doesn't flood in
 * just because the right wall is cut away for the camera.
 */
export function Cutaway({ isBehind, children }: { isBehind: (camera: THREE.Camera) => boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    const group = ref.current
    if (!group) return
    const layer = isBehind(camera) ? SHADOW_ONLY_LAYER : 0
    // Every frame, so pieces added later (new decor, a changed opening) pick it up too.
    group.traverse((object) => object.layers.set(layer))
  })
  return <group ref={ref}>{children}</group>
}
