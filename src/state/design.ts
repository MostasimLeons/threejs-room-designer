import { clampToRoom, DEFAULT_LAYOUT, FURNITURE_INFO, getVariant, type FurnitureItem, type FurnitureType } from '../scene/furniture/catalog'
import { normalizeDegrees } from '../utils/math'
import { DEFAULT_FINISHES, FLOOR_OPTIONS, type FloorId, type RoomFinishes } from '../scene/finishes'

/**
 * Everything that describes one room configuration. This is what undo/redo
 * tracks and what gets saved, exported and restored.
 */
export interface RoomDesign {
  finishes: RoomFinishes
  items: FurnitureItem[]
}

export const DEFAULT_DESIGN: RoomDesign = { finishes: DEFAULT_FINISHES, items: DEFAULT_LAYOUT }

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseItem(raw: unknown): FurnitureItem | null {
  if (!isRecord(raw)) return null
  const { id, type, variant, position, rotation, color } = raw
  if (typeof id !== 'string' || typeof type !== 'string' || !(type in FURNITURE_INFO)) return null
  if (!Array.isArray(position) || position.length !== 2 || !position.every((n) => typeof n === 'number' && Number.isFinite(n))) return null
  if (typeof rotation !== 'number' || !Number.isFinite(rotation)) return null
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) return null

  const furnitureType = type as FurnitureType
  // Unknown or missing variants fall back to the default one.
  const item: FurnitureItem = {
    id,
    type: furnitureType,
    variant: getVariant(furnitureType, typeof variant === 'string' ? variant : '').id,
    position: [position[0], position[1]],
    rotation: normalizeDegrees(rotation),
    color,
  }
  item.position = clampToRoom(item)
  return item
}

/**
 * Checks data from storage or an imported file and turns it into a valid
 * design. Returns null if it doesn't look like a room design at all.
 */
export function parseDesign(raw: unknown): RoomDesign | null {
  if (!isRecord(raw) || !Array.isArray(raw.items)) return null

  const items: FurnitureItem[] = []
  for (const entry of raw.items) {
    const item = parseItem(entry)
    // Skip broken entries and duplicate ids instead of failing the whole file.
    if (item && !items.some((existing) => existing.id === item.id)) items.push(item)
  }

  const finishes: RoomFinishes = { ...DEFAULT_FINISHES }
  if (isRecord(raw.finishes)) {
    const { wallColor, floor } = raw.finishes
    if (typeof wallColor === 'string' && HEX_COLOR.test(wallColor)) finishes.wallColor = wallColor
    if (FLOOR_OPTIONS.some((f) => f.id === floor)) finishes.floor = floor as FloorId
  }

  return { finishes, items }
}
