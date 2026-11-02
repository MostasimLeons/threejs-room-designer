// Room finishes: the wall paint and the floor material the user can choose.

export type FloorId = 'oak' | 'walnut' | 'ash' | 'concrete' | 'tiles'

export interface RoomFinishes {
  wallColor: string
  floor: FloorId
}

interface FloorOption {
  id: FloorId
  label: string
  /** Colour used for the little preview swatch in the UI. */
  swatch: string
  /** How many metres one copy of the texture covers. */
  tileSize: number
  /** 0 = shiny, 1 = matte. */
  roughness: number
}

export const FLOOR_OPTIONS: FloorOption[] = [
  { id: 'oak', label: 'Oak planks', swatch: '#b98a5c', tileSize: 1.6, roughness: 0.5 },
  { id: 'walnut', label: 'Walnut planks', swatch: '#6f4a31', tileSize: 1.6, roughness: 0.45 },
  { id: 'ash', label: 'Whitewashed ash', swatch: '#e0cdb2', tileSize: 1.6, roughness: 0.55 },
  { id: 'concrete', label: 'Polished concrete', swatch: '#b1aea8', tileSize: 2.5, roughness: 0.35 },
  { id: 'tiles', label: 'Stone tiles', swatch: '#e4ded4', tileSize: 2.4, roughness: 0.3 },
]

export const WALL_SWATCHES = [
  { color: '#e8dcc8', name: 'Warm beige' },
  { color: '#f3f1ec', name: 'Soft white' },
  { color: '#c9cfc0', name: 'Sage' },
  { color: '#c6ccd3', name: 'Mist blue' },
  { color: '#d8c3b4', name: 'Clay' },
  { color: '#9a9590', name: 'Stone grey' },
]

export const DEFAULT_FINISHES: RoomFinishes = { wallColor: '#e8dcc8', floor: 'oak' }

export function getFloorOption(id: FloorId): FloorOption {
  return FLOOR_OPTIONS.find((f) => f.id === id) ?? FLOOR_OPTIONS[0]
}

/** A human-friendly name for a wall colour, or its hex code if it's custom. */
export function wallColorName(color: string): string {
  return WALL_SWATCHES.find((s) => s.color.toLowerCase() === color.toLowerCase())?.name ?? color.toUpperCase()
}
