import { clamp } from '../../utils/math'
import {
  findOverlaps,
  footprintHalfExtents,
  isWallMounted,
  NEEDS_SURFACE,
  needsSurface,
  placeInRoom,
  type FixedZone,
  type FurnitureItem,
} from './catalog'
import { findSpotOnSurface } from './surfaces'

/**
 * Where to put furniture: finding a free spot for a new or duplicated piece,
 * snapping a dragged piece flush against a wall, and measuring the gaps between
 * a piece and the walls (for the dimension guides). Pure maths, so it's tested.
 */

type Room = { width: number; depth: number }
type Placeable = Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'rotation' | 'size'>

/** Half the size of a piece along x and z, after its rotation (round pieces don't change). */
export const halfExtents = (item: Placeable): [number, number] => footprintHalfExtents(item)

/** Does the piece overlap something? (Standing on the floor when it needs a desk doesn't count here.) */
function blocked(items: FurnitureItem[], zones: FixedZone[], id: string): boolean {
  return (findOverlaps(items, zones).get(id) ?? []).some((other) => other !== NEEDS_SURFACE)
}

/** How close (in metres) a dragged piece has to get before it snaps flush to a wall. */
export const WALL_SNAP = 0.12

/**
 * If a piece is within `threshold` of a wall, move it flush against that wall
 * (both walls in a corner). Otherwise leave it where it is.
 */
export function snapToWalls(item: Placeable, room: Room, threshold = WALL_SNAP): [number, number] {
  const [hx, hz] = halfExtents(item)
  const maxX = room.width / 2 - hx
  const maxZ = room.depth / 2 - hz
  let [x, z] = item.position
  if (maxX - Math.abs(x) < threshold) x = Math.sign(x || 1) * maxX
  if (maxZ - Math.abs(z) < threshold) z = Math.sign(z || 1) * maxZ
  return [x, z]
}

/** Gaps in metres between the piece's footprint and each wall. */
export function wallGaps(item: Placeable, room: Room): { left: number; right: number; back: number; front: number } {
  const [hx, hz] = halfExtents(item)
  const [x, z] = item.position
  return {
    left: x - hx + room.width / 2,
    right: room.width / 2 - (x + hx),
    back: z - hz + room.depth / 2,
    front: room.depth / 2 - (z + hz),
  }
}

/**
 * A spot where `item` fits inside the room without overlapping other furniture or
 * built-in units. Tries `near` first, then rings of positions around it in 25 cm
 * steps. If the room is too full, falls back to `near` (kept inside the walls);
 * the overlap warning then shows, as it would after any manual move.
 */
export function findFreeSpot(
  item: Placeable,
  others: FurnitureItem[],
  room: Room,
  zones: FixedZone[],
  near: [number, number] = [0, 0],
): [number, number] {
  const step = 0.25
  const maxRing = Math.ceil(Math.max(room.width, room.depth) / step)
  const fits = (position: [number, number], rotation: number) => {
    const probe = { ...item, id: '__probe__', color: '#000000', position, rotation } as FurnitureItem
    return !blocked([probe, ...others], zones, probe.id)
  }
  // A new wall piece (no preferred spot; a duplicate asks for one next to the original):
  if (isWallMounted(item.type) && near[0] === 0 && near[1] === 0) {
    // Along the walls: the back wall first (the one you face in the usual views), then
    // the sides, then the front, each from its middle outwards.
    const walls: [number, number][] = [
      [0, -room.depth / 2],
      [-room.width / 2, 0],
      [room.width / 2, 0],
      [0, room.depth / 2],
    ]
    for (const [wx, wz] of walls) {
      const length = wz === 0 ? room.depth : room.width
      for (let k = 0; k <= Math.ceil(length / step); k++) {
        const offset = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step
        const spot = placeInRoom({ ...item, position: wz === 0 ? [wx, offset] : [offset, wz] }, room)
        if (fits(spot.position, spot.rotation)) return [round(spot.position[0]), round(spot.position[1])]
      }
    }
  }
  for (let ring = 0; ring <= maxRing; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue // only the ring's edge
        const spot = placeInRoom({ ...item, position: [near[0] + i * step, near[1] + j * step] }, room)
        if (fits(spot.position, spot.rotation)) return [round(spot.position[0]), round(spot.position[1])]
      }
    }
  }
  return placeInRoom({ ...item, position: near }, room).position
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * Where a new piece from the catalog goes, and in which option: the first option
 * (the default) if it fits somewhere free, otherwise the first one that does (a
 * round dining table in a kitchen with no room for a long one). If none fits,
 * the first option anyway; the overlap warning then shows.
 * A desk-top piece (a monitor, a lamp) goes onto a desk or table with room for it
 * (Phase 17); with none in the room it stands on the floor and is flagged.
 */
export function placeNew(
  item: FurnitureItem,
  variants: string[],
  others: FurnitureItem[],
  room: Room,
  zones: FixedZone[],
): { variant: string; position: [number, number]; rotation: number; on?: string } {
  if (needsSurface(item.type)) {
    for (const variant of variants) {
      const spot = findSpotOnSurface({ ...item, variant }, others)
      if (spot) return { variant, ...spot }
    }
  }
  for (const variant of variants) {
    const candidate = { ...item, variant }
    const spot = placeInRoom({ ...candidate, position: findFreeSpot(candidate, others, room, zones) }, room)
    if (!blocked([...others, { ...candidate, ...spot }], zones, item.id)) return { variant, ...spot }
  }
  const fallback = { ...item, variant: variants[0] }
  return { variant: variants[0], ...placeInRoom({ ...fallback, position: findFreeSpot(fallback, others, room, zones) }, room) }
}

/** Keeps a number tidy for display and saving (centimetre precision). */
export const toCm = (metres: number) => Math.round(clamp(metres, -1e6, 1e6) * 100)
