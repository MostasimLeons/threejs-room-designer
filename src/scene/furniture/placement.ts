import { clamp } from '../../utils/math'
import { clampToRoom, findOverlaps, footprintHalfExtents, type FixedZone, type FurnitureItem } from './catalog'

/**
 * Where to put furniture: finding a free spot for a new or duplicated piece,
 * snapping a dragged piece flush against a wall, and measuring the gaps between
 * a piece and the walls (for the dimension guides). Pure maths, so it's tested.
 */

type Room = { width: number; depth: number }
type Placeable = Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'rotation'>

/** Half the size of a piece along x and z, after its rotation (round pieces don't change). */
export const halfExtents = (item: Placeable): [number, number] => footprintHalfExtents(item)

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
  const fits = (position: [number, number]) => {
    const probe = { ...item, id: '__probe__', color: '#000000', position } as FurnitureItem
    return !findOverlaps([probe, ...others], zones).has(probe.id)
  }
  for (let ring = 0; ring <= maxRing; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue // only the ring's edge
        const candidate = clampToRoom({ ...item, position: [near[0] + i * step, near[1] + j * step] }, room)
        if (fits(candidate)) return [round(candidate[0]), round(candidate[1])]
      }
    }
  }
  return clampToRoom({ ...item, position: near }, room)
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * Where a new piece from the catalog goes, and in which option: the first option
 * (the default) if it fits somewhere free, otherwise the first one that does (a
 * round dining table in a kitchen with no room for a long one). If none fits,
 * the first option anyway; the overlap warning then shows.
 */
export function placeNew(
  item: FurnitureItem,
  variants: string[],
  others: FurnitureItem[],
  room: Room,
  zones: FixedZone[],
): { variant: string; position: [number, number] } {
  for (const variant of variants) {
    const candidate = { ...item, variant }
    const position = findFreeSpot(candidate, others, room, zones)
    if (!findOverlaps([...others, { ...candidate, position }], zones).has(item.id)) return { variant, position }
  }
  return { variant: variants[0], position: findFreeSpot({ ...item, variant: variants[0] }, others, room, zones) }
}

/** Keeps a number tidy for display and saving (centimetre precision). */
export const toCm = (metres: number) => Math.round(clamp(metres, -1e6, 1e6) * 100)
