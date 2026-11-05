// Measurements shared by every room (in metres). Each room's own size, windows
// and doors live in its entry in house.ts.
export const ROOM = {
  height: 2.8,
  wallThickness: 0.12,
}

export type ViewMode = 'perspective' | 'plan'
