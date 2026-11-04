import { DEFAULT_LAYOUTS } from './furniture/catalog'
import { DEFAULT_FINISHES, type RoomFinishes } from './finishes'
import type { FixedZone, FurnitureItem } from './furniture/catalog'

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

export type WallSide = 'back' | 'right' | 'front' | 'left'
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
  /** Built-in units that furniture shouldn't overlap (kitchen units, toilet). */
  fixedZones: FixedZone[]
}

const DOOR_HEIGHT = 2.1

/** Built-in units, shared with the 3D decor (rooms/decor.tsx) so both always agree. */
export const KITCHEN_UNIT_DEPTH = 0.62
export const TOILET_POSITION: [number, number] = [-1.05, -0.95]
export const TOILET_SIZE: [number, number] = [0.4, 0.6]

export const ROOMS: Record<RoomId, RoomInfo> = {
  living: {
    id: 'living',
    label: 'Living Room',
    shortLabel: 'Living',
    width: 7,
    depth: 6,
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
    fixedZones: [{ label: 'kitchen units', position: [0, -1.75 + KITCHEN_UNIT_DEPTH / 2], size: [4, KITCHEN_UNIT_DEPTH] }],
  },

  bathroom: {
    id: 'bathroom',
    label: 'Bathroom',
    shortLabel: 'Bath',
    width: 3,
    depth: 2.5,
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
    fixedZones: [{ label: 'toilet', position: TOILET_POSITION, size: TOILET_SIZE }],
  },
}

export function isRoomId(value: unknown): value is RoomId {
  return typeof value === 'string' && (ROOM_IDS as string[]).includes(value)
}
