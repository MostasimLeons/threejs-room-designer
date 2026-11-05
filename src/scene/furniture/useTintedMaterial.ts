import { useEffect, useMemo } from 'react'
import type * as THREE from 'three'
import type { FrameId } from './frames'

/** Props shared by every colourable furniture model. */
export interface ModelProps {
  color: string
  /** Style/size option id from the catalog, e.g. '2-seat'. */
  variant: string
  /** Finish of the legs / frame / handles; missing = the model's standard finish (frames.ts). */
  frame?: FrameId
}

/**
 * Returns this object's own copy of a shared material, painted in `color`.
 * Copying means recolouring one sofa never affects anything else.
 */
export function useTintedMaterial<T extends THREE.MeshStandardMaterial>(base: T, color: string): T {
  const material = useMemo(() => base.clone(), [base])
  // Free the GPU memory when the object is removed.
  useEffect(() => () => material.dispose(), [material])
  material.color.set(color)
  return material
}
