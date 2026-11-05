import { describe, expect, it } from 'vitest'
import { FOOT, INCH, formatArea, formatLength, parseLength } from '../utils/units'
import { resolveRoom, ROOM_IDS, ROOMS } from './house'
import { atFromLeft, defaultLayout, distanceFromLeft, isDefaultLayout, LAYOUT_LIMITS, normalizeLayout, parseLayout } from './layout'
import { openingProblems, wallFrame, wallPieces } from './walls'
import { productSize } from './furniture/products'
import { DEFAULT_HOUSE, parseDesign } from '../state/design'
import { clampToRoom } from './furniture/catalog'

/** Phase 14: real-life measurements (units, wall thickness, exact sizes, labels). */

describe('units', () => {
  it('shows lengths in metres, centimetres or feet and inches', () => {
    expect(formatLength(3.5, 'm')).toBe('3.50 m')
    expect(formatLength(3.5, 'cm')).toBe('350 cm')
    expect(formatLength(12 * FOOT + 6 * INCH, 'ft')).toBe('12′ 6″')
    expect(formatLength(3 * INCH + INCH / 2, 'ft')).toBe('3.5″')
    expect(formatLength(2 * FOOT, 'ft')).toBe('2′ 0″')
  })

  it('reads typed lengths in any unit; a bare number is in the chosen unit', () => {
    expect(parseLength('3.5', 'm')).toBeCloseTo(3.5)
    expect(parseLength('350', 'cm')).toBeCloseTo(3.5)
    expect(parseLength('12', 'ft')).toBeCloseTo(12 * FOOT)
    expect(parseLength('350 cm', 'm')).toBeCloseTo(3.5)
    expect(parseLength('1,5 m', 'cm')).toBeCloseTo(1.5)
    expect(parseLength('2500mm', 'm')).toBeCloseTo(2.5)
    expect(parseLength("12'6", 'm')).toBeCloseTo(12 * FOOT + 6 * INCH)
    expect(parseLength('12′ 6″', 'm')).toBeCloseTo(12 * FOOT + 6 * INCH)
    expect(parseLength('12 ft 6 in', 'cm')).toBeCloseTo(12 * FOOT + 6 * INCH)
    expect(parseLength('6in', 'm')).toBeCloseTo(6 * INCH)
    expect(parseLength('10 feet', 'm')).toBeCloseTo(10 * FOOT)
  })

  it('rejects things that are not lengths', () => {
    for (const text of ['', 'abc', '3.5 kg', '12 ft tall', '--1']) expect(parseLength(text, 'm')).toBeNull()
  })

  it('switching units back and forth never changes a stored value', () => {
    const stored = 3.81 // 12′ 6″ to the centimetre
    for (const unit of ['m', 'cm', 'ft'] as const) {
      const shown = formatLength(stored, unit)
      expect(Math.abs(parseLength(shown, unit)! - stored)).toBeLessThan(0.007) // within half an inch / half a cm
    }
  })

  it('shows areas in square metres or square feet', () => {
    expect(formatArea(42, 'm')).toBe('42.0 m²')
    expect(formatArea(42, 'ft')).toBe('452 ft²')
  })
})

