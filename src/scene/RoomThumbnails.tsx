import { useEffect } from 'react'
import { addAfterEffect, useThree } from '@react-three/fiber'
import type { RoomId } from './house'

const WIDTH = 168
const HEIGHT = 104

/**
 * Takes a small picture of the 3D view for the room bar when asked (`request`
 * changes). It waits for the next frame to be drawn and copies the canvas right
 * after drawing, which works without keeping the drawing buffer around (that
 * setting would slow every frame down). The copy is cropped to fill the thumbnail.
 */
export function RoomThumbnails({
  request,
  onCapture,
}: {
  request: { room: RoomId; id: number } | null
  onCapture: (room: RoomId, url: string) => void
}) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!request) return
    let done = false
    const unsubscribe = addAfterEffect(() => {
      if (done) return
      done = true
      const source = gl.domElement
      const canvas = document.createElement('canvas')
      canvas.width = WIDTH
      canvas.height = HEIGHT
      const ctx = canvas.getContext('2d')
      if (ctx && source.width > 0 && source.height > 0) {
        // "Cover" crop: fill the thumbnail, cutting off whatever doesn't fit.
        const scale = Math.max(WIDTH / source.width, HEIGHT / source.height)
        const w = WIDTH / scale
        const h = HEIGHT / scale
        ctx.drawImage(source, (source.width - w) / 2, (source.height - h) / 2, w, h, 0, 0, WIDTH, HEIGHT)
        onCapture(request.room, canvas.toDataURL('image/jpeg', 0.72))
      }
      unsubscribe()
    })
    invalidate() // make sure a frame is drawn
    return () => unsubscribe()
    // A new request (new id) is what triggers a capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id])

  return null
}
