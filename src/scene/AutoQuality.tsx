import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AUTO_SAMPLE_FRAMES, autoStep, IDLE_GAP_MS, type QualityLevel } from './quality'

/**
 * Watches how long frames take while the view is moving (orbiting, dragging,
 * gliding between camera views) and steps the quality down when it's slow.
 * Idle time between frames is ignored: the view only draws when something changes.
 */
export function AutoQuality({ level, onStepDown }: { level: QualityLevel; onStepDown: (level: QualityLevel) => void }) {
  const last = useRef(0)
  const times = useRef<number[]>([])

  // Start counting afresh at each level (switching levels causes a slow frame or two).
  useEffect(() => {
    times.current = []
    last.current = 0
  }, [level])

  useFrame(() => {
    const now = performance.now()
    const gap = now - last.current
    last.current = now
    if (gap >= IDLE_GAP_MS) return // the first frame after a pause
    times.current.push(gap)
    if (times.current.length < AUTO_SAMPLE_FRAMES) return
    const next = autoStep(level, times.current)
    times.current = []
    if (next) onStepDown(next)
  })

  return null
}
