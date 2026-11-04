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

type Vec3 = [number, number, number]

/** Perspective start positions per room. The Living Room keeps its original values. */
const PERSPECTIVE: Record<RoomId, { position: Vec3; target: Vec3 }> = {
  living: { position: [6.2, 4.4, 6.4], target: [0, 0.8, -0.8] },
  // Same idea for the smaller Bedroom: from the front-right, looking at the bed wall.
  bedroom: (() => {
    const [cx, cz] = ROOMS.bedroom.center
    return { position: [cx + 5.4, 4.5, cz + 6.0] as Vec3, target: [cx - 0.2, 0.7, cz - 0.4] as Vec3 }
  })(),
}

/**
 * Perspective view: a normal 3D camera you can orbit around the room.
 * Plan view: an orthographic (no perspective distortion) camera looking
 * straight down, like an architect's floor plan. Rotation is disabled there.
 */
export function CameraRig({ view, resetKey, room }: CameraRigProps) {
  const size = useThree((state) => state.size)
  const { width, depth, center } = ROOMS[room]
  const [cx, cz] = center

  if (view === 'plan') {
    // Fit the whole room (plus a margin) into the canvas.
    const zoom = Math.min(size.width / (width + 1.6), size.height / (depth + 1.6))
    return (
      <>
        {/* The tiny z offset avoids a maths edge case when looking exactly straight down. */}
        <OrthographicCamera key={`plan-cam-${room}-${resetKey}`} makeDefault position={[cx, 20, cz + 0.001]} zoom={zoom} near={0.1} far={100} />
        <OrbitControls
          key={`plan-ctl-${room}-${resetKey}`}
          makeDefault
          target={[cx, 0, cz]}
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

  const { position, target } = PERSPECTIVE[room]
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
