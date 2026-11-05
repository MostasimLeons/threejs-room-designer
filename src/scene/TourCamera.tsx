import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type CameraControlsImpl from 'camera-controls'
import { shotPose, type TourShot } from './tour'

/**
 * Drives the camera through one tour shot (tour.ts) while the guided tour plays:
 * every frame it places the camera along the shot, so the view keeps drawing,
 * and it tells the app when the shot has ended. While it's in charge, dragging
 * the view does nothing; the camera controls take over again when the tour ends.
 */
export function TourCamera({
  shot,
  shotId,
  paused,
  onEnd,
}: {
  shot: TourShot
  /** A new id restarts from the shot's beginning (the same shot can play twice). */
  shotId: number
  paused: boolean
  onEnd: () => void
}) {
  const get = useThree((state) => state.get)
  const invalidate = useThree((state) => state.invalidate)
  const elapsed = useRef(0)
  const ended = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    elapsed.current = 0
    ended.current = false
    invalidate()
  }, [shotId, invalidate])

  // Hand the camera to the tour, and back afterwards.
  useEffect(() => {
    const controls = get().controls as unknown as CameraControlsImpl | null
    if (!controls) return
    controls.enabled = false
    return () => {
      controls.enabled = true
    }
  }, [get, shotId])

  // Keep drawing while playing (the view otherwise only draws when something changes).
  useEffect(() => {
    if (!paused) invalidate()
  }, [paused, invalidate])

  useFrame((_, delta) => {
    const controls = get().controls as unknown as CameraControlsImpl | null
    if (!controls) return
    // A long gap (the tab was in the background) shouldn't jump the shot forward.
    if (!paused) elapsed.current += Math.min(delta, 0.1)
    const { position, target } = shotPose(shot, elapsed.current)
    void controls.setLookAt(...position, ...target, false)
    if (paused) return
    if (elapsed.current >= shot.duration) {
      if (!ended.current) {
        ended.current = true
        onEndRef.current()
      }
      return
    }
    invalidate()
  })

  return null
}
