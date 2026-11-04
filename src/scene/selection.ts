import type { WallSide } from './house'

/**
 * What can be selected in the 3D view, as one string so the rest of the app can
 * keep a single `selectedId`:
 * - a furniture item's id (e.g. "sofa")
 * - "wall:back", "wall:right", "wall:front" or "wall:left"
 * - "floor"
 */
export const FLOOR_SELECTION = 'floor'

const WALL_PREFIX = 'wall:'

export function wallSelection(side: WallSide): string {
  return WALL_PREFIX + side
}

/** The wall a selection points at, or null if it isn't a wall. */
export function selectedWall(selectedId: string | null): WallSide | null {
  if (!selectedId?.startsWith(WALL_PREFIX)) return null
  const side = selectedId.slice(WALL_PREFIX.length)
  return side === 'back' || side === 'right' || side === 'front' || side === 'left' ? side : null
}

/** Readable name for a wall, e.g. "Back wall". */
export function wallLabel(side: WallSide): string {
  return `${side[0].toUpperCase()}${side.slice(1)} wall`
}
