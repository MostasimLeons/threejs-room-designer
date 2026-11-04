import { DEFAULT_LAYOUTS } from './furniture/catalog'
import { DEFAULT_FINISHES, type RoomFinishes } from './finishes'
import type { FurnitureItem } from './furniture/catalog'

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
 * The default camera looks from the front-right, so the front and right walls
 * hide themselves (see Cutaway) and you see into the room.
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
   * Where the two shadow-casting lights sit, relative to the room centre. The
   * sun is placed so its light comes in through a window.
   */
  lights: { ceiling: Vec3; sun: Vec3 }
  defaultFinishes: RoomFinishes
  defaultItems: FurnitureItem[]
  /** Built-in decor that isn't a window or door, for the Objects list. */
  features: { name: string; detail: string; color: string }[]
}

const DOOR_HEIGHT = 2.1

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
    lights: { ceiling: [3, 7, 4], sun: [-5.7, 5, -9] },
    defaultFinishes: DEFAULT_FINISHES,
    defaultItems: DEFAULT_LAYOUTS.living,
    features: [],
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
    lights: { ceiling: [3, 7, 4], sun: [7.9, 5, -9] },
    defaultFinishes: DEFAULT_FINISHES,
    defaultItems: DEFAULT_LAYOUTS.bedroom,
    features: [
      { name: 'Oak slat wall', detail: 'behind bed', color: '#c49a6c' },
      { name: 'Cream carpet', detail: '320 × 250 cm', color: '#ece3d2' },
    ],
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
    lights: { ceiling: [3, 7, 4], sun: [-1.5, 5, -9] },
    defaultFinishes: { wallColor: '#f3f1ec', floor: 'walnut' },
    defaultItems: DEFAULT_LAYOUTS.dining,
    features: [],
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
    lights: { ceiling: [3, 7, 4], sun: [3.1, 7, -9] },
    defaultFinishes: { wallColor: '#f3f1ec', floor: 'tiles' },
    defaultItems: DEFAULT_LAYOUTS.kitchen,
    features: [],
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
    camera: { position: [3.4, 3.6, 3.9], target: [0, 0.8, -0.2] },
    lights: { ceiling: [3, 7, 4], sun: [5, 12, -9] },
    defaultFinishes: { wallColor: '#c6ccd3', floor: 'tiles' },
    defaultItems: DEFAULT_LAYOUTS.bathroom,
    features: [],
  },
}

export function isRoomId(value: unknown): value is RoomId {
  return typeof value === 'string' && (ROOM_IDS as string[]).includes(value)
}
