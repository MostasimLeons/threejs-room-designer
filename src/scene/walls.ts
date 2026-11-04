import { ROOM } from './roomConfig'
import type { Opening, RoomInfo, WallSide } from './house'

/**
 * Wall geometry as plain numbers, so it can be unit-tested without a browser.
 *
 * Every wall is built in its own "local" frame: x runs along the wall, y is up,
 * and +z points into the room. The origin is the middle of the wall's thickness,
 * level with the floor. RoomShell.tsx then places and turns that frame.
 */

type Vec3 = [number, number, number]

export interface WallFrame {
  /** Centre line of the wall, in room coordinates. */
  position: Vec3
  /** Turn around the vertical axis that makes local +z point into the room. */
  rotationY: number
  /** Full length of the wall pieces. The back and front walls also cover the corners. */
  length: number
  /** Length of the inside face (between the neighbouring walls): where skirting runs. */
  innerLength: number
  /** Converts an opening's `at` (room coordinates) to a position along the wall's local x. */
  toLocal: (at: number) => number
}

const T = ROOM.wallThickness

export function wallFrame(side: WallSide, room: Pick<RoomInfo, 'width' | 'depth'>): WallFrame {
  const { width: W, depth: D } = room
  switch (side) {
    case 'back': // local x → +x
      return { position: [0, 0, -D / 2 - T / 2], rotationY: 0, length: W + 2 * T, innerLength: W, toLocal: (at) => at }
    case 'front': // local x → -x
      return { position: [0, 0, D / 2 + T / 2], rotationY: Math.PI, length: W + 2 * T, innerLength: W, toLocal: (at) => -at }
    case 'left': // local x → -z
      return { position: [-W / 2 - T / 2, 0, 0], rotationY: Math.PI / 2, length: D, innerLength: D, toLocal: (at) => -at }
    case 'right': // local x → +z
      return { position: [W / 2 + T / 2, 0, 0], rotationY: -Math.PI / 2, length: D, innerLength: D, toLocal: (at) => at }
  }
}

/** True when the camera is outside the room on this wall's side, i.e. the wall would block the view. */
export function isCameraBehindWall(side: WallSide, room: Pick<RoomInfo, 'width' | 'depth'>, camera: { x: number; z: number }): boolean {
  switch (side) {
    case 'back':
      return camera.z < -room.depth / 2
    case 'front':
      return camera.z > room.depth / 2
    case 'left':
      return camera.x < -room.width / 2
    case 'right':
      return camera.x > room.width / 2
  }
}

export interface LocalOpening extends Omit<Opening, 'at'> {
  /** Centre along the wall's local x. */
  center: number
}

/** The wall's openings in local coordinates, sorted left to right along the wall. */
export function localOpenings(side: WallSide, room: Pick<RoomInfo, 'width' | 'depth' | 'openings'>): LocalOpening[] {
  const { toLocal } = wallFrame(side, room)
  return (room.openings[side] ?? []).map(({ at, ...rest }) => ({ ...rest, center: toLocal(at) })).toSorted((a, b) => a.center - b.center)
}

export interface WallPiece {
  position: Vec3
  size: Vec3
}

/**
 * Splits a wall into boxes around its openings, so light really shines through
 * the holes: full-height columns between openings, plus a strip below each
 * window and above each window or door.
 */
export function wallPieces(length: number, openings: LocalOpening[], height = ROOM.height, thickness = T): WallPiece[] {
  const pieces: WallPiece[] = []
  let x = -length / 2
  for (const o of openings) {
    const left = o.center - o.width / 2
    const right = o.center + o.width / 2
    if (left > x) pieces.push({ position: [(x + left) / 2, height / 2, 0], size: [left - x, height, thickness] })
    if (o.bottom > 0) pieces.push({ position: [o.center, o.bottom / 2, 0], size: [o.width, o.bottom, thickness] })
    if (o.top < height) pieces.push({ position: [o.center, (o.top + height) / 2, 0], size: [o.width, height - o.top, thickness] })
    x = right
  }
  const end = length / 2
  if (end > x) pieces.push({ position: [(x + end) / 2, height / 2, 0], size: [end - x, height, thickness] })
  return pieces
}

/** Door casings stick out this far on each side of the opening; skirting stops there. */
export const CASING = 0.07

/** The stretches of the inside face that get skirting: the whole wall minus door openings and their casings. */
export function skirtingRuns(innerLength: number, openings: LocalOpening[]): [number, number][] {
  const runs: [number, number][] = []
  let x = -innerLength / 2
  for (const o of openings) {
    if (o.kind !== 'door') continue
    const start = o.center - o.width / 2 - CASING
    if (start > x) runs.push([x, start])
    x = Math.max(x, o.center + o.width / 2 + CASING)
  }
  if (innerLength / 2 > x) runs.push([x, innerLength / 2])
  return runs
}

/**
 * Problems with a room's openings (empty when fine): an opening that runs past the
 * end of its wall, overlaps another one, or a door that doesn't start at the floor.
 * Used by the tests, so a typo in house.ts is caught before it shows up as a broken wall.
 */
export function openingProblems(room: Pick<RoomInfo, 'width' | 'depth' | 'openings'>): string[] {
  const problems: string[] = []
  for (const side of Object.keys(room.openings) as WallSide[]) {
    const { innerLength } = wallFrame(side, room)
    const list = localOpenings(side, room)
    list.forEach((o, i) => {
      const margin = o.kind === 'door' ? CASING : 0
      if (Math.abs(o.center) + o.width / 2 + margin > innerLength / 2) problems.push(`${side}: "${o.label}" runs past the end of the wall`)
      if (o.kind === 'door' && o.bottom !== 0) problems.push(`${side}: door "${o.label}" must start at the floor`)
      if (o.top > ROOM.height || o.bottom >= o.top) problems.push(`${side}: "${o.label}" has an impossible height`)
      const next = list[i + 1]
      if (next && o.center + o.width / 2 + margin > next.center - next.width / 2)
        problems.push(`${side}: "${o.label}" overlaps "${next.label}"`)
    })
  }
  return problems
}
