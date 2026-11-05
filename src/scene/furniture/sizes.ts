import { getVariant, type FurnitureItem, type FurnitureType } from './catalog'
import { itemHeight, productHeight } from './products'

/**
 * Custom furniture sizes (Phase 15): the standard size of each option, the limits
 * a custom width, depth and height must stay within, and tidying a size before it
 * is stored. A piece without a custom size keeps its option's size, so designs
 * from before Phase 15 are unchanged.
 */

export type Size3 = [number, number, number]
export type SizeLimits = { width: [number, number]; depth: [number, number]; height: [number, number] }

/** The option's own width × depth × height in metres. */
export function standardSize(type: FurnitureType, variant: string): Size3 {
  const [w, d] = getVariant(type, variant).footprint
  return [w, d, productHeight(type, variant) / 100]
}

/** The size a piece is shown and measured at: its custom size, or its option's. */
export function itemSize(item: Pick<FurnitureItem, 'type' | 'variant' | 'size'>): Size3 {
  if (!item.size) return standardSize(item.type, item.variant)
  const { round } = getVariant(item.type, item.variant)
  return round ? [item.size[0], item.size[0], itemHeight(item)] : [...item.size]
}

/** How far a size may go from the standard: half to twice, within the absolute limits below. */
const MIN_FACTOR = 0.5
const MAX_FACTOR = 2

/** Absolute limits in metres: nothing thinner than 3 cm, wider than 4 m or taller than the highest ceiling. */
const ABSOLUTE: SizeLimits = { width: [0.03, 4], depth: [0.02, 4], height: [0.02, 4.4] }

/**
 * Real-life limits for pieces where "half to twice" would give silly results
 * (a desk you can't sit at, a dining chair with a bar-stool seat).
 */
const TYPE_LIMITS: Partial<Record<FurnitureType, Partial<SizeLimits>>> = {
  desk: { width: [0.6, 2.4], depth: [0.4, 1.0], height: [0.6, 0.9] },
  diningTable: { width: [0.6, 3.6], depth: [0.6, 1.4], height: [0.65, 0.8] },
  diningChair: { width: [0.38, 0.65], depth: [0.4, 0.7], height: [0.75, 1.1] },
  deskChair: { width: [0.42, 0.8], depth: [0.42, 0.8], height: [0.75, 1.35] },
  barStool: { height: [0.55, 1.1] },
  drawerUnit: { width: [0.3, 0.6], depth: [0.4, 0.8], height: [0.45, 0.8] },
  pcTower: { width: [0.12, 0.3], depth: [0.25, 0.6], height: [0.2, 0.6] },
  // Up to 125 cm high, so a sit-stand desk can be shown standing.
  officeDesk: { width: [0.8, 2.4], depth: [0.5, 1.0], height: [0.6, 1.25] },
  officeChair: { width: [0.5, 0.8], depth: [0.5, 0.8], height: [0.85, 1.35] },
}

const cm = (metres: number) => Math.round(metres * 100) / 100
const mm = (metres: number) => Math.round(metres * 1000) / 1000
const fit = (n: number, [min, max]: [number, number]) => mm(Math.min(Math.max(n, min), max))

/** The range for each dimension of this option, in metres (rounded to the centimetre). */
export function sizeLimits(type: FurnitureType, variant: string): SizeLimits {
  const standard = standardSize(type, variant)
  const own = TYPE_LIMITS[type] ?? {}
  const range = (key: keyof SizeLimits, value: number): [number, number] => {
    const [absMin, absMax] = own[key] ?? ABSOLUTE[key]
    // A type's own limits always contain the standard size; the general rule is relative.
    const min = own[key] ? absMin : Math.max(absMin, value * MIN_FACTOR)
    const max = own[key] ? absMax : Math.min(absMax, value * MAX_FACTOR)
    return [cm(Math.min(min, value)), cm(Math.max(max, value))]
  }
  return { width: range('width', standard[0]), depth: range('depth', standard[1]), height: range('height', standard[2]) }
}

/**
 * A size made valid: within the limits, to the millimetre, depth = width for round
 * pieces. Returns undefined when it is (practically) the standard size, so the piece
 * is stored as it was before.
 */
export function normalizeSize(type: FurnitureType, variant: string, size: readonly number[] | undefined): Size3 | undefined {
  if (!size || size.length !== 3 || !size.every((n) => typeof n === 'number' && Number.isFinite(n))) return undefined
  const limits = sizeLimits(type, variant)
  const width = fit(size[0], limits.width)
  const { round } = getVariant(type, variant)
  const next: Size3 = [width, round ? width : fit(size[1], limits.depth), fit(size[2], limits.height)]
  const standard = standardSize(type, variant)
  return next.every((n, i) => Math.abs(n - standard[i]) < 0.0005) ? undefined : next
}
