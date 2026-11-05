import { useMemo, useReducer } from 'react'
import { placeInRoom, type FurnitureItem } from '../scene/furniture/catalog'
import { normalizeSize } from '../scene/furniture/sizes'
import { carryWithHosts, settleOnSurfaces } from '../scene/furniture/surfaces'
import type { RoomFinishes } from '../scene/finishes'
import { normalizeDegrees } from '../utils/math'
import { normalizeLighting, type RoomLighting } from '../scene/sun'
import { ROOM_IDS, ROOMS, type RoomId, type RoomLayout } from '../scene/house'
import { DEFAULT_HOUSE, type HouseDesign, type RoomDesign } from './design'

export type ItemChanges = Partial<Pick<FurnitureItem, 'position' | 'rotation' | 'color' | 'variant' | 'frame' | 'size' | 'on'>>
export type FinishChanges = Partial<RoomFinishes>
export type LightingChanges = Partial<RoomLighting>

/**
 * Undo/redo works by keeping snapshots of the whole design (furniture + finishes):
 * - `past`: earlier designs (most recent last) → Undo goes back to these
 * - `present`: what you see right now
 * - `future`: designs you undid → Redo brings them back
 * - `pending`: while you drag or slide, the design from *before* you started,
 *   so a whole drag becomes ONE undo step instead of hundreds.
 */
export interface HistoryState {
  past: RoomDesign[]
  present: RoomDesign
  future: RoomDesign[]
  pending: RoomDesign | null
}

/** Size of the room this history belongs to, so moved furniture stays inside its own walls. */
export type RoomBounds = { width: number; depth: number }

export type HistoryAction =
  | { type: 'updateItem'; id: string; changes: ItemChanges; transient: boolean; bounds: RoomBounds }
  | { type: 'addItem'; item: FurnitureItem; bounds: RoomBounds }
  /** Several pieces in one undo step (a desk moved to another room with what's on it). */
  | { type: 'addItems'; items: FurnitureItem[]; bounds: RoomBounds }
  | { type: 'removeItem'; id: string }
  | { type: 'updateFinishes'; changes: FinishChanges; transient: boolean }
  | { type: 'updateLighting'; changes: LightingChanges; transient: boolean }
  /** New room size / openings (undefined = the standard layout), with that room's size; furniture is moved back inside. */
  | { type: 'setLayout'; layout: RoomLayout | undefined; bounds: RoomBounds; transient: boolean }
  | { type: 'load'; design: RoomDesign }
  | { type: 'commit' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; design: RoomDesign }

export const MAX_HISTORY = 100

function applyItemChanges(design: RoomDesign, id: string, changes: ItemChanges, bounds: RoomBounds): RoomDesign {
  const items = design.items.map((item) => {
    if (item.id !== id) return item
    const next = { ...item, ...changes }
    // Back to the standard finish: drop the field, so the piece is stored as it was before.
    if ('frame' in changes && changes.frame === undefined) delete next.frame
    // Picking another option starts from that option's own size (unless a size is set too).
    if (changes.variant !== undefined && changes.variant !== item.variant && !('size' in changes)) delete next.size
    // A size is kept within its limits; the standard size (or none) is stored as no size.
    const size = normalizeSize(next.type, next.variant, next.size)
    if (size) next.size = size
    else delete next.size
    next.rotation = normalizeDegrees(next.rotation)
    // Off a desk: back on the floor.
    if ('on' in changes && changes.on === undefined) delete next.on
    // Re-check the walls: rotating or picking a bigger size can push it outside;
    // a piece hung on a wall stays on the nearest wall.
    Object.assign(next, placeInRoom(next, bounds))
    return next
  })
  // What stands on a desk moves and turns with it, and stays within its (possibly resized) top.
  return { ...design, items: settleOnSurfaces(carryWithHosts(design.items, items)) }
}

/** The room's size: its own layout when it has one, otherwise the size the action was sent with. */
function boundsOf(design: RoomDesign, fallback: RoomBounds): RoomBounds {
  return design.layout ?? fallback
}

