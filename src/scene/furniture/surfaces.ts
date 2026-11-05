import { degToRad, normalizeDegrees } from '../../utils/math'
import {
  canGoOnSurface,
  findOverlaps,
  footprintHalfExtents,
  FURNITURE_INFO,
  getVariant,
  isSurfaceHost,
  itemFootprint,
  type FurnitureItem,
} from './catalog'
import { itemHeight } from './products'

/**
 * Pieces standing on desks and tables (Phase 17): a monitor, laptop or lamp has
 * `on` = the id of the desk or table under it. It stands at that top's height
 * (which follows a custom size, e.g. a raised sit-stand desk), stays within its
 * edges, and moves and turns with it. Pure maths, so it's unit-tested.
 */

type Point = [number, number]

/** The height a piece on `host` stands at: the top of the desk or table. */
export const surfaceHeight = (host: Pick<FurnitureItem, 'type' | 'variant' | 'size'>) => itemHeight(host)

/** How high a piece stands: on its desk's top, or on the floor (0). */
export function elevationOf(item: FurnitureItem, items: FurnitureItem[]): number {
  if (!item.on) return 0
  const host = items.find((other) => other.id === item.on)
  return host ? surfaceHeight(host) : 0
}

/** A room point in the host's own frame (x along its width, z along its depth). Same rotation maths as the 3D models. */
export function toHostFrame(point: Point, host: Pick<FurnitureItem, 'position' | 'rotation'>): Point {
  const a = degToRad(host.rotation)
  const dx = point[0] - host.position[0]
  const dz = point[1] - host.position[1]
  return [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]
}

/** A point in the host's own frame back in room coordinates. */
export function fromHostFrame(local: Point, host: Pick<FurnitureItem, 'position' | 'rotation'>): Point {
  const a = degToRad(host.rotation)
  return [
    host.position[0] + local[0] * Math.cos(a) + local[1] * Math.sin(a),
    host.position[1] - local[0] * Math.sin(a) + local[1] * Math.cos(a),
  ]
}

/** Is this room point on the top of `host`? */
export function onTopOf(point: Point, host: FurnitureItem): boolean {
  const [w, d] = itemFootprint(host)
  const [x, z] = toHostFrame(point, host)
  if (getVariant(host.type, host.variant).round) return Math.hypot(x, z) <= w / 2
  return Math.abs(x) <= w / 2 && Math.abs(z) <= d / 2
}

/** Where `item` can stand on `host`: its position moved (if needed) so it stays within the top's edges. */
export function clampToHost(item: FurnitureItem, host: FurnitureItem): Point {
  const [w, d] = itemFootprint(host)
  // The piece's half size along the host's own axes.
  const [hx, hz] = footprintHalfExtents({ ...item, rotation: item.rotation - host.rotation })
  let [x, z] = toHostFrame(item.position, host)
  if (getVariant(host.type, host.variant).round) {
    const max = Math.max(w / 2 - Math.max(hx, hz), 0)
    const r = Math.hypot(x, z)
    if (r > max) [x, z] = r === 0 ? [0, 0] : [(x / r) * max, (z / r) * max]
  } else {
    const maxX = Math.max(w / 2 - hx, 0)
    const maxZ = Math.max(d / 2 - hz, 0)
    x = Math.min(Math.max(x, -maxX), maxX)
    z = Math.min(Math.max(z, -maxZ), maxZ)
  }
  return fromHostFrame([x, z], host)
}

const samePoint = (a: Point, b: Point) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9

/**
 * Tidies which pieces stand on what: a piece whose desk is gone (or isn't a desk or
 * table, or can't stand on one) is back on the floor where it was; the others are
 * kept within their desk's edges. Unchanged pieces are returned as they were.
 */
export function settleOnSurfaces(items: FurnitureItem[]): FurnitureItem[] {
  let changed = false
  const result = items.map((item) => {
    if (!item.on) return item
    const host = items.find((other) => other.id === item.on)
    if (!host || host === item || !isSurfaceHost(host.type) || !canGoOnSurface(item.type) || host.on) {
      changed = true
      const { on: _gone, ...onFloor } = item
      return onFloor
    }
    const position = clampToHost(item, host)
    if (samePoint(position, item.position)) return item
    changed = true
    return { ...item, position }
  })
  return changed ? result : items
}

/**
 * After desks or tables have moved or turned (`before` → `after`), the pieces on
 * them move and turn with them, keeping their place on the top.
 */
export function carryWithHosts(before: FurnitureItem[], after: FurnitureItem[]): FurnitureItem[] {
  const moved = new Map<string, { from: FurnitureItem; to: FurnitureItem }>()
  for (const to of after) {
    if (!isSurfaceHost(to.type)) continue
    const from = before.find((item) => item.id === to.id)
    if (from && (!samePoint(from.position, to.position) || from.rotation !== to.rotation)) moved.set(to.id, { from, to })
  }
  if (moved.size === 0) return after
  return after.map((item) => {
    const host = item.on ? moved.get(item.on) : undefined
    if (!host) return item
    // From where it was before (the drag may have moved it too, but not while its desk moved).
    const previous = before.find((other) => other.id === item.id) ?? item
    const local = toHostFrame(previous.position, host.from)
    return {
      ...item,
      position: fromHostFrame(local, host.to),
      rotation: normalizeDegrees(previous.rotation + host.to.rotation - host.from.rotation),
    }
  })
}

/** The desks and tables in `items` a piece could stand on, `prefer` first. */
function hostsFor(items: FurnitureItem[], prefer?: string): FurnitureItem[] {
  const hosts = items.filter((item) => isSurfaceHost(item.type))
  return prefer ? [...hosts.filter((h) => h.id === prefer), ...hosts.filter((h) => h.id !== prefer)] : hosts
}

/**
 * A free spot for `item` on a desk or table: at the back of the top for a monitor,
 * the front for a keyboard, the middle otherwise; facing the same way as the desk
 * (towards where you sit). Tries `prefer` first, then every other desk and table.
 * Null if nothing has room.
 */
export function findSpotOnSurface(
  item: FurnitureItem,
  items: FurnitureItem[],
  prefer?: string,
): { position: Point; rotation: number; on: string } | null {
  const spot = FURNITURE_INFO[item.type].surfaceSpot ?? 'middle'
  for (const host of hostsFor(items, prefer)) {
    const [w, d] = itemFootprint(host)
    const rotation = host.rotation
    const probe = { ...item, rotation, on: host.id }
    const [hx, hz] = footprintHalfExtents({ ...probe, rotation: 0 })
    if (hx * 2 > w + 1e-9 || hz * 2 > d + 1e-9) continue
    const zWanted = spot === 'back' ? -(d / 2 - hz) : spot === 'front' ? d / 2 - hz : 0
    const candidates: Point[] = []
    for (let x = 0; x <= w / 2; x += 0.05) for (const sx of x === 0 ? [1] : [1, -1]) candidates.push([sx * x, zWanted])
    for (let dz = 0.05; dz <= d; dz += 0.05) for (const sz of [1, -1]) candidates.push([0, zWanted + sz * dz])
    for (const local of candidates) {
      const position = clampToHost({ ...probe, position: fromHostFrame(local, host) }, host)
      const others = items.filter((other) => other.on === host.id && other.id !== item.id)
      const test: FurnitureItem = { ...probe, position }
      if (!findOverlaps([...others, test]).has(test.id)) return { position, rotation, on: host.id }
    }
  }
  return null
}
