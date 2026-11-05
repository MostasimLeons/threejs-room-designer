import { describe, expect, it } from 'vitest'
import { findOverlaps, FURNITURE_INFO, mountOnWall, placeInRoom, type FurnitureItem, type FurnitureType } from './catalog'
import { FRAME_IDS } from './frames'
import { formatPrice, PRODUCTS, productHeight, productPrice, productSize } from './products'
import { ROOMS } from '../house'
import { DEFAULT_HOUSE, parseDesign } from '../../state/design'
import { createHouseHistory, houseReducer } from '../../state/useDesignHistory'
import { listCount, listTotal, shoppingCsv, shoppingList } from '../../state/shoppingList'

/** Phase 11: frame finishes, product details, the shopping list and pieces that hang on walls. */

const TYPES = Object.keys(FURNITURE_INFO) as FurnitureType[]
const room = { width: 6, depth: 4 }

const piece = (
  type: FurnitureType,
  variant: string,
  position: [number, number],
  id: string = type,
  extra: Partial<FurnitureItem> = {},
): FurnitureItem => ({
  id,
  type,
  variant,
  position,
  rotation: 0,
  color: FURNITURE_INFO[type].swatches[0].color,
  ...extra,
})

describe('frame finishes (legs, frames, handles)', () => {
  it('only offers finishes that exist', () => {
    const problems = TYPES.flatMap((type) =>
      (FURNITURE_INFO[type].frame?.options ?? []).filter((id) => !FRAME_IDS.includes(id)).map((id) => `${type}: ${id}`),
    )
    expect(problems).toEqual([])
  })

  it('saves keep a finish the piece offers and drop any other', () => {
    const items = [
      piece('sofa', '3-seat', [0, 0], 'a', { frame: 'brass' }),
      piece('sofa', '3-seat', [0, 1], 'b', { frame: 'chrome' as never }),
    ]
    const loaded = parseDesign({ items })!.items
    expect(loaded.find((i) => i.id === 'a')?.frame).toBe('brass')
    expect(loaded.find((i) => i.id === 'b')).not.toHaveProperty('frame') // sofas don't come in chrome
  })

  it('choosing a finish is undoable, and "Standard" stores the piece exactly as before', () => {
    const bounds = ROOMS.living
    let state = createHouseHistory(DEFAULT_HOUSE)
    const step = (action: Parameters<typeof houseReducer>[1]['action']) => (state = houseReducer(state, { room: 'living', action }))
    const sofa = () => state.living.present.items.find((i) => i.id === 'sofa')!
    const original = structuredClone(sofa())
    step({ type: 'updateItem', id: 'sofa', changes: { frame: 'black' }, transient: false, bounds })
    expect(sofa().frame).toBe('black')
    step({ type: 'updateItem', id: 'sofa', changes: { frame: undefined }, transient: false, bounds })
    expect(sofa()).toEqual(original)
    expect(Object.keys(sofa())).not.toContain('frame')
    step({ type: 'undo' })
    expect(sofa().frame).toBe('black')
  })
})

describe('product details', () => {
  it('every option of every piece has a height and an example price', () => {
    const problems: string[] = []
    for (const type of TYPES) {
      const { height, price } = PRODUCTS[type]
      for (const { id } of FURNITURE_INFO[type].variants) {
        if (!(price[id] > 0)) problems.push(`${type}/${id}: no price`)
        if (typeof height !== 'number' && !(height[id] > 0)) problems.push(`${type}/${id}: no height`)
      }
      if (!PRODUCTS[type].description || !PRODUCTS[type].materials) problems.push(`${type}: no description`)
    }
    expect(problems).toEqual([])
  })

  it('shows sizes in cm, with a diameter for round pieces, and prices in dollars', () => {
    expect(productSize({ type: 'sofa', variant: '3-seat' })).toBe('220 × 90 × 85 cm')
    expect(productSize({ type: 'diningTable', variant: 'round' })).toBe('Ø 120 × 75 cm')
    expect(productHeight('bed', 'single')).toBe(125)
    expect(productPrice('diningTable', 'long')).toBe(1390)
    expect(formatPrice(1290)).toBe('$1,290')
  })
})

