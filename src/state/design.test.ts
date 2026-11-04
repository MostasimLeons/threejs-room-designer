import { describe, expect, it } from 'vitest'
import { DEFAULT_BEDROOM_DESIGN, DEFAULT_DESIGN, DEFAULT_HOUSE, parseDesign, parseHouseDesign } from './design'
import { DEFAULT_FINISHES } from '../scene/finishes'
import { ROOM_IDS, ROOMS } from '../scene/house'
import { DEFAULT_LIGHTING } from '../scene/sun'

const sofa = { id: 's1', type: 'sofa', variant: '3-seat', position: [0, 0], rotation: 0, color: '#aabbcc' }

describe('parseDesign', () => {
  it('reads a valid design unchanged', () => {
    expect(parseDesign(DEFAULT_DESIGN)).toEqual(DEFAULT_DESIGN)
  })

  it('returns null for things that are not designs', () => {
    expect(parseDesign(null)).toBeNull()
    expect(parseDesign('hello')).toBeNull()
    expect(parseDesign({ finishes: {} })).toBeNull()
  })

  it('skips broken entries instead of failing the whole file', () => {
    const design = parseDesign({
      items: [
        sofa,
        { ...sofa, id: 'bad-type', type: 'spaceship' },
        { ...sofa, id: 'bad-colour', color: 'red' },
        { ...sofa, id: 'bad-position', position: [0] },
        { ...sofa, id: 'nan', rotation: Number.NaN },
        'not an object',
      ],
    })
    expect(design?.items.map((item) => item.id)).toEqual(['s1'])
  })

  it('drops duplicate ids, keeping the first', () => {
    const design = parseDesign({ items: [sofa, { ...sofa, color: '#000000' }] })
    expect(design?.items).toHaveLength(1)
    expect(design?.items[0].color).toBe('#aabbcc')
  })

  it('replaces an unknown variant with the default one', () => {
    expect(parseDesign({ items: [{ ...sofa, variant: '9-seat' }] })?.items[0].variant).toBe('3-seat')
  })

  it('normalises rotation and moves out-of-room pieces back inside', () => {
    const [piece] = parseDesign({ items: [{ ...sofa, position: [50, 50], rotation: 450 }] })!.items
    expect(piece.rotation).toBe(90)
    expect(Math.abs(piece.position[0])).toBeLessThanOrEqual(ROOMS.living.width / 2)
    expect(Math.abs(piece.position[1])).toBeLessThanOrEqual(ROOMS.living.depth / 2)
  })

  it('uses the right room size for clamping', () => {
    const plant = { id: 'p', type: 'plant', variant: 'small', position: [50, 0], rotation: 0, color: '#aabbcc' }
    const [piece] = parseDesign({ items: [plant] }, 'bathroom')!.items
    expect(piece.position[0]).toBeLessThanOrEqual(ROOMS.bathroom.width / 2)
  })

  it('skips furniture that does not belong in the room', () => {
    const bed = { id: 'b', type: 'bed', variant: 'king', position: [0, 0], rotation: 0, color: '#aabbcc' }
    expect(parseDesign({ items: [sofa, bed] }, 'living')?.items.map((item) => item.id)).toEqual(['s1'])
    expect(parseDesign({ items: [sofa, bed] }, 'kitchen')?.items).toEqual([])
  })

  it('reads the wall style, and ignores unknown ones', () => {
    expect(parseDesign({ items: [], finishes: { walls: 'tiles' } })?.finishes.walls).toBe('tiles')
    expect(parseDesign({ items: [], finishes: { walls: 'wallpaper' } })?.finishes.walls).toBe('paint')
    // Saves from before tiled walls existed keep each room's default style.
    expect(parseDesign({ items: [], finishes: { wallColor: '#112233' } }, 'bathroom')?.finishes.walls).toBe('tiles')
  })

  it('reads per-wall finishes, skipping broken ones', () => {
    const finishes = {
      wallFinishes: {
        back: { color: '#2a2a2c', style: 'tiles' },
        left: { color: 'red', style: 'paint' },
        roof: { color: '#ffffff', style: 'paint' },
      },
    }
    expect(parseDesign({ items: [], finishes })?.finishes.wallFinishes).toEqual({ back: { color: '#2a2a2c', style: 'tiles' } })
    expect(parseDesign({ items: [], finishes: { wallFinishes: { left: { color: 'red' } } } })?.finishes.wallFinishes).toBeUndefined()
  })

  it('reads time of day and orientation, keeping them in range', () => {
    expect(parseDesign({ items: [], lighting: { time: 19.5, orientation: 90 } })?.lighting).toEqual({ time: 19.5, orientation: 90 })
    expect(parseDesign({ items: [], lighting: { time: 99, orientation: -45 } })?.lighting).toEqual({ time: 21, orientation: 315 })
  })

  it('gives saves from before time of day existed the default light', () => {
    expect(parseDesign({ items: [] })?.lighting).toEqual(DEFAULT_LIGHTING)
    expect(parseDesign({ items: [], lighting: { time: 'noon' } })?.lighting).toEqual(DEFAULT_LIGHTING)
  })

  it('falls back to the default finishes of that room', () => {
    expect(parseDesign({ items: [] }, 'bathroom')?.finishes).toEqual(ROOMS.bathroom.defaultFinishes)
  })

  it('keeps valid finishes and falls back for invalid ones', () => {
    expect(parseDesign({ items: [], finishes: { wallColor: '#112233', floor: 'marble' } })?.finishes).toEqual({
      wallColor: '#112233',
      walls: 'paint',
      floor: 'marble',
    })
    expect(parseDesign({ items: [], finishes: { wallColor: 'blue', floor: 'lava' } })?.finishes).toEqual(DEFAULT_FINISHES)
  })
})

