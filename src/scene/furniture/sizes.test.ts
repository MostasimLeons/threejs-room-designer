import { describe, expect, it } from 'vitest'
import {
  clampToRoom,
  findOverlaps,
  FURNITURE_INFO,
  isAllowedIn,
  itemFootprint,
  mountOnWall,
  tuckedUnder,
  type FurnitureItem,
  type FurnitureType,
} from './catalog'
import { itemHeight, PRODUCTS, productSize } from './products'
import { itemSize, normalizeSize, sizeLimits, standardSize } from './sizes'
import { DEFAULT_HOUSE, parseDesign } from '../../state/design'
import { historyReducer, type HistoryAction, type HistoryState } from '../../state/useDesignHistory'
import { shoppingList } from '../../state/shoppingList'
import { ROOMS } from '../house'

/** Phase 15: custom furniture sizes and tucking pieces under desks and tables. */

const sofaOf = (state: HistoryState) => state.present.items.find((item) => item.id === 'sofa')!

function piece(
  type: FurnitureType,
  variant: string,
  position: [number, number],
  rotation = 0,
  id: string = type,
  size?: [number, number, number],
): FurnitureItem {
  return { id, type, variant, position, rotation, color: '#c49a6c', ...(size ? { size } : {}) }
}

describe('size limits', () => {
  it('a desk stays a desk you can sit at; a sofa may go from half to twice its size', () => {
    expect(sizeLimits('desk', '120')).toEqual({ width: [0.6, 2.4], depth: [0.4, 1.0], height: [0.6, 0.9] })
    const sofa = sizeLimits('sofa', '3-seat')
    expect(sofa.width).toEqual([1.1, 4]) // 2.2 m: half is 1.1, twice is 4.4 but nothing is wider than 4 m
    expect(sofa.height).toEqual([0.43, 1.7])
  })

  it('every option of every piece has limits that contain its standard size', () => {
    for (const type of Object.keys(FURNITURE_INFO) as FurnitureType[]) {
      for (const { id } of FURNITURE_INFO[type].variants) {
        const limits = sizeLimits(type, id)
        const standard = standardSize(type, id)
        ;(['width', 'depth', 'height'] as const).forEach((key, i) => {
          expect(limits[key][0], `${type}:${id} ${key}`).toBeLessThanOrEqual(standard[i])
          expect(limits[key][1], `${type}:${id} ${key}`).toBeGreaterThanOrEqual(standard[i])
        })
      }
    }
  })

  it('keeps a size within its limits, to the millimetre', () => {
    expect(normalizeSize('desk', '120', [5, 0.1, 0.7234])).toEqual([2.4, 0.4, 0.723])
  })

  it('stores the standard size as no size at all', () => {
    expect(normalizeSize('desk', '120', [1.2, 0.6, 0.75])).toBeUndefined()
    expect(normalizeSize('desk', '120', undefined)).toBeUndefined()
    expect(normalizeSize('desk', '120', [1, Number.NaN, 0.7])).toBeUndefined()
  })

  it('round pieces have one diameter', () => {
    expect(normalizeSize('diningTable', 'round', [1.4, 0.7, 0.75])).toEqual([1.4, 1.4, 0.75])
    expect(itemFootprint(piece('diningTable', 'round', [0, 0], 0, 't', [1.4, 1.4, 0.75]))).toEqual([1.4, 1.4])
  })

  it('a piece without a custom size measures as its option', () => {
    const desk = piece('desk', '120', [0, 0])
    expect(itemSize(desk)).toEqual([1.2, 0.6, 0.75])
    expect(itemHeight(desk)).toBe(0.75)
    expect(productSize(desk)).toBe('120 × 60 × 75 cm')
    expect(productSize(piece('desk', '120', [0, 0], 0, 'd', [1.6, 0.8, 0.72]))).toBe('160 × 80 × 72 cm')
  })
})