describe('room size limits and wall thickness', () => {
  it('allows small and large rooms, low and high ceilings, thin and thick walls', () => {
    const base = defaultLayout('living')
    expect(normalizeLayout({ ...base, width: 1.5, depth: 20, height: 4.5, wallThickness: 0.3 })).toMatchObject({
      width: 1.5,
      depth: 20,
      height: 4.5,
      wallThickness: 0.3,
    })
    const clamped = normalizeLayout({ ...base, width: 0.5, depth: 50, height: 9, wallThickness: 0.01 })
    expect([clamped.width, clamped.depth, clamped.height, clamped.wallThickness]).toEqual([
      LAYOUT_LIMITS.width[0],
      LAYOUT_LIMITS.depth[1],
      LAYOUT_LIMITS.height[1],
      LAYOUT_LIMITS.wallThickness[0],
    ])
  })

  it('walls grow outward: the inside stays the size you set', () => {
    const thin = resolveRoom('living', { ...defaultLayout('living'), wallThickness: 0.1 })
    const thick = resolveRoom('living', { ...defaultLayout('living'), wallThickness: 0.3 })
    expect(wallFrame('back', thin).innerLength).toBe(wallFrame('back', thick).innerLength)
    // The wall's centre line moves out by half the extra thickness; its inside face stays put.
    const insideFace = (info: typeof thin) => wallFrame('back', info).position[2] + info.wallThickness / 2
    expect(insideFace(thin)).toBeCloseTo(-thin.depth / 2)
    expect(insideFace(thick)).toBeCloseTo(-thick.depth / 2)
    expect(wallPieces(5, [], 2.8, 0.3)[0].size[2]).toBe(0.3)
  })

  it.each(ROOM_IDS)('%s: openings stay valid at the smallest room size and lowest ceiling', (room) => {
    const tiny = normalizeLayout({ ...defaultLayout(room), width: 1.5, depth: 1.5, height: 2.1 })
    expect(openingProblems(resolveRoom(room, tiny))).toEqual([])
  })

  it('a 20 m room keeps its openings and furniture valid', () => {
    const big = normalizeLayout({ ...defaultLayout('living'), width: 20, depth: 20, height: 4.5 })
    expect(openingProblems(resolveRoom('living', big))).toEqual([])
    for (const item of DEFAULT_HOUSE.living.items) expect(clampToRoom(item, big)).toEqual(item.position)
  })
})

describe('windows and doors measured from the corner', () => {
  it.each(['back', 'front', 'left', 'right'] as const)('%s wall: the distance from the left corner converts back exactly', (side) => {
    const size = { width: 6, depth: 4 }
    const at = atFromLeft(side, size, 1.2, 0.85)
    expect(distanceFromLeft(side, size, { at, width: 1.2 })).toBeCloseTo(0.85)
  })

  it('the Living Room window is 0.90 m from the back wall’s left corner', () => {
    // Window at x = -1.9, 1.4 m wide, in a 7 m wide room: its left edge is 3.5 - 1.9 - 0.7 = 0.9 m from the left corner.
    const [window] = ROOMS.living.openings.back!
    expect(distanceFromLeft('back', ROOMS.living, window)).toBeCloseTo(0.9)
  })
})

describe('saving measurements', () => {
  it('older saved layouts without a wall thickness get the standard 12 cm', () => {
    const { wallThickness: _drop, ...old } = defaultLayout('kitchen')
    const parsed = parseLayout({ ...old, width: 5 })!
    expect(parsed.wallThickness).toBe(0.12)
    expect(parsed.width).toBe(5)
  })

  it('a changed wall thickness is saved; the standard layout is still not stored', () => {
    const design = { ...DEFAULT_HOUSE.bedroom, layout: { ...defaultLayout('bedroom'), wallThickness: 0.2 } }
    expect(parseDesign(JSON.parse(JSON.stringify(design)), 'bedroom')?.layout?.wallThickness).toBe(0.2)
    expect(isDefaultLayout('bedroom', defaultLayout('bedroom'))).toBe(true)
    expect(isDefaultLayout('bedroom', design.layout)).toBe(false)
  })
})

describe('furniture sizes in the chosen unit', () => {
  it('shows width × depth × height', () => {
    expect(productSize({ type: 'sofa', variant: '3-seat' })).toBe('220 × 90 × 85 cm')
    expect(productSize({ type: 'sofa', variant: '3-seat' }, 'm')).toBe('2.20 × 0.90 × 0.85 m')
    expect(productSize({ type: 'diningTable', variant: 'round' }, 'ft')).toBe('Ø 3′ 11″ × 2′ 5.5″')
  })
})
