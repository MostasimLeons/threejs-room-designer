import { describe, expect, it } from 'vitest'
import { resolveRoom, ROOM_IDS, ROOMS, type RoomLayout } from './house'
import {
  addOpening,
  defaultLayout,
  isDefaultLayout,
  LAYOUT_LIMITS,
  normalizeLayout,
  OPENING_GAP,
  parseLayout,
  removeOpening,
  selectedOpening,
  openingSelection,
  updateOpening,
} from './layout'
import { openingProblems } from './walls'
import { cameraView } from './cameraViews'
import { clampToRoom } from './furniture/catalog'
import { DEFAULT_HOUSE, parseDesign, parseHouseDesign } from '../state/design'
import { createHouseHistory, houseReducer } from '../state/useDesignHistory'
import { decodeShare, encodeShare } from '../state/share'

/** Phase 12: the room layout editor (size, ceiling height, windows and doors). */

const living = (): RoomLayout => defaultLayout('living')

describe('layout rules', () => {
  it.each(ROOM_IDS)("%s: the standard layout is valid and isn't changed by the rules", (room) => {
    const layout = defaultLayout(room)
    expect(normalizeLayout(layout)).toEqual(layout)
    expect(isDefaultLayout(room, layout)).toBe(true)
    expect(openingProblems(resolveRoom(room, layout))).toEqual([])
  })

  it('keeps sizes within the limits', () => {
    const tiny = normalizeLayout({ ...living(), width: 1, depth: 50, height: 9 })
    expect([tiny.width, tiny.depth, tiny.height]).toEqual([LAYOUT_LIMITS.width[0], LAYOUT_LIMITS.depth[1], LAYOUT_LIMITS.height[1]])
  })

  it('keeps openings inside their wall and apart, pushing neighbours aside', () => {
    const layout = living()
    layout.openings.back = [
      { kind: 'window', label: 'A', at: 0, width: 1.2, bottom: 0.9, top: 2.2 },
      { kind: 'window', label: 'B', at: 0.2, width: 1.2, bottom: 0.9, top: 2.2 },
    ]
    const fixed = normalizeLayout(layout)
    const [a, b] = fixed.openings.back!
    expect(b.at - b.width / 2 - (a.at + a.width / 2)).toBeGreaterThanOrEqual(OPENING_GAP - 1e-9)
    expect(fixed.openings.back!.map((o) => o.label)).toEqual(['A', 'B']) // order kept, so selections stay put
    expect(openingProblems(resolveRoom('living', fixed))).toEqual([])
  })

  it("drops openings that can't fit on a shrunken wall, and keeps a window under a lower ceiling", () => {
    const layout = { ...living(), width: 2.5 }
    layout.openings.back = [0, 1, 2].map((i) => ({ kind: 'window' as const, label: `W${i}`, at: i, width: 1.2, bottom: 0.9, top: 2.3 }))
    const fixed = normalizeLayout({ ...layout, height: 2.4 })
    expect(fixed.openings.back!.length).toBeLessThan(3)
    for (const o of fixed.openings.back!) expect(o.top).toBeLessThanOrEqual(2.4 - 0.15 + 1e-9)
    expect(openingProblems(resolveRoom('living', fixed))).toEqual([])
  })

  it('doors always start at the floor and stay a sensible size', () => {
    const layout = living()
    layout.openings.left = [{ kind: 'door', label: 'D', at: 0, width: 3, bottom: 0.5, top: 1 }]
    const [door] = normalizeLayout(layout).openings.left!
    expect(door.bottom).toBe(0)
    expect(door.width).toBe(1.2)
    expect(door.top).toBeGreaterThanOrEqual(1.9)
  })

  it('adds a window or door in the longest free stretch of wall, and says when nothing fits', () => {
    const added = addOpening(living(), 'window')!
    expect(added.layout.openings[added.ref.side]![added.ref.index].kind).toBe('window')
    expect(openingProblems(resolveRoom('living', added.layout))).toEqual([])
    let full: RoomLayout = { ...living(), width: 2.5, depth: 2.5 }
    for (let i = 0; i < 20; i++) full = addOpening(full, 'door')?.layout ?? full
    expect(addOpening(full, 'door')).toBeNull()
  })

  it('moves an opening to another wall and follows it there', () => {
    const { layout, ref } = updateOpening(living(), { side: 'back', index: 0 }, { side: 'front' })
    expect(ref.side).toBe('front')
    expect(layout.openings.back ?? []).toHaveLength(0)
    expect(layout.openings.front![ref.index].label).toBe('Window')
    expect(selectedOpening(openingSelection(ref))).toEqual(ref)
  })

  it('removes an opening', () => {
    const layout = removeOpening(living(), { side: 'back', index: 0 })
    expect(layout.openings.back).toBeUndefined()
  })

  it('reads saved layouts, rejecting broken ones', () => {
    expect(parseLayout(null)).toBeNull()
    expect(parseLayout({ width: 'big' })).toBeNull()
    const parsed = parseLayout({
      width: 8,
      depth: 6,
      height: 3,
      openings: { back: [{ kind: 'window', label: 'W', at: 0, width: 1, bottom: 1, top: 2 }, { kind: 'skylight' }], up: [] },
    })!
    expect(parsed.width).toBe(8)
    expect(parsed.openings.back).toHaveLength(1)
  })
})

