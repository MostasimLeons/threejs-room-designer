import { clamp } from '../utils/math'
import { ROOMS, WALL_SIDES, type Opening, type RoomId, type RoomLayout, type WallSide } from './house'
import { CASING } from './walls'
import { ROOM } from './roomConfig'

/**
 * Rules for the room layout editor (Phase 12): how big a room can be, and where
 * windows and doors may go. Everything here is plain data in, data out, so the
 * rules are unit-tested and the app can't build a broken wall.
 */

/** Inside sizes (wall to wall), ceiling height and wall thickness, in metres. */
export const LAYOUT_LIMITS = {
  width: [1.5, 20],
  depth: [1.5, 20],
  height: [2.1, 4.5],
  wallThickness: [0.08, 0.3],
} as const

/** Space kept clear between two openings (plus door casings). */
export const OPENING_GAP = 0.15
/** Space kept clear between an opening and the corner of the room (the Bedroom window is 5 cm from its corner). */
export const CORNER_GAP = 0.05

export const OPENING_LIMITS = {
  window: { width: [0.4, 3], bottom: [0.2, 1.6], minHeight: 0.4, belowCeiling: 0.15 },
  door: { width: [0.7, 1.2], top: [1.9, 2.4], belowCeiling: 0.1 },
} as const

/** Which opening: the wall it's on and its place in that wall's list. */
export interface OpeningRef {
  side: WallSide
  index: number
}

/** Selection ids for openings, like 'wall:back' for walls: 'opening:back:0'. */
export const openingSelection = ({ side, index }: OpeningRef) => `opening:${side}:${index}`

export function selectedOpening(id: string | null): OpeningRef | null {
  const match = id?.match(/^opening:(back|right|front|left):(\d+)$/)
  return match ? { side: match[1] as WallSide, index: Number(match[2]) } : null
}

/** The standard layout of a room (from house.ts). */
export function defaultLayout(room: RoomId): RoomLayout {
  const { width, depth, height, wallThickness, openings } = ROOMS[room]
  return { width, depth, height, wallThickness, openings: structuredClone(openings) }
}

/** Inner length of a wall: the room's width for the back and front walls, its depth for the sides. */
export const wallLength = (side: WallSide, size: { width: number; depth: number }) =>
  side === 'back' || side === 'front' ? size.width : size.depth

const cm = (v: number) => Math.round(v * 100) / 100

/** An opening's size, kept within the limits for its kind and the ceiling height. */
function fixOpening(o: Opening, height: number): Opening {
  if (o.kind === 'door') {
    const L = OPENING_LIMITS.door
    const top = clamp(o.top, L.top[0], Math.min(L.top[1], height - L.belowCeiling))
    return { ...o, width: cm(clamp(o.width, L.width[0], L.width[1])), bottom: 0, top: cm(top) }
  }
  const L = OPENING_LIMITS.window
  const maxTop = height - L.belowCeiling
  const bottom = clamp(o.bottom, L.bottom[0], Math.min(L.bottom[1], maxTop - L.minHeight))
  const top = clamp(o.top, bottom + L.minHeight, maxTop)
  return { ...o, width: cm(clamp(o.width, L.width[0], L.width[1])), bottom: cm(bottom), top: cm(top) }
}

/** Half the space an opening needs along its wall, including a door's casing. */
const reach = (o: Opening) => o.width / 2 + (o.kind === 'door' ? CASING : 0)

/**
 * Lays out one wall's openings: keeps each inside the wall (CORNER_GAP from the
 * corners) and OPENING_GAP apart, pushing neighbours aside as needed. If they
 * can't all fit, the last ones in the list are dropped. Keeps the list's order,
 * so selections (by index) stay on the same opening.
 */
