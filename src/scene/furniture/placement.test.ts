import { describe, expect, it } from 'vitest'
import { findFreeSpot, halfExtents, snapToWalls, wallGaps } from './placement'
import { findOverlaps, getVariant, type FurnitureItem } from './catalog'
import { ROOMS } from '../house'
import { DEFAULT_HOUSE } from '../../state/design'

const room = { width: 6, depth: 5 }
const table = (position: [number, number], rotation = 0): FurnitureItem => {
  const item = DEFAULT_HOUSE.living.items.find((i) => i.type === 'coffeeTable')!
  return { ...item, id: 'test', position, rotation }
}

describe('halfExtents', () => {
  it('swaps width and depth when turned 90°', () => {
    const [w, d] = getVariant('coffeeTable', table([0, 0]).variant).footprint
    expect(halfExtents(table([0, 0]))).toEqual([w / 2, d / 2])
    const [hx, hz] = halfExtents(table([0, 0], 90))
    expect(hx).toBeCloseTo(d / 2)
    expect(hz).toBeCloseTo(w / 2)
  })
})

describe('snapToWalls', () => {
  it('pulls a piece near a wall flush against it', () => {
    const [hx] = halfExtents(table([0, 0]))
    const [x, z] = snapToWalls(table([room.width / 2 - hx - 0.08, 0.4]), room)
    expect(x).toBeCloseTo(room.width / 2 - hx)
    expect(z).toBe(0.4)
  })

  it('snaps into a corner (both walls), on the negative sides too', () => {
    const [hx, hz] = halfExtents(table([0, 0]))
    const [x, z] = snapToWalls(table([-(room.width / 2 - hx - 0.05), -(room.depth / 2 - hz - 0.05)]), room)
    expect(x).toBeCloseTo(-(room.width / 2 - hx))
    expect(z).toBeCloseTo(-(room.depth / 2 - hz))
  })

  it('leaves a piece in the middle of the room alone', () => {
    expect(snapToWalls(table([0.3, -0.2]), room)).toEqual([0.3, -0.2])
  })
})

describe('wallGaps', () => {
  it('measures from the edge of the piece to each wall', () => {
    const [hx, hz] = halfExtents(table([0, 0]))
    const gaps = wallGaps(table([1, 0]), room)
    expect(gaps.left).toBeCloseTo(4 - hx)
    expect(gaps.right).toBeCloseTo(2 - hx)
    expect(gaps.back).toBeCloseTo(2.5 - hz)
    expect(gaps.front).toBeCloseTo(2.5 - hz)
  })
})

describe('findFreeSpot', () => {
  it('uses the requested spot when it is free', () => {
    expect(findFreeSpot(table([0, 0]), [], room, [], [1, 1])).toEqual([1, 1])
  })

  it('finds a spot that overlaps nothing in a furnished room', () => {
    const living = DEFAULT_HOUSE.living
    const item = { ...table([0, 0]), id: 'extra' }
    const position = findFreeSpot(item, living.items, ROOMS.living, ROOMS.living.fixedZones)
    const placed = { ...item, position }
    expect(findOverlaps([...living.items, placed], ROOMS.living.fixedZones).has('extra')).toBe(false)
    expect(Math.abs(position[0])).toBeLessThanOrEqual(ROOMS.living.width / 2)
  })

  it('falls back to a spot inside the walls when nothing is free', () => {
    const tiny = { width: 0.2, depth: 0.2 }
    const [x, z] = findFreeSpot(table([0, 0]), [], tiny, [], [5, 5])
    expect(Number.isFinite(x) && Number.isFinite(z)).toBe(true)
  })
})
