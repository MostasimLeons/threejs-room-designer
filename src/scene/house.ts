import { DEFAULT_LAYOUTS } from './furniture/catalog'
import { DEFAULT_FINISHES, type RoomFinishes, type WallName } from './finishes'
import type { FixedZone, FurnitureItem } from './furniture/catalog'
import { ROOM } from './roomConfig'

/**
 * The room registry: everything that makes each room different, as plain data.
 * RoomShell.tsx builds the 3D room from it, so adding a room means adding an
 * entry here, not writing a new component.
 *
 * Each room is its own scene, centred on the origin: x runs left → right,
 * z runs back → front, y is up. Only the room you're editing is drawn.
 *
 *            back wall (z = -depth/2)
 *          ┌──────────────────────┐
 *   left   │                      │  right
 *   wall   │        (0, 0)        │  wall
 *          │                      │
 *          └──────────────────────┘
 *            front wall (z = +depth/2)
 *
 * The start camera usually looks from the front-right, so the front and right
 * walls hide themselves (see Cutaway) and you see into the room. A room can pick
 * another corner, as the Bathroom does to keep its vanity wall in view.
 */

export type RoomId = 'living' | 'bedroom' | 'dining' | 'kitchen' | 'bathroom'

/** The order rooms appear in the room bar (and the 1–5 keyboard shortcuts). */
export const ROOM_IDS: RoomId[] = ['living', 'bedroom', 'dining', 'kitchen', 'bathroom']

/** The four walls. Defined in finishes.ts (as WallName) so per-wall finishes can use it too. */
export type WallSide = WallName
export const WALL_SIDES: WallSide[] = ['back', 'right', 'front', 'left']

type Vec3 = [number, number, number]

/** A window or door in a wall. */
export interface Opening {
  kind: 'window' | 'door'
  /** Shown in the Objects list, e.g. "Door to bedroom". */
  label: string
  /**
   * Where along the wall its centre is, in room coordinates: the x position for
   * the back and front walls, the z position for the left and right walls.
   */
  at: number
  width: number
  /** Height of the bottom and top edge above the floor. Doors start at 0. */
  bottom: number
  top: number
  /** Windows only: a brass rod with curtains drawn to the sides. */
  curtains?: boolean
}

export interface RoomInfo {
  id: RoomId
  label: string
  /** Shorter name for the room bar on narrow phone screens. */
  shortLabel: string
  width: number // along x
  depth: number // along z
  /** Ceiling height in metres (2.8 unless the layout changes it). */
  height: number
  /** Wall thickness in metres (12 cm unless the layout changes it). Walls grow outward: width and depth are inside sizes. */
  wallThickness: number
  openings: Partial<Record<WallSide, Opening[]>>
  /** Recessed ceiling lights, as [x, z]. */
  downlights: [number, number][]
  /** Where the Perspective camera starts and what it looks at. */
  camera: { position: Vec3; target: Vec3 }
  /**
   * Where the overhead fill light sits, relative to the room centre. (The sun's
   * position comes from the time of day and the room's orientation; see sun.ts.)
   */
  lights: { ceiling: Vec3 }
  defaultFinishes: RoomFinishes
  defaultItems: FurnitureItem[]
  /** Built-in decor that isn't a window or door, for the Objects list. */
  features: { name: string; detail: string; color: string }[]
  /**
   * Built-in units that furniture shouldn't overlap (kitchen units, toilet), and the
   * windows and doors (for pieces hung on a wall). Worked out from the room's size
   * and openings: see `builtIns` and resolveRoom.
   */
  fixedZones: FixedZone[]
  /** Built-in units for a room of this size (they follow the walls when the room is resized). */
  builtIns?: (width: number, depth: number) => FixedZone[]
}

const DOOR_HEIGHT = 2.1

/** Built-in units, shared with the 3D decor (rooms/decor.tsx) so both always agree. */
export const KITCHEN_UNIT_DEPTH = 0.62
export const TOILET_SIZE: [number, number] = [0.4, 0.6]
/** The toilet's centre, measured from the left and back walls (it keeps this distance when the room is resized). */
const TOILET_FROM_CORNER: [number, number] = [0.45, 0.3]

/** Kitchen units: the whole back wall, KITCHEN_UNIT_DEPTH deep. */
export function kitchenZones(width: number, depth: number): FixedZone[] {
  return [{ label: 'kitchen units', position: [0, -depth / 2 + KITCHEN_UNIT_DEPTH / 2], size: [width, KITCHEN_UNIT_DEPTH] }]
}

/** The toilet against the back wall, near the left corner. */
export function toiletZones(width: number, depth: number): FixedZone[] {
  return [{ label: 'toilet', position: [-width / 2 + TOILET_FROM_CORNER[0], -depth / 2 + TOILET_FROM_CORNER[1]], size: TOILET_SIZE }]
}