function fitWall(openings: Opening[], length: number): Opening[] {
  const kept = [...openings]
  const needed = (list: Opening[]) => list.reduce((sum, o) => sum + 2 * reach(o) + OPENING_GAP, 2 * CORNER_GAP - OPENING_GAP)
  while (kept.length > 0 && needed(kept) > length) kept.pop()
  const order = kept.map((_, i) => i).toSorted((a, b) => kept[a].at - kept[b].at)
  const at = kept.map((o) => o.at)
  // Left to right: each starts after the previous one; then right to left: each ends before the next.
  let min = -length / 2 + CORNER_GAP
  for (const i of order) {
    at[i] = Math.max(at[i], min + reach(kept[i]))
    min = at[i] + reach(kept[i]) + OPENING_GAP
  }
  let max = length / 2 - CORNER_GAP
  for (const i of order.toReversed()) {
    at[i] = Math.min(at[i], max - reach(kept[i]))
    max = at[i] - reach(kept[i]) - OPENING_GAP
  }
  return kept.map((o, i) => ({ ...o, at: cm(at[i]) }))
}

/**
 * Along-the-wall direction as you face the wall from inside the room: +1 when the
 * wall's left-to-right runs along +x / +z in room coordinates (see wallFrame in walls.ts).
 */
const alongSign = (side: WallSide) => (side === 'back' || side === 'right' ? 1 : -1)

/**
 * How far an opening's left edge is from the left corner of its wall, standing in
 * the room facing that wall: what you'd measure with a tape.
 */
export function distanceFromLeft(side: WallSide, size: { width: number; depth: number }, o: Pick<Opening, 'at' | 'width'>): number {
  return alongSign(side) * o.at - o.width / 2 + wallLength(side, size) / 2
}

/** The `at` (centre, room coordinates) for an opening whose left edge is `fromLeft` from the left corner. */
export function atFromLeft(side: WallSide, size: { width: number; depth: number }, width: number, fromLeft: number): number {
  return alongSign(side) * (fromLeft + width / 2 - wallLength(side, size) / 2)
}

/** A valid layout: sizes within the limits, every opening inside its wall and clear of the others. */
export function normalizeLayout(layout: RoomLayout): RoomLayout {
  const width = cm(clamp(layout.width, ...LAYOUT_LIMITS.width))
  const depth = cm(clamp(layout.depth, ...LAYOUT_LIMITS.depth))
  const height = cm(clamp(layout.height, ...LAYOUT_LIMITS.height))
  // Millimetre precision: walls are often 10.5 or 11.5 cm.
  const wallThickness = Math.round(clamp(layout.wallThickness ?? ROOM.wallThickness, ...LAYOUT_LIMITS.wallThickness) * 1000) / 1000
  const openings: Partial<Record<WallSide, Opening[]>> = {}
  for (const side of WALL_SIDES) {
    const list = (layout.openings[side] ?? []).map((o) => fixOpening(o, height))
    if (list.length) openings[side] = fitWall(list, wallLength(side, { width, depth }))
  }
  return { width, depth, height, wallThickness, openings }
}

/** Is this the room's standard layout? (Then the design doesn't need to store it.) */
export function isDefaultLayout(room: RoomId, layout: RoomLayout): boolean {
  return JSON.stringify(normalizeLayout(layout)) === JSON.stringify(normalizeLayout(defaultLayout(room)))
}

/** Free stretches along a wall, between its corners and openings, as [from, to] in room coordinates. */
function freeRuns(side: WallSide, layout: RoomLayout): [number, number][] {
  const length = wallLength(side, layout)
  const taken = (layout.openings[side] ?? []).map((o) => [o.at - reach(o), o.at + reach(o)] as const).toSorted((a, b) => a[0] - b[0])
  const runs: [number, number][] = []
  let x = -length / 2 + CORNER_GAP
  for (const [from, to] of taken) {
    if (from - OPENING_GAP > x) runs.push([x, from - OPENING_GAP])
    x = Math.max(x, to + OPENING_GAP)
  }
  if (length / 2 - CORNER_GAP > x) runs.push([x, length / 2 - CORNER_GAP])
  return runs
}

const NEW_OPENING: Record<Opening['kind'], (height: number) => Omit<Opening, 'at'>> = {
  window: (height) => ({ kind: 'window', label: 'Window', width: 1.2, bottom: 0.9, top: Math.min(2.2, height - 0.3) }),
  door: () => ({ kind: 'door', label: 'Door', width: 0.9, bottom: 0, top: 2.1 }),
}