describe('shopping list', () => {
  const house = structuredClone(DEFAULT_HOUSE)
  house.dining.items = [
    piece('diningChair', 'upholstered', [0, 0], 'c1'),
    piece('diningChair', 'upholstered', [1, 0], 'c2'),
    piece('diningChair', 'upholstered', [2, 0], 'c3', { color: '#123456' }),
    piece('diningTable', 'rectangle', [0, 1], 't', { frame: undefined }),
  ]

  it('combines identical pieces and counts them; a different colour is its own line', () => {
    const lines = shoppingList(house, ['dining'])
    const chairs = lines.filter((l) => l.item === 'Dining chair')
    expect(chairs.map((l) => l.quantity)).toEqual([2, 1])
    expect(chairs[1].colour).toBe('Custom #123456')
    expect(chairs[0].total).toBe(2 * productPrice('diningChair', 'upholstered'))
    expect(listCount(lines)).toBe(4)
    expect(listTotal(lines)).toBe(3 * productPrice('diningChair', 'upholstered') + productPrice('diningTable', 'rectangle'))
  })

  it('lists the whole house room by room', () => {
    const lines = shoppingList(DEFAULT_HOUSE, ['living', 'bedroom'])
    expect(new Set(lines.map((l) => l.room))).toEqual(new Set(['Living Room', 'Bedroom']))
    expect(listCount(lines)).toBe(DEFAULT_HOUSE.living.items.length + DEFAULT_HOUSE.bedroom.items.length)
  })

  it('writes a CSV with a header and a total, quoting commas and defusing formulas', () => {
    const lines = shoppingList(house, ['dining'])
    lines[0].colour = '=HYPERLINK("x")'
    lines[1].option = 'Wide, "deluxe"'
    const csv = shoppingCsv(lines).trim().split('\r\n')
    expect(csv[0]).toMatch(/^Room,Item,Option,Colour/)
    expect(csv.at(-1)).toMatch(/Total/)
    expect(csv[1]).toContain(`"'=HYPERLINK(""x"")"`)
    expect(csv[2]).toContain('"Wide, ""deluxe"""')
  })
})

/** A 120 cm landscape print. */
const art = (position: [number, number], id = 'art') => piece('wallArt', 'landscape', position, id)

describe('pieces that hang on a wall', () => {
  it('hang flush on the nearest wall, facing into the room', () => {
    expect(mountOnWall(art([0.5, -1.7]), room)).toEqual({ position: [0.5, -2 + 0.02], rotation: 0 })
    expect(mountOnWall(art([0.5, 1.8]), room)).toEqual({ position: [0.5, 2 - 0.02], rotation: 180 })
    expect(mountOnWall(art([-2.9, 0.3]), room)).toEqual({ position: [-3 + 0.02, 0.3], rotation: 90 })
    expect(mountOnWall(art([2.9, 0.3]), room)).toEqual({ position: [3 - 0.02, 0.3], rotation: 270 })
  })

  it('stay within the wall they hang on, even when dragged past it', () => {
    expect(mountOnWall(art([0.5, -9]), room)).toEqual({ position: [0.5, -2 + 0.02], rotation: 0 })
    const { position, rotation } = mountOnWall(art([2.8, -1.95]), room)
    expect(rotation).toBe(0)
    expect(position[0]).toBeCloseTo(3 - 0.6) // half of the 120 cm print from the corner
  })

  it('stay on a wall however they are moved (dragging, arrow keys, sliders)', () => {
    let state = createHouseHistory(DEFAULT_HOUSE)
    const bounds = ROOMS.living
    state = houseReducer(state, { room: 'living', action: { type: 'addItem', item: art([0, 0]), bounds } })
    state = houseReducer(state, {
      room: 'living',
      action: { type: 'updateItem', id: 'art', changes: { position: [-3.3, 0.5] }, transient: false, bounds },
    })
    const moved = state.living.present.items.find((i) => i.id === 'art')!
    expect(moved.rotation).toBe(90)
    expect(moved.position[0]).toBeCloseTo(-bounds.width / 2 + 0.02)
    expect(placeInRoom(moved, bounds)).toEqual({ position: moved.position, rotation: moved.rotation })
  })

  it('never clash with floor furniture or built-in units, only with each other', () => {
    const onWall = { ...art([0, -1.98]), ...mountOnWall(art([0, -1.98]), room) }
    const sofa = piece('sofa', '3-seat', [0, -1.55])
    const units = [{ label: 'kitchen units', position: [0, -1.7] as [number, number], size: [6, 0.6] as [number, number] }]
    expect(findOverlaps([onWall, sofa], units).has('art')).toBe(false)
    const other = { ...art([0.3, -1.98], 'art2'), ...mountOnWall(art([0.3, -1.98], 'art2'), room) }
    expect(findOverlaps([onWall, other]).get('art')).toEqual(['art2'])
  })

  it('keep clear of windows and doors, which floor furniture may stand in front of', () => {
    const living = ROOMS.living // window on the back wall at x = -1.9
    const atWindow = { ...art([-1.9, -2.9]), ...mountOnWall(art([-1.9, -2.9]), living) }
    expect(findOverlaps([atWindow], living.fixedZones).get('art')).toEqual(['zone:window'])
    const sofaByWindow = piece('sofa', '3-seat', [-1.9, -2.5])
    expect(findOverlaps([sofaByWindow], living.fixedZones).has('sofa')).toBe(false)
  })
})