export const ROOMS: Record<RoomId, RoomInfo> = {
  living: {
    id: 'living',
    label: 'Living Room',
    shortLabel: 'Living',
    width: 7,
    depth: 6,
    height: ROOM.height,
    wallThickness: ROOM.wallThickness,
    openings: {
      back: [{ kind: 'window', label: 'Window', at: -1.9, width: 1.4, bottom: 0.9, top: 2.3 }],
      left: [{ kind: 'door', label: 'Door', at: 2, width: 0.9, bottom: 0, top: DOOR_HEIGHT }],
      right: [{ kind: 'door', label: 'Door to bedroom', at: 0.25, width: 0.9, bottom: 0, top: DOOR_HEIGHT }],
    },
    downlights: [
      [-1.8, -1.5],
      [1.8, -1.5],
      [-1.8, 1.5],
      [1.8, 1.5],
    ],
    camera: { position: [6.2, 4.4, 6.4], target: [0, 0.8, -0.8] },
    lights: { ceiling: [3, 7, 4] },
    defaultFinishes: DEFAULT_FINISHES,
    defaultItems: DEFAULT_LAYOUTS.living,
    features: [],
    fixedZones: [],
  },

  bedroom: {
    id: 'bedroom',
    label: 'Bedroom',
    shortLabel: 'Bedroom',
    width: 5,
    depth: 4,
    height: ROOM.height,
    wallThickness: ROOM.wallThickness,
    openings: {
      back: [{ kind: 'window', label: 'Window + curtains', at: 2.0, width: 0.9, bottom: 0.9, top: 2.3, curtains: true }],
      left: [{ kind: 'door', label: 'Door to living room', at: 1.25, width: 0.9, bottom: 0, top: DOOR_HEIGHT }],
    },
    downlights: [
      [-1.5, 1.1],
      [1.5, 1.1],
      [1.7, -0.9],
    ],
    camera: { position: [5.4, 4.5, 6.0], target: [-0.2, 0.7, -0.4] },
    lights: { ceiling: [3, 7, 4] },
    defaultFinishes: DEFAULT_FINISHES,
    defaultItems: DEFAULT_LAYOUTS.bedroom,
    features: [
      { name: 'Oak slat wall', detail: 'behind bed', color: '#c49a6c' },
      { name: 'Cream carpet', detail: '320 × 250 cm', color: '#ece3d2' },
    ],
    fixedZones: [],
  },

  dining: {
    id: 'dining',
    label: 'Dining Room',
    shortLabel: 'Dining',
    width: 4.5,
    depth: 4,
    height: ROOM.height,
    wallThickness: ROOM.wallThickness,
    openings: {
      back: [{ kind: 'window', label: 'Window', at: 0, width: 1.6, bottom: 0.9, top: 2.3 }],
      left: [{ kind: 'door', label: 'Door', at: 1.2, width: 0.9, bottom: 0, top: DOOR_HEIGHT }],
    },
    downlights: [
      [-1.2, -0.9],
      [1.2, -0.9],
      [-1.2, 0.9],
      [1.2, 0.9],
    ],
    camera: { position: [4.6, 4.2, 5.2], target: [0, 0.7, -0.3] },
    lights: { ceiling: [3, 7, 4] },
    defaultFinishes: { wallColor: '#f3f1ec', walls: 'paint', floor: 'walnut' },
    defaultItems: DEFAULT_LAYOUTS.dining,
    features: [{ name: 'Pendant light', detail: 'over the table', color: '#2a2a2c' }],
    // The pendant hangs above head height, so it doesn't block furniture.
    fixedZones: [],
  },

  kitchen: {
    id: 'kitchen',
    label: 'Kitchen',
    shortLabel: 'Kitchen',
    width: 4,
    depth: 3.5,
    height: ROOM.height,
    wallThickness: ROOM.wallThickness,
    openings: {
      // Higher sill: it sits above the worktop.
      back: [{ kind: 'window', label: 'Window', at: 0.6, width: 1.2, bottom: 1.05, top: 2.2 }],
      left: [{ kind: 'door', label: 'Door', at: 0.9, width: 0.9, bottom: 0, top: DOOR_HEIGHT }],
    },
    downlights: [
      [-1.1, -0.6],
      [1.1, -0.6],
      [0, 0.9],
    ],
    camera: { position: [4.2, 4.0, 4.6], target: [0, 0.8, -0.3] },
    lights: { ceiling: [3, 7, 4] },
    defaultFinishes: { wallColor: '#f3f1ec', walls: 'paint', floor: 'tiles' },
    defaultItems: DEFAULT_LAYOUTS.kitchen,
    features: [{ name: 'Kitchen units', detail: '400 cm, sink + hob', color: '#f1ebdf' }],
    // Base units along the whole back wall, 62 cm deep (see KitchenUnits in rooms/decor.tsx).
    fixedZones: [],
    builtIns: kitchenZones,
  },

  bathroom: {
    id: 'bathroom',
    label: 'Bathroom',
    shortLabel: 'Bath',
    width: 3,
    depth: 2.5,
    height: ROOM.height,
    wallThickness: ROOM.wallThickness,
    openings: {
      // Small, high window for privacy.
      back: [{ kind: 'window', label: 'Window', at: 0.7, width: 0.6, bottom: 1.4, top: 2.0 }],
      left: [{ kind: 'door', label: 'Door', at: 0.55, width: 0.8, bottom: 0, top: DOOR_HEIGHT }],
    },
    downlights: [[0, 0]],
    // From the front-left, so the right wall (vanity and mirror) stays visible.
    camera: { position: [-3.4, 3.6, 3.9], target: [0, 0.8, -0.2] },
    lights: { ceiling: [3, 7, 4] },
    defaultFinishes: { wallColor: '#f3f1ec', walls: 'tiles', floor: 'terrazzo' },
    defaultItems: DEFAULT_LAYOUTS.bathroom,
    features: [{ name: 'Toilet', detail: 'wall-mounted', color: '#f6f5f2' }],
    fixedZones: [],
    builtIns: toiletZones,
  },
}

