import { useRef, type ReactNode } from 'react'
import type * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Hides its children whenever the camera is on the far side of them (outside the
 * room behind a wall, or above the ceiling), so they never block your view.
 * Checked every frame.
 */
export function Cutaway({ isBehind, children }: { isBehind: (camera: THREE.Camera) => boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = !isBehind(camera)
  })
  return <group ref={ref}>{children}</group>
}
