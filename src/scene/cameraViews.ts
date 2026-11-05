import { ROOMS, type RoomId } from './house'

type Vec3 = [number, number, number]

export type CameraViewId = 'overview' | 'eye' | 'corner'

export interface CameraView {
  id: CameraViewId
  label: string
  position: Vec3
  target: Vec3
}

/** Standing eye height, in metres. */
const EYE = 1.6
/** How far in from the walls the camera stands for the eye-level views. */
const INSET = 0.4

/**
 * The camera views for a room:
 * - Overview: the room's own start view from house.ts (outside and above, walls cut away).
 * - Eye level: standing just inside the front of the room, looking at the window wall,
 *   like walking in. The ceiling and all four walls show, as in a photo.
 * - Corner: standing in a front corner, looking across to the far corner. It uses the
 *   same side as the overview, so it shows the walls the overview shows.
 */
export function cameraViews(room: RoomId): CameraView[] {
  const { width: W, depth: D, camera } = ROOMS[room]
  const side = Math.sign(camera.position[0]) || 1 // +1: overview from the right, -1: from the left
  return [
    { id: 'overview', label: 'Overview', position: camera.position, target: camera.target },
    { id: 'eye', label: 'Eye level', position: [0, EYE, D / 2 - INSET], target: [0, 1.25, -D / 2 + 0.6] },
    {
      id: 'corner',
      label: 'Corner',
      position: [side * (W / 2 - INSET), EYE, D / 2 - INSET],
      target: [-side * W * 0.2, 1.0, -D * 0.2],
    },
  ]
}

export function cameraView(room: RoomId, id: CameraViewId): CameraView {
  return cameraViews(room).find((view) => view.id === id) ?? cameraViews(room)[0]
}

/** The start views are framed for a view about this wide (width ÷ height) or wider. */
const FIT_ASPECT = 1.35

/**
 * Pulls the overview camera back on tall, narrow 3D views (a phone, or a mid-size
 * window with both side panels open), so the whole room still fits. The views from
 * inside the room are left alone: stepping back would put the camera outside.
 */
export function fitToAspect(view: CameraView, aspect: number): CameraView {
  if (view.id !== 'overview' || aspect >= FIT_ASPECT) return view
  const scale = Math.min(FIT_ASPECT / Math.max(aspect, 0.3), 1.9)
  const [tx, ty, tz] = view.target
  const [px, py, pz] = view.position
  return { ...view, position: [tx + (px - tx) * scale, ty + (py - ty) * scale, tz + (pz - tz) * scale] }
}
