import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { CameraControls, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import type CameraControlsImpl from 'camera-controls'
import type { ViewMode } from './roomConfig'
import { ROOMS, type RoomId } from './house'
import { cameraView, fitToAspect, type CameraViewId } from './cameraViews'

interface CameraRigProps {
  view: ViewMode
  /** Changing this number remounts the camera, which resets the view. */
  resetKey: number
  /** The room the camera frames. Switching rooms resets the camera to that room. */
  room: RoomId
  /** Which camera view to show in Perspective (see cameraViews.ts). Changing it glides there. */
  cameraViewId: CameraViewId
}

/**
 * Perspective view: a 3D camera you can orbit (drag), pan (right-drag) and zoom
 * (scroll). Picking a camera view glides smoothly to it. Built on camera-controls,
 * which can animate between positions.
 * Plan view: an orthographic (no perspective distortion) camera looking straight
 * down, like an architect's floor plan. Rotation is disabled there.
 */
export function CameraRig({ view, resetKey, room, cameraViewId }: CameraRigProps) {
  const size = useThree((state) => state.size)
  const { width, depth } = ROOMS[room]

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

  return (
    <PerspectiveRig
      key={`persp-${room}-${resetKey}`}
      room={room}
      cameraViewId={cameraViewId}
      aspect={size.width / Math.max(size.height, 1)}
    />
  )
}

function PerspectiveRig({ room, cameraViewId, aspect }: { room: RoomId; cameraViewId: CameraViewId; aspect: number }) {
  const controls = useRef<CameraControlsImpl>(null)
  const first = useRef(true)
  const start = fitToAspect(cameraView(room, cameraViewId), aspect)

  // Glide to the chosen view. The very first placement (a new room, Reset view) is instant.
  useEffect(() => {
    const target = fitToAspect(cameraView(room, cameraViewId), aspect)
    void controls.current?.setLookAt(...target.position, ...target.target, !first.current)
    first.current = false
    // Only re-run when the chosen view changes; a resize mid-way shouldn't restart the glide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, cameraViewId])

  return (
    <>
      <PerspectiveCamera makeDefault position={start.position} fov={45} near={0.05} far={100} />
      <CameraControls
        ref={controls}
        makeDefault
        // Close enough to stand inside the smallest room, far enough to see the biggest.
        minDistance={0.6}
        maxDistance={16}
        // Stop the camera from going below the floor.
        maxPolarAngle={Math.PI / 2 - 0.06}
        smoothTime={0.55}
        draggingSmoothTime={0.12}
        dollyToCursor
      />
    </>
  )
}
