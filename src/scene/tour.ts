import { cameraViews, fitToAspect } from './cameraViews'
import type { RoomId, RoomInfo } from './house'

type Vec3 = [number, number, number]

/**
 * The guided tour (Phase 13): for each room, three slow camera moves (a "shot"
 * each): a gentle orbit of the overview, a push-in from the corner, and a pan
 * at eye level. Worked out from the room as laid out, so a resized room gets
 * a matching tour. Plain numbers in, plain numbers out: unit-tested.
 */
export interface TourShot {
  room: RoomId
  /** 'overview' | 'corner' | 'eye', for captions and tests. */
  kind: string
  from: { position: Vec3; target: Vec3 }
  to: { position: Vec3; target: Vec3 }
  /** Seconds. */
  duration: number
  /**
   * Instead of moving from `from` to `to`: circle around `from.target` by this many
   * radians at a steady speed (the turntable video). `to` is ignored.
   */
  orbit?: number
}

export const SHOT_SECONDS = 5

/** Turns a point around the vertical axis through `centre` by `angle` radians. */
function orbit([x, y, z]: Vec3, [cx, , cz]: Vec3, angle: number): Vec3 {
  const dx = x - cx
  const dz = z - cz
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [cx + dx * cos - dz * sin, y, cz + dx * sin + dz * cos]
}

/** A point `t` of the way from `a` to `b`. */
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** Smooth start and stop for a shot (ease in and out). */
export const ease = (t: number) => t * t * (3 - 2 * t)

/** The three shots for one room. `aspect` (width ÷ height of the view) widens the overview on narrow screens. */
export function roomShots(room: RoomId, info: RoomInfo, aspect = 16 / 9): TourShot[] {
  const views = Object.fromEntries(cameraViews(info).map((v) => [v.id, v]))
  const overview = fitToAspect(views.overview, aspect)
  const { corner, eye } = views
  const side = Math.sign(corner.position[0]) || 1
  const halfW = info.width / 2
  return [
    {
      room,
      kind: 'overview',
      // About 25° around the room, ending where the usual overview is.
      from: { position: orbit(overview.position, overview.target, side * 0.45), target: overview.target },
      to: { position: overview.position, target: overview.target },
      duration: SHOT_SECONDS,
    },
    {
      room,
      kind: 'corner',
      // From the corner, a slow step towards the far side of the room.
      from: { position: corner.position, target: corner.target },
      to: { position: lerp3(corner.position, corner.target, 0.18), target: corner.target },
      duration: SHOT_SECONDS,
    },
    {
      room,
      kind: 'eye',
      // Standing inside the front of the room, looking from one side of the far wall to the other.
      from: { position: eye.position, target: [-halfW * 0.45, eye.target[1], eye.target[2]] },
      to: { position: eye.position, target: [halfW * 0.45, eye.target[1], eye.target[2]] },
      duration: SHOT_SECONDS,
    },
  ]
}

/** Where the camera is `seconds` into a shot. */
export function shotPose(shot: TourShot, seconds: number): { position: Vec3; target: Vec3 } {
  const progress = Math.min(Math.max(seconds / shot.duration, 0), 1)
  if (shot.orbit) return { position: orbit(shot.from.position, shot.from.target, shot.orbit * progress), target: shot.from.target }
  const t = ease(progress)
  return { position: lerp3(shot.from.position, shot.to.position, t), target: lerp3(shot.from.target, shot.to.target, t) }
}

/** The whole tour: every listed room in order, three shots each. */
export function tourShots(rooms: { room: RoomId; info: RoomInfo }[], aspect?: number): TourShot[] {
  return rooms.flatMap(({ room, info }) => roomShots(room, info, aspect))
}

/** Length of the turntable video, in seconds. */
export const TURNTABLE_SECONDS = 12

/** One slow, steady circle around the room from its overview (the turntable video). */
export function turntableShot(room: RoomId, info: RoomInfo, aspect = 16 / 9, seconds = TURNTABLE_SECONDS): TourShot {
  const overview = fitToAspect(cameraViews(info)[0], aspect)
  const pose = { position: overview.position, target: overview.target }
  return { room, kind: 'turntable', from: pose, to: pose, duration: seconds, orbit: Math.PI * 2 }
}
