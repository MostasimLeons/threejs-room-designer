import { useEffect } from 'react'
import { addAfterEffect, useThree } from '@react-three/fiber'

/** Long side of the saved picture, in pixels (capped by what the graphics card allows). */
export const SCREENSHOT_LONG_SIDE = 3840
/** Frames drawn at the higher resolution before the copy, so effects and shadows catch up. */
const WARM_UP_FRAMES = 3

/**
 * Saves a high-resolution picture of the 3D view when asked (`request` changes).
 * It raises the canvas resolution for a moment, lets a few frames draw, copies the
 * frame right after it's drawn, then puts the resolution back. The picture is the
 * same view as on screen, just sharper (about 4K on the long side).
 */
export function SceneScreenshot({
  request,
  onCapture,
  longSide = SCREENSHOT_LONG_SIDE,
}: {
  request: number | null
  onCapture: (image: Blob | null) => void
  /** Long side of the picture in pixels (Save image: about 4K). 0 = as on screen (the before/after comparison). */
  longSide?: number
}) {
  const gl = useThree((state) => state.gl)
  const get = useThree((state) => state.get)

  useEffect(() => {
    if (request === null) return
    const { viewport, size, setDpr, invalidate } = get()
    const previousDpr = viewport.dpr
    const maxSize = gl.capabilities.maxTextureSize
    const target = longSide > 0 ? Math.min(longSide, maxSize) / Math.max(size.width, size.height, 1) : previousDpr
    if (target > previousDpr) setDpr(target)

    let frames = 0
    let finished = false
    const unsubscribe = addAfterEffect(() => {
      if (finished) return
      frames += 1
      if (frames < WARM_UP_FRAMES) {
        // Ask for another frame from outside this render loop: an invalidate() made
        // during the loop's own clean-up step is dropped.
        requestAnimationFrame(() => invalidate())
        return
      }
      finished = true
      // Copy now, while the frame is still in the canvas (it isn't kept after drawing).
      const source = gl.domElement
      const copy = document.createElement('canvas')
      copy.width = source.width
      copy.height = source.height
      copy.getContext('2d')?.drawImage(source, 0, 0)
      setDpr(previousDpr)
      unsubscribe()
      copy.toBlob((blob) => onCapture(blob), 'image/png')
    })
    invalidate()
    return () => {
      unsubscribe()
      if (!finished) setDpr(previousDpr)
    }
    // A new request (new id) is what triggers a capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  return null
}
