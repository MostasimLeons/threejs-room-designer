// Central place for room measurements (all values are in metres).
// The room is centred on the origin: x runs left→right, z runs back→front, y is up.
export const ROOM = {
  width: 7, // along x
  depth: 6, // along z
  height: 2.8,
  wallThickness: 0.12,
}

// Openings cut into the walls. `center` is measured along the wall.
export const WINDOW_OPENING = { center: -1.9, width: 1.4, bottom: 0.9, top: 2.3 }
export const DOOR_OPENING = { center: 2, width: 0.9, bottom: 0, top: 2.1 }

export type ViewMode = 'perspective' | 'plan'
