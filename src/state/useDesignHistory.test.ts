import { describe, expect, it } from 'vitest'
import {
  createHouseHistory,
  historyReducer,
  houseReducer,
  MAX_HISTORY,
  type HistoryAction,
  type HistoryState,
  type HouseAction,
  type HouseHistory,
} from './useDesignHistory'
import { DEFAULT_DESIGN, DEFAULT_HOUSE, type RoomDesign } from './design'
import { ROOM_IDS, ROOMS, type RoomId } from '../scene/house'

const bounds = ROOMS.living

function start(design: RoomDesign = DEFAULT_DESIGN): HistoryState {
  return { past: [], present: design, future: [], pending: null }
}

function run(state: HistoryState, ...actions: HistoryAction[]): HistoryState {
  return actions.reduce(historyReducer, state)
}

const move = (id: string, position: [number, number], transient = false): HistoryAction => ({
  type: 'updateItem',
  id,
  changes: { position },
  transient,
  bounds,
})

const sofa = (state: HistoryState) => state.present.items.find((item) => item.id === 'sofa')!

describe('historyReducer', () => {
  it('records a normal change as one undo step', () => {
    const state = run(start(), move('sofa', [0, 0]))
    expect(state.past).toHaveLength(1)
    expect(sofa(state).position).toEqual([0, 0])
  })

  it('turns a whole drag (many previews + commit) into ONE undo step', () => {
    const state = run(start(), move('sofa', [0.1, 0], true), move('sofa', [0.2, 0], true), move('sofa', [0.3, 0], true), { type: 'commit' })
    expect(state.past).toHaveLength(1)
    expect(state.pending).toBeNull()
    const undone = run(state, { type: 'undo' })
    expect(sofa(undone).position).toEqual(sofa(start()).position)
  })

  it('adds no undo step when a drag ends where it started, and keeps Redo', () => {
    // Make a change, undo it, so there is something to redo.
    const withRedo = run(start(), move('sofa', [0, 0]), { type: 'undo' })
    expect(withRedo.future).toHaveLength(1)
    const original = sofa(withRedo).position
    // Nudge forth and back again, then let go.
    const state = run(withRedo, move('sofa', [0, 0], true), move('sofa', original, true), { type: 'commit' })
    expect(state.past).toHaveLength(0)
    expect(state.future).toHaveLength(1)
  })

  it('ignores a non-transient change that changes nothing', () => {
    const state = run(start(), move('sofa', sofa(start()).position))
    expect(state.past).toHaveLength(0)
  })

  it('undo and redo walk back and forth, and a new change clears Redo', () => {
    let state = run(start(), move('sofa', [0, 0]), move('sofa', [1, 0]))
    state = run(state, { type: 'undo' })
    expect(sofa(state).position).toEqual([0, 0])
    state = run(state, { type: 'redo' })
    expect(sofa(state).position).toEqual([1, 0])
    state = run(state, { type: 'undo' }, move('sofa', [-1, 0]))
    expect(state.future).toHaveLength(0)
  })

  it('undo with nothing to undo is a no-op', () => {
    const initial = start()
    expect(run(initial, { type: 'undo' })).toEqual(initial)
    expect(run(initial, { type: 'redo' })).toEqual(initial)
  })

  it('undo during a drag first finishes the drag, then undoes it', () => {
    const state = run(start(), move('sofa', [0.5, 0], true), { type: 'undo' })
    expect(state.pending).toBeNull()
    expect(sofa(state).position).toEqual(sofa(start()).position)
    expect(state.future).toHaveLength(1)
  })

  it(`keeps at most ${MAX_HISTORY} undo steps`, () => {
    let state = start()
    for (let i = 0; i < MAX_HISTORY + 20; i++) state = run(state, move('sofa', [(i % 50) / 100, 0]))
    expect(state.past).toHaveLength(MAX_HISTORY)
  })

  it('keeps moved furniture inside the walls', () => {
    const state = run(start(), move('sofa', [100, -100]))
    const [x, z] = sofa(state).position
    expect(x).toBeLessThanOrEqual(bounds.width / 2)
    expect(z).toBeGreaterThanOrEqual(-bounds.depth / 2)
  })

  it('wraps rotation into 0–359', () => {
    const state = run(start(), { type: 'updateItem', id: 'sofa', changes: { rotation: -45 }, transient: false, bounds })
    expect(sofa(state).rotation).toBe(315)
  })

  it('updates finishes and can undo them', () => {
    const state = run(start(), { type: 'updateFinishes', changes: { wallColor: '#123456' }, transient: false })
    expect(state.present.finishes.wallColor).toBe('#123456')
    expect(run(state, { type: 'undo' }).present.finishes).toEqual(DEFAULT_DESIGN.finishes)
  })

  it('reset is undoable', () => {
    const moved = run(start(), move('sofa', [0, 0]))
    const reset = run(moved, { type: 'reset', design: DEFAULT_DESIGN })
    expect(reset.present).toEqual(DEFAULT_DESIGN)
    expect(sofa(run(reset, { type: 'undo' })).position).toEqual([0, 0])
  })
})

// ---------- Every room together ----------

const bedBounds = ROOMS.bedroom
const moveIn = (room: RoomId, id: string, position: [number, number], transient = false): HouseAction => ({
  room,
  action: { type: 'updateItem', id, changes: { position }, transient, bounds: ROOMS[room] },
})
const run2 = (state: HouseHistory, ...actions: HouseAction[]) => actions.reduce(houseReducer, state)
const find = (state: HouseHistory, room: RoomId, id: string) => state[room].present.items.find((item) => item.id === id)!

describe('houseReducer (one history per room)', () => {
  it('a change in one room leaves every other room exactly as it was', () => {
    const initial = createHouseHistory(DEFAULT_HOUSE)
    const next = run2(initial, moveIn('bedroom', 'bed', [0, 0]))
    expect(find(next, 'bedroom', 'bed').position).toEqual([0, 0])
    for (const id of ROOM_IDS.filter((r) => r !== 'bedroom')) expect(next[id]).toBe(initial[id])
  })

  it('undo only affects its own room', () => {
    let state = run2(createHouseHistory(DEFAULT_HOUSE), moveIn('living', 'sofa', [0, 0]), moveIn('bedroom', 'bed', [0, 0]))
    state = run2(state, { room: 'living', action: { type: 'undo' } })
    expect(find(state, 'living', 'sofa').position).toEqual(DEFAULT_HOUSE.living.items.find((i) => i.id === 'sofa')!.position)
    expect(find(state, 'bedroom', 'bed').position).toEqual([0, 0])
    expect(state.bedroom.past).toHaveLength(1)
  })

  it('keeps furniture inside the walls of the room it is in', () => {
    const state = run2(createHouseHistory(DEFAULT_HOUSE), moveIn('bedroom', 'bed', [100, 0]))
    expect(find(state, 'bedroom', 'bed').position[0]).toBeLessThanOrEqual(bedBounds.width / 2)
  })

  it('a drag left unfinished in one room does not block another', () => {
    const state = run2(
      createHouseHistory(DEFAULT_HOUSE),
      moveIn('living', 'sofa', [0.5, 0], true),
      moveIn('kitchen', 'kitchen-plant', [0, 0]),
    )
    expect(state.living.pending).not.toBeNull()
    expect(state.kitchen.past).toHaveLength(1)
  })

  it('returns the same state object when nothing changes (no needless re-renders)', () => {
    const initial = createHouseHistory(DEFAULT_HOUSE)
    expect(houseReducer(initial, { room: 'dining', action: { type: 'undo' } })).toBe(initial)
  })
})