/** Turns an in-progress drag/slide into a finished undo step. */
function finalize(state: HistoryState): HistoryState {
  if (!state.pending) return state
  // Ended where it started (e.g. nudged into a wall): no undo step, and keep Redo intact.
  if (JSON.stringify(state.pending) === JSON.stringify(state.present)) return { ...state, pending: null }
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

/** Pure undo/redo logic, exported so it can be unit-tested without React. */
export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'updateItem':
      return change(
        state,
        applyItemChanges(state.present, action.id, action.changes, boundsOf(state.present, action.bounds)),
        action.transient,
      )
    case 'setLayout': {
      const { layout: _old, ...rest } = state.present
      const design: RoomDesign = action.layout ? { ...rest, layout: action.layout } : rest
      // A smaller room pushes furniture back inside its walls (wall pieces stay on a wall).
      const placed = design.items.map((item) => ({ ...item, ...placeInRoom(item, action.bounds) }))
      design.items = settleOnSurfaces(carryWithHosts(design.items, placed))
      return change(state, design, action.transient)
    }
    case 'addItem': {
      // Ids are unique within a room; a clash would make two pieces move together.
      if (state.present.items.some((item) => item.id === action.item.id)) return state
      const item = { ...action.item, rotation: normalizeDegrees(action.item.rotation) }
      Object.assign(item, placeInRoom(item, boundsOf(state.present, action.bounds)))
      return change(state, { ...state.present, items: settleOnSurfaces([...state.present.items, item]) }, false)
    }
    case 'addItems': {
      const ids = new Set(state.present.items.map((item) => item.id))
      const added = action.items
        .filter((item) => !ids.has(item.id))
        .map((item) => {
          const next = { ...item, rotation: normalizeDegrees(item.rotation) }
          return Object.assign(next, placeInRoom(next, boundsOf(state.present, action.bounds)))
        })
      if (added.length === 0) return state
      return change(state, { ...state.present, items: settleOnSurfaces([...state.present.items, ...added]) }, false)
    }
    case 'removeItem': {
      // A desk or table takes what stands on it along (one undo step brings both back).
      const items = state.present.items.filter((item) => item.id !== action.id && item.on !== action.id)
      return items.length === state.present.items.length ? state : change(state, { ...state.present, items }, false)
    }
    case 'updateLighting':
      return change(
        state,
        { ...state.present, lighting: normalizeLighting({ ...state.present.lighting, ...action.changes }) },
        action.transient,
      )
    case 'updateFinishes':
      return change(state, { ...state.present, finishes: { ...state.present.finishes, ...action.changes } }, action.transient)
    case 'load':
      return change(state, action.design, false)
    case 'reset':
      return change(state, action.design, false)
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

// ---------- All rooms together ----------

/** One independent undo/redo history per room. */
export type HouseHistory = Record<RoomId, HistoryState>

export interface HouseAction {
  room: RoomId
  action: HistoryAction
}

export function createHouseHistory(house: HouseDesign): HouseHistory {
  return Object.fromEntries(
    ROOM_IDS.map((id): [RoomId, HistoryState] => [id, { past: [], present: house[id], future: [], pending: null }]),
  ) as HouseHistory
}

/** Sends an action to one room's history. The other rooms are not touched at all. */
export function houseReducer(state: HouseHistory, { room, action }: HouseAction): HouseHistory {
  const next = historyReducer(state[room], action)
  return next === state[room] ? state : { ...state, [room]: next }
}

/** Everything the toolbar, panels and shortcuts need for the room you're editing. */
export interface RoomHistory {
  design: RoomDesign
  canUndo: boolean
  canRedo: boolean
  /** Change an item and record one undo step (button clicks, swatches). */
  updateItem: (id: string, changes: ItemChanges) => void
  /** Change an item live without recording yet (dragging, sliders). Call `commit` when done. */
  previewItem: (id: string, changes: ItemChanges) => void
  /** Add a piece (kept inside the walls). One undo step. */
  addItem: (item: FurnitureItem) => void
  /** Several pieces as one undo step (a desk moved here with what stands on it). */
  addItems: (items: FurnitureItem[]) => void
  /** Remove a piece. One undo step. */
  removeItem: (id: string) => void
  updateFinishes: (changes: FinishChanges) => void
  previewFinishes: (changes: FinishChanges) => void
  /** Time of day / orientation: one undo step (preset buttons). */
  updateLighting: (changes: LightingChanges) => void
  /** Live change while a slider moves; `commit` records it. */
  previewLighting: (changes: LightingChanges) => void
  /** Replace the whole design (restoring a save). Can be undone. */
  load: (design: RoomDesign) => void
  commit: () => void
  undo: () => void
  redo: () => void
  /** Back to the room's starting design. Can be undone. */
  reset: () => void
  /** New room size or openings (undefined = standard layout). One undo step. */
  updateLayout: (layout: RoomLayout | undefined) => void
  /** Live layout change while a slider moves; `commit` records it. */
  previewLayout: (layout: RoomLayout | undefined) => void
}

type RoomActions = Omit<RoomHistory, 'design' | 'canUndo' | 'canRedo'>

/**
 * React hook that owns every room's design and its own undo/redo history.
 * Undo in the Bedroom never changes the Kitchen, and each room keeps its
 * furniture, finishes and history while you look at another one.
 */
export function useHouseHistory(getInitialHouse: () => HouseDesign) {
  // The third argument runs `getInitialHouse` only once, on the first render.
  const [state, dispatch] = useReducer(houseReducer, getInitialHouse, (get) => createHouseHistory(get()))

  // Stable functions per room (they never change), so components using them don't re-render needlessly.
  const actions = useMemo(
    () =>
      Object.fromEntries(
        ROOM_IDS.map((room): [RoomId, RoomActions] => {
          const bounds = ROOMS[room]
          const send = (action: HistoryAction) => dispatch({ room, action })
          return [
            room,
            {
              updateItem: (id, changes) => send({ type: 'updateItem', id, changes, transient: false, bounds }),
              previewItem: (id, changes) => send({ type: 'updateItem', id, changes, transient: true, bounds }),
              addItem: (item) => send({ type: 'addItem', item, bounds }),
              addItems: (items) => send({ type: 'addItems', items, bounds }),
              removeItem: (id) => send({ type: 'removeItem', id }),
              updateFinishes: (changes) => send({ type: 'updateFinishes', changes, transient: false }),
              previewFinishes: (changes) => send({ type: 'updateFinishes', changes, transient: true }),
              updateLighting: (changes) => send({ type: 'updateLighting', changes, transient: false }),
              previewLighting: (changes) => send({ type: 'updateLighting', changes, transient: true }),
              load: (design) => send({ type: 'load', design }),
              commit: () => send({ type: 'commit' }),
              undo: () => send({ type: 'undo' }),
              redo: () => send({ type: 'redo' }),
              reset: () => send({ type: 'reset', design: DEFAULT_HOUSE[room] }),
              updateLayout: (layout) => send({ type: 'setLayout', layout, bounds: layout ?? ROOMS[room], transient: false }),
              previewLayout: (layout) => send({ type: 'setLayout', layout, bounds: layout ?? ROOMS[room], transient: true }),
            },
          ]
        }),
      ) as Record<RoomId, RoomActions>,
    [],
  )

  /** What every room looks like right now: this is what gets autosaved and saved. */
  const house = useMemo(() => Object.fromEntries(ROOM_IDS.map((id) => [id, state[id].present])) as HouseDesign, [state])

  /** The history and actions of one room. */
  function forRoom(room: RoomId): RoomHistory {
    const history = state[room]
    return {
      design: history.present,
      canUndo: history.past.length > 0 || history.pending !== null,
      canRedo: history.future.length > 0,
      ...actions[room],
    }
  }

  /** Loads a saved house: every room is replaced, and each room can undo it separately. */
  function loadHouse(next: HouseDesign) {
    for (const id of ROOM_IDS) actions[id].load(next[id])
  }

  return { house, forRoom, loadHouse }
}
