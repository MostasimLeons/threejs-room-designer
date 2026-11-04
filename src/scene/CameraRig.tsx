import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import type { ViewMode } from './roomConfig'
import { ROOMS, type RoomId } from './house'

interface CameraRigProps {
  view: ViewMode
  /** Changing this number remounts the camera, which resets the view. */
  resetKey: number
  /** The room the camera frames. Switching rooms resets the camera to that room. */
  room: RoomId
}

/**
 * Perspective view: a normal 3D camera you can orbit around the room.
 * Plan view: an orthographic (no perspective distortion) camera looking
 * straight down, like an architect's floor plan. Rotation is disabled there.
 */
export function CameraRig({ view, resetKey, room }: CameraRigProps) {
  const size = useThree((state) => state.size)
  const { width, depth, camera } = ROOMS[room]

  if (view === 'plan') {
    // Fit the whole room (plus a margin) into the canvas.
    const zoom = Math.min(size.width / (width + 1.6), size.height / (depth + 1.6))
    return (
      <>
        {/* The tiny z offset avoids a maths edge case when looking exactly straight down. */}
        <OrthographicCamera key={`plan-cam-${room}-${resetKey}`} makeDefault position={[0, 20, 0.001]} zoom={zoom} near={0.1} far={100} />
        <OrbitControls
          key={`plan-ctl-${room}-${resetKey}`}
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

  const { position, target } = camera
  return (
    <>
      <PerspectiveCamera key={`persp-cam-${room}-${resetKey}`} makeDefault position={position} fov={45} near={0.1} far={100} />
      <OrbitControls
        key={`persp-ctl-${room}-${resetKey}`}
        makeDefault
        target={target}
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