describe('everything follows a custom size', () => {
  it('walls: a wider piece is kept further from the wall', () => {
    const room = { width: 4, depth: 4 }
    expect(clampToRoom(piece('desk', '120', [10, 0], 0, 'd', [2, 0.6, 0.75]), room)[0]).toBeCloseTo(1)
  })

  it('overlaps: a wider sofa now reaches its neighbour', () => {
    const sofa = piece('sofa', '2-seat', [0, 0])
    const table = piece('sideTable', 'wood', [1.2, 0])
    expect(findOverlaps([sofa, table]).size).toBe(0)
    expect(findOverlaps([{ ...sofa, size: [2.4, 0.9, 0.85] }, table]).size).toBe(2)
  })

  it('pieces on a wall: a wider print is kept further from the corner', () => {
    const art = piece('wallArt', 'abstract', [-1.9, -2], 0, 'a', [1.2, 0.04, 0.8])
    expect(mountOnWall(art, { width: 4, depth: 4 }).position[0]).toBeCloseTo(-1.4)
  })
})

describe('saving and undo', () => {
  const living = DEFAULT_HOUSE.living

  it('a custom size is saved and loads back', () => {
    const design = {
      ...living,
      items: living.items.map((item) => (item.id === 'sofa' ? { ...item, size: [2.5, 0.95, 0.8] as [number, number, number] } : item)),
    }
    const loaded = parseDesign(JSON.parse(JSON.stringify(design)), 'living')!
    expect(loaded.items.find((item) => item.id === 'sofa')?.size).toEqual([2.5, 0.95, 0.8])
  })

  it('older designs (no sizes) load unchanged; broken or silly sizes are fixed', () => {
    expect(parseDesign(JSON.parse(JSON.stringify(living)), 'living')).toEqual(living)
    const raw = {
      ...living,
      items: [
        { ...living.items[0], size: 'big' },
        { ...living.items[1], size: [9, 9, 9] },
      ],
    }
    const [a, b] = parseDesign(raw, 'living')!.items
    expect(a.size).toBeUndefined()
    const limits = sizeLimits(b.type, b.variant)
    expect(b.size).toEqual([limits.width[1], limits.depth[1], limits.height[1]])
  })

  const bounds = ROOMS.living
  const resize = (size: [number, number, number] | undefined, transient = false): HistoryAction => ({
    type: 'updateItem',
    id: 'sofa',
    changes: { size },
    transient,
    bounds,
  })
  const start: HistoryState = { past: [], present: living, future: [], pending: null }

  it('dragging a size slider is one undo step', () => {
    let state = [resize([2.3, 0.9, 0.85], true), resize([2.4, 0.9, 0.85], true), resize([2.5, 0.9, 0.85], true)].reduce(
      historyReducer,
      start,
    )
    state = historyReducer(state, { type: 'commit' })
    expect(sofaOf(state).size).toEqual([2.5, 0.9, 0.85])
    expect(state.past).toHaveLength(1)
    expect(sofaOf(historyReducer(state, { type: 'undo' })).size).toBeUndefined()
  })

  it('"Standard size" and picking another option go back to a standard size', () => {
    const custom = historyReducer(start, resize([2.5, 0.9, 0.85]))
    expect(sofaOf(historyReducer(custom, resize(undefined))).size).toBeUndefined()
    const other = historyReducer(custom, { type: 'updateItem', id: 'sofa', changes: { variant: '2-seat' }, transient: false, bounds })
    expect(sofaOf(other).size).toBeUndefined()
  })

  it('a bigger piece is moved back inside the walls', () => {
    const state = historyReducer(start, resize([4, 0.9, 0.85]))
    const sofa = sofaOf(state)
    expect(Math.abs(sofa.position[0]) + 2).toBeLessThanOrEqual(bounds.width / 2 + 1e-9)
  })

  it('the shopping list shows a custom-sized piece on its own line', () => {
    const extra = { ...living.items.find((item) => item.id === 'sofa')!, id: 'sofa-2', size: [2.5, 0.9, 0.85] as [number, number, number] }
    const house = { ...DEFAULT_HOUSE, living: { ...living, items: [...living.items, extra] } }
    const sofas = shoppingList(house, ['living']).filter((line) => line.item === 'Sofa')
    expect(sofas.map((line) => [line.option, line.size, line.quantity])).toEqual([
      ['3-seater', '220 × 90 × 85 cm', 1],
      ['3-seater, custom size', '250 × 90 × 85 cm', 1],
    ])
  })
})

