import { placeInRoom, FURNITURE_INFO, getVariant, isAllowedIn, type FurnitureItem, type FurnitureType } from '../scene/furniture/catalog'
import { normalizeDegrees } from '../utils/math'
import { DEFAULT_LIGHTING, normalizeLighting, type RoomLighting } from '../scene/sun'
import {
  FLOOR_OPTIONS,
  WALL_STYLES,
  type FloorId,
  type RoomFinishes,
  type WallFinish,
  type WallName,
  type WallStyle,
} from '../scene/finishes'
import { resolveRoom, ROOM_IDS, ROOMS, type RoomId, type RoomLayout } from '../scene/house'
import { isDefaultLayout, parseLayout } from '../scene/layout'

/**
 * Everything that describes one room configuration. This is what undo/redo
 * tracks and what gets saved, exported and restored.
 */
export interface RoomDesign {
  finishes: RoomFinishes
  items: FurnitureItem[]
  /** This room's time of day and which way its windows face. */
  lighting: RoomLighting
  /**
   * The room's size, ceiling height, windows and doors when changed in the layout
   * editor (Phase 12). Missing = the room's standard layout (house.ts).
   */
  layout?: RoomLayout
}

/** The whole house: one independent design per room. This is what Save / Load stores. */
export type HouseDesign = Record<RoomId, RoomDesign>

/** Every room's starting design (from house.ts). "Reset" returns a room to its entry here. */
export const DEFAULT_HOUSE = Object.fromEntries(
  ROOM_IDS.map((id) => [id, { finishes: ROOMS[id].defaultFinishes, items: ROOMS[id].defaultItems, lighting: DEFAULT_LIGHTING }]),
) as HouseDesign

export const DEFAULT_DESIGN = DEFAULT_HOUSE.living
export const DEFAULT_BEDROOM_DESIGN = DEFAULT_HOUSE.bedroom

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const WALL_NAMES: WallName[] = ['back', 'right', 'front', 'left']

/** Reads per-wall finishes, skipping any wall whose colour or style isn't valid. */
function parseWallFinishes(raw: unknown): Partial<Record<WallName, WallFinish>> | null {
  if (!isRecord(raw)) return null
  const result: Partial<Record<WallName, WallFinish>> = {}
  for (const wall of WALL_NAMES) {
    const entry = raw[wall]
    if (!isRecord(entry)) continue
    const { color, style } = entry
    if (typeof color === 'string' && HEX_COLOR.test(color) && WALL_STYLES.some((s) => s.id === style)) {
      result[wall] = { color, style: style as WallStyle }
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

function parseItem(raw: unknown, room: RoomId, bounds: { width: number; depth: number }): FurnitureItem | null {
  if (!isRecord(raw)) return null
  const { id, type, variant, position, rotation, color, frame } = raw
  if (typeof id !== 'string' || typeof type !== 'string' || !(type in FURNITURE_INFO)) return null
  if (!Array.isArray(position) || position.length !== 2 || !position.every((n) => typeof n === 'number' && Number.isFinite(n))) return null
  if (typeof rotation !== 'number' || !Number.isFinite(rotation)) return null
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) return null

  const furnitureType = type as FurnitureType
  // Rooms never mix: furniture that doesn't belong in this room is skipped.
  if (!isAllowedIn(furnitureType, room)) return null
  // Unknown or missing variants fall back to the default one.
  const item: FurnitureItem = {
    id,
    type: furnitureType,
    variant: getVariant(furnitureType, typeof variant === 'string' ? variant : '').id,
    position: [position[0], position[1]],
    rotation: normalizeDegrees(rotation),
    color,
  }
  // A frame finish the piece doesn't offer (or from a newer version) is dropped: standard look.
  const frames = FURNITURE_INFO[furnitureType].frame?.options as string[] | undefined
  if (typeof frame === 'string' && frames?.includes(frame)) item.frame = frame as FurnitureItem['frame']
  Object.assign(item, placeInRoom(item, bounds))
  return item
}

/**
 * Checks data from storage or an imported file and turns it into a valid
 * design. Returns null if it doesn't look like a room design at all.
 */
export function parseDesign(raw: unknown, room: RoomId = 'living'): RoomDesign | null {
  if (!isRecord(raw) || !Array.isArray(raw.items)) return null

  // The layout first: furniture is kept inside the walls of the room as saved.
  const parsedLayout = parseLayout(raw.layout)
  const layout = parsedLayout && !isDefaultLayout(room, parsedLayout) ? parsedLayout : undefined
  const bounds = resolveRoom(room, layout)

  const items: FurnitureItem[] = []
  for (const entry of raw.items) {
    const item = parseItem(entry, room, bounds)
    // Skip broken entries and duplicate ids instead of failing the whole file.
    if (item && !items.some((existing) => existing.id === item.id)) items.push(item)
  }

  const finishes: RoomFinishes = { ...ROOMS[room].defaultFinishes }
  if (isRecord(raw.finishes)) {
    const { wallColor, walls, floor } = raw.finishes
    if (typeof wallColor === 'string' && HEX_COLOR.test(wallColor)) finishes.wallColor = wallColor
    if (WALL_STYLES.some((style) => style.id === walls)) finishes.walls = walls as WallStyle
    const perWall = parseWallFinishes(raw.finishes.wallFinishes)
    if (perWall) finishes.wallFinishes = perWall
    if (FLOOR_OPTIONS.some((f) => f.id === floor)) finishes.floor = floor as FloorId
  }

  // Saves from before time of day existed get the default (an afternoon, windows facing south).
  const lighting = { ...DEFAULT_LIGHTING }
  if (isRecord(raw.lighting)) {
    const { time, orientation } = raw.lighting
    if (typeof time === 'number' && Number.isFinite(time)) lighting.time = time
    if (typeof orientation === 'number' && Number.isFinite(orientation)) lighting.orientation = orientation
  }

  return { finishes, items, lighting: normalizeLighting(lighting), ...(layout ? { layout } : {}) }
}

/**
 * Phase 2 shipped the Dining Room, Kitchen and Bathroom with only a starter plant.
 * A room that still holds nothing but that plant was never furnished by you, so
 * it gets the real default furniture. Its finishes (paint, floor) are kept.
 */
const STARTER_PLANT_IDS: Partial<Record<RoomId, string>> = {
  dining: 'dining-plant',
  kitchen: 'kitchen-plant',
  bathroom: 'bathroom-plant',
}

function upgradeStarterRoom(id: RoomId, design: RoomDesign): RoomDesign {
  const starter = STARTER_PLANT_IDS[id]
  const onlyStarter = design.items.length === 1 && design.items[0].id === starter && design.items[0].type === 'plant'
  return onlyStarter ? { ...design, items: ROOMS[id].defaultItems } : design
}

/**
 * Checks saved/imported data for the whole house. Rooms missing from the data
 * (saves from before the Bedroom, Dining Room, Kitchen and Bathroom existed)
 * start from their defaults, so no older save is lost. Files with just one room
 * (the oldest format) become the Living Room.
 */
export function parseHouseDesign(raw: unknown): HouseDesign | null {
  if (!isRecord(raw)) return null

  if (isRecord(raw.rooms)) {
    const rooms = raw.rooms
    const house = { ...DEFAULT_HOUSE }
    let found = false
    for (const id of ROOM_IDS) {
      const design = parseDesign(rooms[id], id)
      if (design) {
        house[id] = upgradeStarterRoom(id, design)
        found = true
      }
    }
    return found ? house : null
  }

  // Older single-room format: { finishes, items }
  const living = parseDesign(raw, 'living')
  return living ? { ...DEFAULT_HOUSE, living } : null
}