/**
 * Windows and doors as zones on their wall (10 cm deep), so art, mirrors and
 * shelves hung on a wall don't cover them. Floor furniture ignores these zones:
 * a sofa in front of a window is fine.
 */
export function openingZones(info: Pick<RoomInfo, 'width' | 'depth' | 'openings'>): FixedZone[] {
  const zones: FixedZone[] = []
  const t = 0.1
  for (const [side, openings] of Object.entries(info.openings) as [WallSide, Opening[]][]) {
    for (const o of openings) {
      const label = o.label.toLowerCase()
      if (side === 'back') zones.push({ label, position: [o.at, -info.depth / 2 + t / 2], size: [o.width, t], onWall: true })
      if (side === 'front') zones.push({ label, position: [o.at, info.depth / 2 - t / 2], size: [o.width, t], onWall: true })
      if (side === 'left') zones.push({ label, position: [-info.width / 2 + t / 2, o.at], size: [t, o.width], onWall: true })
      if (side === 'right') zones.push({ label, position: [info.width / 2 - t / 2, o.at], size: [t, o.width], onWall: true })
    }
  }
  return zones
}

/** Built-in units and openings as overlap zones, for a room of this size and these openings. */
function zonesOf(info: RoomInfo): FixedZone[] {
  return [...(info.builtIns?.(info.width, info.depth) ?? []), ...openingZones(info)]
}

for (const id of Object.keys(ROOMS) as RoomId[]) ROOMS[id].fixedZones = zonesOf(ROOMS[id])

/**
 * A room's shape as the layout editor changes it (Phase 12): inner size, ceiling
 * height and the windows and doors on each wall. Saved with the room's design;
 * a design without one uses the room's standard layout from ROOMS.
 */
export interface RoomLayout {
  width: number
  depth: number
  height: number
  /** Saved layouts from before Phase 14 don't have it: they get the standard 12 cm. */
  wallThickness: number
  openings: Partial<Record<WallSide, Opening[]>>
}

const resolved = new WeakMap<RoomLayout, RoomInfo>()

/**
 * Everything about a room for a given layout: its size, height and openings, plus
 * what follows from them. Downlights, the overview camera and the overhead light
 * keep their relative place in the room; built-in units follow the walls. Without
 * a layout it's the standard room. Results are cached per layout object.
 */
export function resolveRoom(room: RoomId, layout?: RoomLayout | null): RoomInfo {
  const base = ROOMS[room]
  if (!layout) return base
  const cached = resolved.get(layout)
  if (cached && cached.id === room) return cached
  const sx = layout.width / base.width
  const sz = layout.depth / base.depth
  const grow = Math.max(sx, sz)
  const [px, py, pz] = base.camera.position
  const [tx, ty, tz] = base.camera.target
  const [cx, cy, cz] = base.lights.ceiling
  const info: RoomInfo = {
    ...base,
    width: layout.width,
    depth: layout.depth,
    height: layout.height,
    wallThickness: layout.wallThickness,
    openings: layout.openings,
    downlights: base.downlights.map(([x, z]) => [x * sx, z * sz]),
    // The overview stays in the same corner, as far out as the room has grown (and up with a taller ceiling).
    camera: {
      position: [px * grow, py * Math.max(grow, layout.height / ROOM.height), pz * grow],
      target: [tx * sx, ty, tz * sz],
    },
    lights: { ceiling: [cx * sx, cy, cz * sz] },
    fixedZones: [],
  }
  info.fixedZones = zonesOf(info)
  resolved.set(layout, info)
  return info
}

export function isRoomId(value: unknown): value is RoomId {
  return typeof value === 'string' && (ROOM_IDS as string[]).includes(value)
}
