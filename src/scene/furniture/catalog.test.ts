import { describe, expect, it } from 'vitest'
import { clampToRoom, DEFAULT_LAYOUTS, findOverlaps, FURNITURE_INFO, getVariant, isAllowedIn, type FurnitureItem } from './catalog'
import { ROOM_IDS, ROOMS } from '../house'

const room = { width: 4, depth: 4 }

/** A 2 × 1 m sofa, handy because its width and depth differ. */
function item(position: [number, number], rotation = 0, id = 'a'): FurnitureItem {
  return { id, type: 'sofa', variant: '2-seat', position, rotation, color: '#ffffff' }
}

describe('getVariant', () => {
  it('finds a variant by id', () => {
    expect(getVariant('sofa', '4-seat').id).toBe('4-seat')
  })
  it('falls back to the default (first) variant for unknown ids', () => {
    expect(getVariant('sofa', 'nope').id).toBe(FURNITURE_INFO.sofa.variants[0].id)
  })
})

describe('clampToRoom', () => {
  it('leaves a piece that is already inside alone', () => {
    expect(clampToRoom(item([0.5, -0.5]), room)).toEqual([0.5, -0.5])
  })

  it('pushes a piece back inside the walls', () => {
    const [w, d] = getVariant('sofa', '2-seat').footprint
    expect(clampToRoom(item([10, 10]), room)).toEqual([room.width / 2 - w / 2, room.depth / 2 - d / 2])
  })

  it('swaps width and depth when rotated 90°', () => {
    const [w, d] = getVariant('sofa', '2-seat').footprint
    const [x, z] = clampToRoom(item([10, 10], 90), room)
    expect(x).toBeCloseTo(room.width / 2 - d / 2)
    expect(z).toBeCloseTo(room.depth / 2 - w / 2)
  })
})

describe('findOverlaps', () => {
  it('reports two pieces on top of each other, both ways', () => {
    const overlaps = findOverlaps([item([0, 0], 0, 'a'), item([0.5, 0], 0, 'b')])
    expect(overlaps.get('a')).toEqual(['b'])
    expect(overlaps.get('b')).toEqual(['a'])
  })

  it('does not count pieces that only touch', () => {
    const [w] = getVariant('sofa', '2-seat').footprint
    expect(findOverlaps([item([0, 0], 0, 'a'), item([w, 0], 0, 'b')]).size).toBe(0)
  })

  it('takes rotation into account', () => {
    const [w, d] = getVariant('sofa', '2-seat').footprint
    // Side by side along x with a small gap: no overlap...
    const gap = (w + d) / 2 + 0.05
    expect(findOverlaps([item([0, 0], 0, 'a'), item([gap, 0], 90, 'b')]).size).toBe(0)
    // ...but unrotated at the same spot they do overlap.
    expect(findOverlaps([item([0, 0], 0, 'a'), item([gap, 0], 0, 'b')]).size).toBe(2)
  })
})

describe('default layouts', () => {
  it.each(ROOM_IDS)('%s: every piece starts inside its room', (roomId) => {
    for (const piece of DEFAULT_LAYOUTS[roomId]) expect(clampToRoom(piece, ROOMS[roomId])).toEqual(piece.position)
  })

  it.each(ROOM_IDS)('%s: no pieces overlap', (roomId) => {
    expect([...findOverlaps(DEFAULT_LAYOUTS[roomId]).keys()]).toEqual([])
  })

  it.each(ROOM_IDS)('%s: only furniture that belongs in this room', (roomId) => {
    for (const piece of DEFAULT_LAYOUTS[roomId]) expect(isAllowedIn(piece.type, roomId)).toBe(true)
  })

  it('uses unique ids and valid variants, across all rooms', () => {
    const all = ROOM_IDS.flatMap((id) => DEFAULT_LAYOUTS[id])
    expect(new Set(all.map((piece) => piece.id)).size).toBe(all.length)
    for (const piece of all) expect(getVariant(piece.type, piece.variant).id).toBe(piece.variant)
  })
})

describe('isAllowedIn', () => {
  it('keeps furniture in the rooms it belongs to', () => {
    expect(isAllowedIn('bed', 'bedroom')).toBe(true)
    expect(isAllowedIn('bed', 'kitchen')).toBe(false)
    expect(isAllowedIn('sofa', 'bathroom')).toBe(false)
    expect(isAllowedIn('plant', 'bathroom')).toBe(true)
  })

  it('every furniture type belongs to at least one room', () => {
    for (const info of Object.values(FURNITURE_INFO)) expect(info.rooms.length).toBeGreaterThan(0)
  })
})
