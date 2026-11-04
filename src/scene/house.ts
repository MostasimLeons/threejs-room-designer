import { ROOM } from './roomConfig'

// The house: the original Living Room plus a Bedroom built against its right side.
//
//   z = -3 ┌──────────── Living 7 × 6 ───────────┬──── Bedroom 5 × 4 ────┐
//          │                                    ║                       │
//          │                                    ║ door                  │
//   z =  1 │                                    ╨───────────────────────┘
//          │                                    (open front, like the living room)
//   z =  3 └────────────────────────────────────┘
//        x = -3.5                         x = 3.5 │ 3.62               x = 8.62
//
// The Living Room keeps its original coordinates (centred on the origin), so none
// of its furniture moves. The shared wall fills the gap 3.5 → 3.62 that used to be
// the Living Room's open right side.

export type RoomId = 'living' | 'bedroom'

export interface RoomInfo {
  id: RoomId
  label: string
  width: number // along x
  depth: number // along z
  /** World position of the room's centre on the floor, [x, z]. Furniture positions are relative to this. */
  center: [number, number]
}

const T = ROOM.wallThickness
const BEDROOM_WIDTH = 5
const BEDROOM_DEPTH = 4
const BEDROOM_LEFT = ROOM.width / 2 + T // inner face of the shared wall on the bedroom side

export const ROOMS: Record<RoomId, RoomInfo> = {
  living: { id: 'living', label: 'Living Room', width: ROOM.width, depth: ROOM.depth, center: [0, 0] },
  bedroom: {
    id: 'bedroom',
    label: 'Bedroom',
    width: BEDROOM_WIDTH,
    depth: BEDROOM_DEPTH,
    // Back walls line up with the Living Room's back wall (z = -3).
    center: [BEDROOM_LEFT + BEDROOM_WIDTH / 2, -ROOM.depth / 2 + BEDROOM_DEPTH / 2],
  },
}

export const ROOM_IDS: RoomId[] = ['living', 'bedroom']

/** Shared wall between the rooms: runs along z at x = 3.5 → 3.62, as long as the bedroom is deep. */
export const SHARED_WALL = {
  x: ROOM.width / 2 + T / 2, // centre line of the wall
  zStart: -ROOM.depth / 2,
  zEnd: -ROOM.depth / 2 + BEDROOM_DEPTH,
}

/** Connecting door in the shared wall. `center` is its world z position. */
export const CONNECTING_DOOR = { center: 0.25, width: 0.9, bottom: 0, top: 2.1 }

/** Bedroom window in the bedroom's back wall. `center` is measured from the bedroom's centre along x. */
export const BEDROOM_WINDOW = { center: 2.0, width: 0.9, bottom: 0.9, top: 2.3 }
