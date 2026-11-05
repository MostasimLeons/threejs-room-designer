import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUTS, findOverlaps, NEEDS_SURFACE, type FurnitureItem, type FurnitureType } from './catalog'
import { clampToHost, elevationOf, findSpotOnSurface, onTopOf, settleOnSurfaces, toHostFrame } from './surfaces'
import { placeNew } from './placement'
import { productPrice } from './products'
import { ROOMS } from '../house'
import { DEFAULT_HOUSE, parseDesign } from '../../state/design'
import { historyReducer, type HistoryAction, type HistoryState } from '../../state/useDesignHistory'
import { shoppingList } from '../../state/shoppingList'

/** Phase 17: pieces standing on desks and tables. */

const piece = (type: FurnitureType, variant: string, position: [number, number], extra: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: `${type}-${position.join(',')}`,
  type,
  variant,
  position,
  rotation: 0,
  color: '#2a2a2c',
  ...extra,
})

// A 160 × 80 office desk at the origin, 75 cm high.
const desk = piece('officeDesk', 'straight', [0, 0], { id: 'desk' })
const monitor = piece('monitor', '27', [0, -0.25], { id: 'monitor', on: 'desk' })

const bounds = ROOMS.office
const start = (items: FurnitureItem[]): HistoryState => ({
  past: [],
  present: { ...DEFAULT_HOUSE.office, items },
  future: [],
  pending: null,
})
const update = (id: string, changes: Partial<FurnitureItem>, transient = false): HistoryAction => ({
  type: 'updateItem',
  id,
  changes,
  transient,
  bounds,
})
const find = (state: HistoryState, id: string) => state.present.items.find((item) => item.id === id)

describe('standing on a desk', () => {
  it('stands at the height of the desk top, which follows a custom height', () => {
    expect(elevationOf(monitor, [desk, monitor])).toBe(0.75)
    const raised = { ...desk, variant: 'standing', size: [1.4, 0.7, 1.1] as [number, number, number] }
    expect(elevationOf(monitor, [raised, monitor])).toBe(1.1)
    expect(elevationOf({ ...monitor, on: undefined }, [desk])).toBe(0)
  })

  it('stays within the edges of the top, also on a turned desk and a round table', () => {
    const [x, z] = clampToHost({ ...monitor, position: [5, 5] }, desk)
    expect([x, z].map((v) => +v.toFixed(3))).toEqual([0.495, 0.295]) // 0.8 - 0.61/2, 0.4 - 0.21/2
    const turned = { ...desk, rotation: 90 }
    const local = toHostFrame(clampToHost({ ...monitor, rotation: 90, position: [5, 0] }, turned), turned)
    expect(Math.abs(local[0])).toBeLessThanOrEqual(0.8 - 0.305 + 1e-9)
    const round = piece('diningTable', 'round', [0, 0], { id: 'round' })
    const lamp = piece('deskLamp', 'dome', [3, 0], { on: 'round' })
    const [lx, lz] = clampToHost(lamp, round)
    expect(Math.hypot(lx, lz)).toBeCloseTo(0.6 - 0.1)
  })

  it('knows which top a point is on', () => {
    expect(onTopOf([0.7, 0.3], desk)).toBe(true)
    expect(onTopOf([0.9, 0], desk)).toBe(false)
  })
})

describe('moving with the desk', () => {
  it('moving or turning the desk carries what stands on it', () => {
    let state = historyReducer(start([desk, monitor]), update('desk', { position: [1, 0.5] }))
    expect(find(state, 'monitor')?.position).toEqual([1, 0.25])
    state = historyReducer(state, update('desk', { rotation: 90 }))
    const m = find(state, 'monitor')!
    expect(m.rotation).toBe(90)
    // Still 25 cm towards the back of the desk, now turned with it.
    const [lx, lz] = toHostFrame(m.position, find(state, 'desk')!)
    expect(lx).toBeCloseTo(0)
    expect(lz).toBeCloseTo(-0.25)
  })

  it('a smaller desk keeps the monitor on its top', () => {
    const state = historyReducer(start([desk, { ...monitor, position: [0.45, -0.25] }]), update('desk', { size: [1, 0.6, 0.75] }))
    expect(find(state, 'monitor')!.position[0]).toBeCloseTo(0.5 - 0.305)
  })

  it('deleting the desk takes what stands on it; one undo brings both back', () => {
    let state = historyReducer(start([desk, monitor]), { type: 'removeItem', id: 'desk' })
    expect(state.present.items.map((i) => i.id)).toEqual([])
    state = historyReducer(state, { type: 'undo' })
    expect(state.present.items.map((i) => i.id)).toEqual(['desk', 'monitor'])
  })

  it('dragging a monitor off the desk puts it on the floor (flagged); back onto it is fine', () => {
    let state = historyReducer(start([desk, monitor]), update('monitor', { position: [2, 1], on: undefined }))
    expect(find(state, 'monitor')?.on).toBeUndefined()
    expect(findOverlaps(state.present.items).get('monitor')).toEqual([NEEDS_SURFACE])
    state = historyReducer(state, update('monitor', { position: [0.2, 0], on: 'desk' }))
    expect(find(state, 'monitor')?.on).toBe('desk')
    expect(findOverlaps(state.present.items).size).toBe(0)
  })

  it('several pieces added together are one undo step', () => {
    let state = historyReducer(start([]), { type: 'addItems', items: [desk, monitor], bounds })
    expect(state.present.items.map((i) => i.id)).toEqual(['desk', 'monitor'])
    state = historyReducer(state, { type: 'undo' })
    expect(state.present.items).toEqual([])
  })
})