describe('tucking under desks and tables', () => {
  // A 180 × 90 table: its back edge is at z = -0.45.
  const table = piece('diningTable', 'rectangle', [0, 0])
  // A 120 × 60 desk, 75 tall: knee space up to 63 cm; its front edge is at z = 0.3.
  const desk = piece('desk', '120', [0, 0])

  it('a dining chair can be pushed in up to its back', () => {
    const tucked = piece('diningChair', 'upholstered', [0, -0.41]) // seat 26 cm under the table
    expect(findOverlaps([table, tucked]).size).toBe(0)
    expect(tuckedUnder(tucked, table)).toBe(true)
    // Turned round, its back would go through the table.
    expect(findOverlaps([table, { ...tucked, rotation: 180 }]).size).toBe(2)
    // Pushed in too far, the back hits the table edge.
    expect(findOverlaps([table, piece('diningChair', 'upholstered', [0, -0.3])]).size).toBe(2)
  })

  it('a swivel chair tucks in as far as its armrests', () => {
    expect(findOverlaps([desk, piece('deskChair', 'task', [0, 0.45], 180)]).size).toBe(0)
    expect(findOverlaps([desk, piece('deskChair', 'task', [0, 0.3], 180)]).size).toBe(2)
  })

  it('a drawer unit or PC fits under a desk if it is lower than the knee space', () => {
    expect(findOverlaps([desk, piece('drawerUnit', 'castors', [0.35, 0])]).size).toBe(0) // 58 cm under 63
    expect(findOverlaps([desk, piece('pcTower', 'mid', [-0.4, 0])]).size).toBe(0)
    expect(findOverlaps([desk, piece('drawerUnit', 'desk-height', [0.35, 0])]).size).toBe(2) // 72 cm: too tall
  })

  it('a lowered desk no longer has room for the drawer unit', () => {
    const low = { ...desk, size: [1.2, 0.6, 0.68] as [number, number, number] } // knee space 56 cm
    expect(findOverlaps([low, piece('drawerUnit', 'castors', [0.35, 0])]).size).toBe(2)
    // A custom lower drawer unit fits again.
    expect(findOverlaps([low, piece('drawerUnit', 'castors', [0.35, 0], 0, 'd', [0.41, 0.5, 0.5])]).size).toBe(0)
  })

  it('pieces under the same desk still clash with each other', () => {
    const a = piece('drawerUnit', 'castors', [0.35, 0], 0, 'a')
    const b = piece('pcTower', 'mid', [0.35, 0], 0, 'b')
    expect(new Set(findOverlaps([desk, a, b]).keys())).toEqual(new Set(['a', 'b']))
  })

  it('only desks and tables have knee space', () => {
    const coffee = piece('coffeeTable', 'rectangle', [0, 0])
    expect(findOverlaps([coffee, piece('pcTower', 'mini', [0, 0])]).size).toBe(2)
  })

  it('every room still starts without overlaps', () => {
    for (const room of Object.keys(DEFAULT_HOUSE) as (keyof typeof DEFAULT_HOUSE)[]) {
      expect([...findOverlaps(DEFAULT_HOUSE[room].items, ROOMS[room].fixedZones).keys()]).toEqual([])
    }
  })
})

describe('the new pieces', () => {
  it('drawer units and PC towers go in the bedroom and living room, with real-life sizes', () => {
    for (const type of ['drawerUnit', 'pcTower'] as const) {
      expect(isAllowedIn(type, 'bedroom')).toBe(true)
      expect(isAllowedIn(type, 'living')).toBe(true)
      expect(isAllowedIn(type, 'kitchen')).toBe(false)
      expect(PRODUCTS[type].description).not.toBe('')
    }
    expect(itemSize(piece('drawerUnit', 'castors', [0, 0]))).toEqual([0.41, 0.5, 0.58])
    expect(itemSize(piece('pcTower', 'mid', [0, 0]))).toEqual([0.21, 0.45, 0.46])
  })
})
