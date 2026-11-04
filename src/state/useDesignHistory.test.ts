import { describe, expect, it } from 'vitest'
import { historyReducer, MAX_HISTORY, type HistoryAction, type HistoryState } from './useDesignHistory'
import { DEFAULT_DESIGN, type RoomDesign } from './design'
import { ROOMS } from '../scene/house'

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