describe('the room follows its layout', () => {
  it('built-in units follow the walls: kitchen units along the whole back wall, toilet near its corner', () => {
    const kitchen = resolveRoom('kitchen', { ...defaultLayout('kitchen'), width: 6, depth: 5 })
    const units = kitchen.fixedZones.find((z) => z.label === 'kitchen units')!
    expect(units.size[0]).toBe(6)
    expect(units.position[1] - units.size[1] / 2).toBeCloseTo(-2.5)
    const standardToilet = ROOMS.bathroom.fixedZones.find((z) => z.label === 'toilet')!
    const bathroom = resolveRoom('bathroom', { ...defaultLayout('bathroom'), width: 4, depth: 3 })
    const toilet = bathroom.fixedZones.find((z) => z.label === 'toilet')!
    expect(toilet.position[0] + 2).toBeCloseTo(standardToilet.position[0] + 1.5) // same distance from the left wall
  })

  it('downlights, cameras and the ceiling height scale with the room', () => {
    const big = resolveRoom('living', { ...living(), width: 10, depth: 9, height: 3.2 })
    expect(big.height).toBe(3.2)
    expect(Math.max(...big.downlights.map(([x]) => Math.abs(x)))).toBeGreaterThan(
      Math.max(...ROOMS.living.downlights.map(([x]) => Math.abs(x))),
    )
    const eye = cameraView(big, 'eye').position
    expect(eye[2]).toBeLessThan(9 / 2) // still inside the room
    expect(cameraView(big, 'overview').position[0]).toBeGreaterThan(ROOMS.living.camera.position[0])
  })
})

describe('saving and undo with a layout', () => {
  const smaller = { ...living(), width: 4, depth: 4 }

  it('a changed layout is saved and loaded; the standard one is not stored', () => {
    const design = { ...DEFAULT_HOUSE.living, layout: smaller }
    const loaded = parseDesign(JSON.parse(JSON.stringify(design)), 'living')!
    expect(loaded.layout).toEqual(normalizeLayout(smaller))
    expect(parseDesign(JSON.parse(JSON.stringify({ ...DEFAULT_HOUSE.living, layout: living() })), 'living')).not.toHaveProperty('layout')
    expect(parseDesign(JSON.parse(JSON.stringify(DEFAULT_HOUSE.living)), 'living')).not.toHaveProperty('layout')
  })

  it('loading puts furniture inside the walls of the room as saved', () => {
    const design = { ...DEFAULT_HOUSE.living, layout: smaller }
    const loaded = parseDesign(JSON.parse(JSON.stringify(design)), 'living')!
    for (const item of loaded.items) expect(clampToRoom(item, smaller)).toEqual(item.position)
  })

  it('shrinking the room moves furniture inside, and one undo puts both back', () => {
    let state = createHouseHistory(DEFAULT_HOUSE)
    state = houseReducer(state, { room: 'living', action: { type: 'setLayout', layout: smaller, bounds: smaller, transient: false } })
    for (const item of state.living.present.items) expect(clampToRoom(item, smaller)).toEqual(item.position)
    // Later moves stay inside the smaller room too.
    state = houseReducer(state, {
      room: 'living',
      action: { type: 'updateItem', id: 'sofa', changes: { position: [9, 9] }, transient: false, bounds: ROOMS.living },
    })
    expect(state.living.present.items.find((i) => i.id === 'sofa')!.position[0]).toBeLessThanOrEqual(2)
    state = houseReducer(state, { room: 'living', action: { type: 'undo' } })
    state = houseReducer(state, { room: 'living', action: { type: 'undo' } })
    expect(state.living.present).toEqual(DEFAULT_HOUSE.living)
  })

  it('share links and saved files carry the layout', async () => {
    const house = { ...DEFAULT_HOUSE, living: { ...DEFAULT_HOUSE.living, layout: normalizeLayout(smaller) } }
    const shared = await decodeShare(await encodeShare(house))
    expect(shared?.living.layout).toEqual(normalizeLayout(smaller))
    expect(parseHouseDesign(JSON.parse(JSON.stringify({ rooms: house })))?.living.layout).toEqual(normalizeLayout(smaller))
  })
})
