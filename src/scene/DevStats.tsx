import { useEffect } from 'react'
import { addAfterEffect, useThree } from '@react-three/fiber'

/**
 * Small performance readout in the corner of the 3D view, for measuring the
 * effect of rendering changes. Turn it on by adding `?perf` to the URL
 * (e.g. http://localhost:5173/?perf). It works in dev and in `npm run preview`.
 *
 * - Frames: how many frames have been drawn. The canvas only draws when
 *   something changes, so this should stand still while you're not interacting.
 * - Draw calls / triangles: the GPU work for the last frame. Fewer is faster.
 * - window.roomDesigner3d.get() returns the React Three Fiber state (scene, camera, gl)
 *   for poking at the scene in the browser console.
 * - Geometries / textures / shaders: what's loaded on the GPU. These should not
 *   keep growing as you edit; if they do, something isn't being freed.
 */
export function DevStats() {
  const gl = useThree((state) => state.gl)
  const get = useThree((state) => state.get)

  // For debugging in the browser console while ?perf is on: window.roomDesigner3d.scene etc.
  useEffect(() => {
    const w = window as unknown as { roomDesigner3d?: unknown }
    w.roomDesigner3d = { get }
    return () => {
      delete w.roomDesigner3d
    }
  }, [get])

  useEffect(() => {
    // A plain DOM element on top of the canvas. Updated directly (not via React
    // state) so the readout itself never causes extra renders.
    const el = document.createElement('pre')
    el.className = 'dev-stats'
    gl.domElement.parentElement?.appendChild(el)

    // Three.js normally zeroes its counters at the start of every render() call, so an
    // extra pass in a frame (shadow map, environment, render target) would overwrite the
    // main one. Counting the whole frame ourselves gives the real total.
    gl.info.autoReset = false
    gl.info.reset()
    let frames = 0

    // Runs after each frame has been drawn, so the numbers are for the frame on screen.
    const unsubscribe = addAfterEffect(() => {
      frames += 1
      const { render, memory, programs } = gl.info
      el.textContent = [
        `frames     ${frames}`,
        `draw calls ${render.calls}`,
        `triangles  ${render.triangles.toLocaleString()}`,
        `geometries ${memory.geometries}`,
        `textures   ${memory.textures}`,
        `shaders    ${programs?.length ?? 0}`,
      ].join('\n')
      gl.info.reset()
    })

    return () => {
      unsubscribe()
      gl.info.autoReset = true
      el.remove()
    }
  }, [gl])

  return null
}

/** True when the URL contains `?perf`. */
export const PERF_ENABLED = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf')