/**
 * Adds a window or door in the middle of the longest free stretch of wall (any
 * wall), made narrower if needed. Returns the new layout and where it went, or
 * null when no wall has room for one.
 */
export function addOpening(layout: RoomLayout, kind: Opening['kind']): { layout: RoomLayout; ref: OpeningRef } | null {
  const template = NEW_OPENING[kind](layout.height)
  const minWidth = OPENING_LIMITS[kind].width[0]
  const extra = kind === 'door' ? 2 * CASING : 0
  let best: { side: WallSide; from: number; to: number } | null = null
  for (const side of WALL_SIDES) {
    for (const [from, to] of freeRuns(side, layout)) if (!best || to - from > best.to - best.from) best = { side, from, to }
  }
  if (!best || best.to - best.from < minWidth + extra) return null
  const width = Math.min(template.width, best.to - best.from - extra)
  const list = [...(layout.openings[best.side] ?? []), { ...template, width, at: (best.from + best.to) / 2 }]
  const next = normalizeLayout({ ...layout, openings: { ...layout.openings, [best.side]: list } })
  return { layout: next, ref: { side: best.side, index: list.length - 1 } }
}

export function removeOpening(layout: RoomLayout, { side, index }: OpeningRef): RoomLayout {
  const list = (layout.openings[side] ?? []).filter((_, i) => i !== index)
  const openings = { ...layout.openings, [side]: list }
  if (list.length === 0) delete openings[side]
  return normalizeLayout({ ...layout, openings })
}

export type OpeningChanges = Partial<Pick<Opening, 'at' | 'width' | 'bottom' | 'top'>> & { side?: WallSide }

/**
 * Changes one opening (position, size, or which wall it's on) and lays out its
 * wall again. Moving to another wall puts it in the middle of that wall. Returns
 * the new layout and where the opening is now (it may have changed wall).
 */
export function updateOpening(layout: RoomLayout, ref: OpeningRef, changes: OpeningChanges): { layout: RoomLayout; ref: OpeningRef } {
  const current = layout.openings[ref.side]?.[ref.index]
  if (!current) return { layout, ref }
  const { side = ref.side, ...rest } = changes
  const changed: Opening = { ...current, ...rest }
  if (side === ref.side) {
    const list = (layout.openings[side] ?? []).map((o, i) => (i === ref.index ? changed : o))
    return { layout: normalizeLayout({ ...layout, openings: { ...layout.openings, [side]: list } }), ref }
  }
  const without = removeOpening(layout, ref)
  const target = [...(without.openings[side] ?? []), { ...changed, at: 0 }]
  return {
    layout: normalizeLayout({ ...without, openings: { ...without.openings, [side]: target } }),
    ref: { side, index: target.length - 1 },
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Reads a saved layout; null if it's missing or not a layout (the room then keeps its standard one). */
export function parseLayout(raw: unknown): RoomLayout | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { width, depth, height, wallThickness, openings } = raw as Record<string, unknown>
  if (!isNum(width) || !isNum(depth) || !isNum(height) || typeof openings !== 'object' || openings === null) return null
  const parsed: Partial<Record<WallSide, Opening[]>> = {}
  for (const side of WALL_SIDES) {
    const list = (openings as Record<string, unknown>)[side]
    if (!Array.isArray(list)) continue
    const good = list.filter(
      (o): o is Opening =>
        typeof o === 'object' &&
        o !== null &&
        (o.kind === 'window' || o.kind === 'door') &&
        typeof o.label === 'string' &&
        o.label.length <= 40 &&
        isNum(o.at) &&
        isNum(o.width) &&
        isNum(o.bottom) &&
        isNum(o.top),
    )
    if (good.length)
      parsed[side] = good.map(({ kind, label, at, width: w, bottom, top, curtains }) => ({
        kind,
        label,
        at,
        width: w,
        bottom,
        top,
        ...(curtains === true ? { curtains } : {}),
      }))
  }
  // Layouts saved before Phase 14 have no wall thickness: the standard 12 cm.
  return normalizeLayout({
    width,
    depth,
    height,
    wallThickness: isNum(wallThickness) ? wallThickness : ROOM.wallThickness,
    openings: parsed,
  })
}
