import { useCallback, useReducer } from 'react'
import { clampToRoom, type FurnitureItem } from '../scene/furniture/catalog'
import type { RoomFinishes } from '../scene/finishes'
import { normalizeDegrees } from '../utils/math'
import { DEFAULT_DESIGN, type RoomDesign } from './design'

export type ItemChanges = Partial<Pick<FurnitureItem, 'position' | 'rotation' | 'color' | 'variant'>>
export type FinishChanges = Partial<RoomFinishes>

/**
 * Undo/redo works by keeping snapshots of the whole design (furniture + finishes):
 * - `past`: earlier designs (most recent last) → Undo goes back to these
 * - `present`: what you see right now
 * - `future`: designs you undid → Redo brings them back
 * - `pending`: while you drag or slide, the design from *before* you started,
 *   so a whole drag becomes ONE undo step instead of hundreds.
 */
interface HistoryState {
  past: RoomDesign[]
  present: RoomDesign
  future: RoomDesign[]
  pending: RoomDesign | null
}

type Action =
  | { type: 'updateItem'; id: string; changes: ItemChanges; transient: boolean }
  | { type: 'updateFinishes'; changes: FinishChanges; transient: boolean }
  | { type: 'load'; design: RoomDesign }
  | { type: 'commit' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' }

const MAX_HISTORY = 100

function applyItemChanges(design: RoomDesign, id: string, changes: ItemChanges): RoomDesign {
  return {
    ...design,
    items: design.items.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, ...changes }
      next.rotation = normalizeDegrees(next.rotation)
      // Re-check the walls: rotating or picking a bigger size can push it outside.
      next.position = clampToRoom(next)
      return next
    }),
  }
}

/** Turns an in-progress drag/slide into a finished undo step. */
function finalize(state: HistoryState): HistoryState {
  if (!state.pending) return state
  return {
    past: [...state.past, state.pending].slice(-MAX_HISTORY),
    present: state.present,
    future: [],
    pending: null,
  }
}

/** Replaces the present design. `transient` = live preview that `commit` records later. */
function change(state: HistoryState, next: RoomDesign, transient: boolean): HistoryState {
  if (transient) return { ...state, present: next, pending: state.pending ?? state.present }
  const base = finalize(state)
  if (JSON.stringify(base.present) === JSON.stringify(next)) return base // nothing changed
  return { past: [...base.past, base.present].slice(-MAX_HISTORY), present: next, future: [], pending: null }
}

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'updateItem':
      return change(state, applyItemChanges(state.present, action.id, action.changes), action.transient)
    case 'updateFinishes':
      return change(state, { ...state.present, finishes: { ...state.present.finishes, ...action.changes } }, action.transient)
    case 'load':
      return change(state, action.design, false)
    case 'reset':
      return change(state, DEFAULT_DESIGN, false)
    case 'commit':
      return finalize(state)
    case 'undo': {
      const base = finalize(state)
      if (base.past.length === 0) return base
      return {
        past: base.past.slice(0, -1),
        present: base.past[base.past.length - 1],
        future: [base.present, ...base.future],
        pending: null,
      }
    }
    case 'redo': {
      const base = finalize(state)
      if (base.future.length === 0) return base
      return {
        past: [...base.past, base.present],
        present: base.future[0],
        future: base.future.slice(1),
        pending: null,
      }
    }
  }
}

/** React hook that owns the room design and its undo/redo history. */
export function useDesignHistory(getInitialDesign: () => RoomDesign) {
  // The third argument runs `getInitialDesign` only once, on the first render.
  const [state, dispatch] = useReducer(reducer, getInitialDesign, (getDesign) => ({
    past: [],
    present: getDesign(),
    future: [],
    pending: null,
  }))

  return {
    design: state.present,
    canUndo: state.past.length > 0 || state.pending !== null,
    canRedo: state.future.length > 0,
    /** Change an item and record one undo step (button clicks, swatches). */
    updateItem: useCallback((id: string, changes: ItemChanges) => dispatch({ type: 'updateItem', id, changes, transient: false }), []),
    /** Change an item live without recording yet (dragging, sliders). Call `commit` when done. */
    previewItem: useCallback((id: string, changes: ItemChanges) => dispatch({ type: 'updateItem', id, changes, transient: true }), []),
    updateFinishes: useCallback((changes: FinishChanges) => dispatch({ type: 'updateFinishes', changes, transient: false }), []),
    previewFinishes: useCallback((changes: FinishChanges) => dispatch({ type: 'updateFinishes', changes, transient: true }), []),
    /** Replace the whole design (restoring a save). Can be undone. */
    load: useCallback((design: RoomDesign) => dispatch({ type: 'load', design }), []),
    commit: useCallback(() => dispatch({ type: 'commit' }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), []),
  }
}
