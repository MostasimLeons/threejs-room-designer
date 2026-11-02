import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { ROOM, type ViewMode } from './roomConfig'

interface CameraRigProps {
  view: ViewMode
  /** Changing this number remounts the camera, which resets the view. */
  resetKey: number
}

/**
 * Perspective view: a normal 3D camera you can orbit around the room.
 * Plan view: an orthographic (no perspective distortion) camera looking
 * straight down, like an architect's floor plan. Rotation is disabled there.
 */
export function CameraRig({ view, resetKey }: CameraRigProps) {
  const size = useThree((state) => state.size)

  if (view === 'plan') {
    // Fit the whole room (plus a margin) into the canvas.
    const zoom = Math.min(size.width / (ROOM.width + 1.6), size.height / (ROOM.depth + 1.6))
    return (
      <>
        {/* The tiny z offset avoids a maths edge case when looking exactly straight down. */}
        <OrthographicCamera key={`plan-cam-${resetKey}`} makeDefault position={[0, 20, 0.001]} zoom={zoom} near={0.1} far={100} />
        <OrbitControls
          key={`plan-ctl-${resetKey}`}
          makeDefault
          target={[0, 0, 0]}
          enableRotate={false}
          screenSpacePanning
          minZoom={zoom * 0.5}
          maxZoom={zoom * 5}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        />
      </>
    )
  }

  return (
    <>
      <PerspectiveCamera key={`persp-cam-${resetKey}`} makeDefault position={[6.2, 4.4, 6.4]} fov={45} near={0.1} far={100} />
      <OrbitControls
        key={`persp-ctl-${resetKey}`}
        makeDefault
        target={[0, 0.8, -0.8]}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={16}
        // Stop the camera from going below the floor.
        maxPolarAngle={Math.PI / 2 - 0.06}
      />
    </>
  )
}