describe('overlaps on a desk', () => {
  it('pieces on a desk never clash with floor furniture, only with each other', () => {
    const chair = piece('officeChair', 'ergonomic', [0, 0.1], { id: 'chair' })
    expect(findOverlaps([desk, monitor, chair]).has('monitor')).toBe(false)
    const second = { ...monitor, id: 'second', position: [0.1, -0.25] as [number, number] }
    expect(new Set(findOverlaps([desk, monitor, second]).keys())).toEqual(new Set(['monitor', 'second']))
  })

  it('a PC tower may stand on the floor or on the desk', () => {
    const pc = piece('pcTower', 'mini', [0.6, 0], { id: 'pc', on: 'desk' })
    expect(findOverlaps([desk, pc]).size).toBe(0)
    expect(findOverlaps([desk, { ...pc, on: undefined, position: [3, 0] }]).size).toBe(0)
  })
})

describe('adding to a desk', () => {
  it('a new monitor goes to the back of a desk, a keyboard to the front', () => {
    const others = [desk]
    const spot = findSpotOnSurface(piece('monitor', '27', [0, 0], { id: 'new' }), others)!
    expect(spot.on).toBe('desk')
    expect(spot.position[1]).toBeCloseTo(-0.4 + 0.105)
    const keys = findSpotOnSurface(piece('keyboardMouse', 'full', [0, 0], { id: 'k' }), others)!
    expect(keys.position[1]).toBeCloseTo(0.4 - 0.085)
  })

  it('the catalog puts desk-top pieces onto a desk with room, and finds a free place next to what is there', () => {
    const office = DEFAULT_LAYOUTS.office
    const placed = placeNew(
      piece('laptop', 'open', [0, 0], { id: 'laptop' }),
      ['open', 'stand'],
      office,
      ROOMS.office,
      ROOMS.office.fixedZones,
    )
    expect(placed.on).toBe('office-desk')
    const item = { ...piece('laptop', 'open', [0, 0], { id: 'laptop' }), ...placed }
    expect(findOverlaps([...office, item], ROOMS.office.fixedZones).has('laptop')).toBe(false)
  })

  it('with no desk or table there is no spot on one', () => {
    expect(findSpotOnSurface(monitor, [piece('sofa', '3-seat', [0, 0])])).toBeNull()
  })
})

describe('saving', () => {
  it('a piece on a desk is saved and loads back on it', () => {
    const design = { ...DEFAULT_HOUSE.office, items: [desk, monitor] }
    expect(parseDesign(JSON.parse(JSON.stringify(design)), 'office')?.items.find((i) => i.id === 'monitor')?.on).toBe('desk')
  })

  it('a piece whose desk is missing, or not a desk, is back on the floor', () => {
    const lost = parseDesign({ ...DEFAULT_HOUSE.office, items: [monitor] }, 'office')!.items[0]
    expect(lost.on).toBeUndefined()
    const onChair = settleOnSurfaces([piece('officeChair', 'task', [0, 0], { id: 'chair' }), { ...monitor, on: 'chair' }])
    expect(onChair[1].on).toBeUndefined()
    // A sofa can't stand on a desk.
    expect(settleOnSurfaces([desk, piece('sofa', '2-seat', [0, 0], { on: 'desk' })])[1].on).toBeUndefined()
  })

  it('older saves (nothing on desks) load unchanged', () => {
    expect(parseDesign(JSON.parse(JSON.stringify(DEFAULT_HOUSE.living)), 'living')).toEqual(DEFAULT_HOUSE.living)
  })
})

describe('the default Office and the new pieces', () => {
  it('starts with a monitor, keyboard and desk lamp on the desk and a clock on the wall, without overlaps', () => {
    const office = DEFAULT_LAYOUTS.office
    for (const id of ['office-monitor', 'office-keyboard', 'office-desk-lamp'])
      expect(office.find((i) => i.id === id)?.on).toBe('office-desk')
    expect(office.some((i) => i.type === 'wallClock')).toBe(true)
    expect([...findOverlaps(office, ROOMS.office.fixedZones).keys()]).toEqual([])
    expect(settleOnSurfaces(office)).toBe(office) // already within the desk's edges
  })

  it('every new piece has example prices and shows on the shopping list', () => {
    const variants: Record<string, string[]> = {
      monitor: ['24', '27', 'ultrawide', 'dual'],
      laptop: ['open', 'stand'],
      keyboardMouse: ['full', 'compact'],
      deskLamp: ['arm', 'dome'],
      deskAccessories: ['organiser', 'plant'],
      wallClock: ['30', '40'],
      filingCabinet: ['2', '3'],
    }
    for (const [type, ids] of Object.entries(variants))
      for (const id of ids) expect(productPrice(type as FurnitureType, id)).toBeGreaterThan(0)
    const items = shoppingList(DEFAULT_HOUSE, ['office']).map((line) => line.item)
    expect(items).toEqual(expect.arrayContaining(['Monitor', 'Keyboard and mouse', 'Desk lamp', 'Wall clock']))
  })
})