describe('parseHouseDesign', () => {
  it('reads the current whole-house format (all five rooms)', () => {
    expect(parseHouseDesign({ rooms: DEFAULT_HOUSE })).toEqual(DEFAULT_HOUSE)
    expect(Object.keys(DEFAULT_HOUSE).toSorted()).toEqual(ROOM_IDS.toSorted())
  })

  it('upgrades a two-room save (version 2): the new rooms start from their defaults', () => {
    const house = parseHouseDesign({ rooms: { living: { items: [sofa] }, bedroom: DEFAULT_BEDROOM_DESIGN } })
    expect(house?.living.items.map((item) => item.id)).toEqual(['s1'])
    expect(house?.bedroom).toEqual(DEFAULT_BEDROOM_DESIGN)
    for (const id of ['dining', 'kitchen', 'bathroom'] as const) expect(house?.[id]).toEqual(DEFAULT_HOUSE[id])
  })

  it('keeps each room separate: furniture never moves to another room', () => {
    // A sofa saved under "kitchen" (for example in a hand-edited file) is dropped, not moved.
    const house = parseHouseDesign({ rooms: { kitchen: { items: [sofa] } } })
    expect(house?.kitchen.items).toEqual([])
    expect(house?.living).toEqual(DEFAULT_DESIGN)
  })

  it('furnishes a room saved by Phase 2 with only its starter plant, keeping its finishes', () => {
    const starter = { id: 'kitchen-plant', type: 'plant', variant: 'small', position: [-1.7, -1.45], rotation: 0, color: '#ecebe6' }
    const finishes = { wallColor: '#112233', walls: 'paint', floor: 'oak' }
    const house = parseHouseDesign({ rooms: { kitchen: { finishes, items: [starter] } } })
    expect(house?.kitchen.items).toEqual(DEFAULT_HOUSE.kitchen.items)
    expect(house?.kitchen.finishes).toEqual(finishes)
  })

  it('leaves a room alone once it has anything besides the starter plant', () => {
    const starter = { id: 'kitchen-plant', type: 'plant', variant: 'small', position: [0, 0], rotation: 0, color: '#ecebe6' }
    const stool = { id: 'my-stool', type: 'barStool', variant: 'backless', position: [1, 1], rotation: 0, color: '#3a3a3c' }
    const house = parseHouseDesign({ rooms: { kitchen: { items: [starter, stool] } } })
    expect(house?.kitchen.items.map((item) => item.id)).toEqual(['kitchen-plant', 'my-stool'])
  })

  it('fills in a missing room with its default', () => {
    const house = parseHouseDesign({ rooms: { living: { items: [sofa] } } })
    expect(house?.living.items[0].id).toBe('s1')
    expect(house?.bedroom).toEqual(DEFAULT_BEDROOM_DESIGN)
  })

  it('upgrades an old single-room file: it becomes the Living Room', () => {
    const house = parseHouseDesign({ finishes: DEFAULT_FINISHES, items: [sofa] })
    expect(house?.living.items.map((item) => item.id)).toEqual(['s1'])
    expect(house?.bedroom).toEqual(DEFAULT_BEDROOM_DESIGN)
    expect(house?.kitchen).toEqual(DEFAULT_HOUSE.kitchen)
  })

  it('returns null when no room can be read', () => {
    expect(parseHouseDesign({ rooms: {} })).toBeNull()
    expect(parseHouseDesign({ rooms: { living: 'x' } })).toBeNull()
    expect(parseHouseDesign(42)).toBeNull()
  })
})
