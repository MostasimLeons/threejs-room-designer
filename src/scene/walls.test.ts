import { describe, expect, it } from 'vitest'
import { ROOM_IDS, ROOMS, WALL_SIDES } from './house'
import { CASING, isCameraBehindWall, localOpenings, openingProblems, skirtingRuns, wallFrame, wallPieces, type LocalOpening } from './walls'
import { ROOM } from './roomConfig'
import { hasMixedWalls, setAllWalls, setWallFinish, wallFinishOf, type RoomFinishes } from './finishes'
import { selectedWall, wallLabel, wallSelection } from './selection'

const windowOpening: LocalOpening = { kind: 'window', label: 'W', center: -1, width: 1, bottom: 0.9, top: 2.3, index: 0 }
const doorOpening: LocalOpening = { kind: 'door', label: 'D', center: 1.5, width: 0.9, bottom: 0, top: 2.1, index: 1 }

/** Total wall area of the pieces, to check nothing is missing or doubled. */
const area = (pieces: ReturnType<typeof wallPieces>) => pieces.reduce((sum, p) => sum + p.size[0] * p.size[1], 0)

describe('room registry', () => {
  it.each(ROOM_IDS)('%s: windows and doors fit their walls and do not overlap', (id) => {
    expect(openingProblems(ROOMS[id])).toEqual([])
  })

  it.each(ROOM_IDS)('%s: has at least one window and one door', (id) => {
    const all = WALL_SIDES.flatMap((side) => ROOMS[id].openings[side] ?? [])
    expect(all.some((o) => o.kind === 'window')).toBe(true)
    expect(all.some((o) => o.kind === 'door')).toBe(true)
  })

  it.each(ROOM_IDS)('%s: the start camera is outside the room, so it can see in', (id) => {
    const { camera, width, depth } = ROOMS[id]
    const [x, , z] = camera.position
    expect(Math.abs(x) > width / 2 || Math.abs(z) > depth / 2).toBe(true)
  })

  it.each(ROOM_IDS)('%s: downlights are on the ceiling, inside the room', (id) => {
    const { downlights, width, depth } = ROOMS[id]
    for (const [x, z] of downlights) {
      expect(Math.abs(x)).toBeLessThan(width / 2)
      expect(Math.abs(z)).toBeLessThan(depth / 2)
    }
  })

  it('catches a window that runs past the end of its wall', () => {
    const broken = {
      width: 3,
      depth: 3,
      openings: { back: [{ kind: 'window' as const, label: 'Too wide', at: 1.4, width: 1, bottom: 0.9, top: 2.3 }] },
    }
    expect(openingProblems(broken)).toHaveLength(1)
  })

  it('catches overlapping openings', () => {
    const broken = {
      width: 5,
      depth: 3,
      openings: {
        back: [
          { kind: 'window' as const, label: 'A', at: 0, width: 1, bottom: 0.9, top: 2.3 },
          { kind: 'window' as const, label: 'B', at: 0.8, width: 1, bottom: 0.9, top: 2.3 },
        ],
      },
    }
    expect(openingProblems(broken)).toEqual(['back: "A" overlaps "B"'])
  })
})

describe('wallFrame', () => {
  const room = { width: 4, depth: 3 }
  const T = ROOM.wallThickness

  it('puts each wall just outside the room, facing in', () => {
    expect(wallFrame('back', room).position).toEqual([0, 0, -1.5 - T / 2])
    expect(wallFrame('right', room).position).toEqual([2 + T / 2, 0, 0])
  })

  it('maps room positions to the direction along the wall', () => {
    expect(wallFrame('back', room).toLocal(1)).toBe(1)
    expect(wallFrame('front', room).toLocal(1)).toBe(-1)
    expect(wallFrame('left', room).toLocal(1)).toBe(-1)
    expect(wallFrame('right', room).toLocal(1)).toBe(1)
  })

  it('back and front walls also cover the corners', () => {
    expect(wallFrame('back', room).length).toBeCloseTo(4 + 2 * T)
    expect(wallFrame('left', room).length).toBe(3)
  })
})

describe('wallPieces', () => {
  const H = ROOM.height

  it('a plain wall is one piece', () => {
    expect(wallPieces(4, [])).toHaveLength(1)
  })

  it('leaves exactly the holes for a window and a door', () => {
    const holes = 1 * (2.3 - 0.9) + 0.9 * 2.1
    expect(area(wallPieces(5, [windowOpening, doorOpening]))).toBeCloseTo(5 * H - holes)
  })

  it('never makes a piece with zero or negative size', () => {
    for (const p of wallPieces(5, [windowOpening, doorOpening])) {
      expect(p.size[0]).toBeGreaterThan(0)
      expect(p.size[1]).toBeGreaterThan(0)
    }
  })
})

describe('skirtingRuns', () => {
  it('stops at doors (and their casing) but runs under windows', () => {
    const runs = skirtingRuns(5, [windowOpening, doorOpening])
    expect(runs).toHaveLength(2)
    expect(runs[0][1]).toBeCloseTo(doorOpening.center - doorOpening.width / 2 - CASING)
    expect(runs[1][0]).toBeCloseTo(doorOpening.center + doorOpening.width / 2 + CASING)
  })
})

describe('localOpenings', () => {
  it('converts room positions to positions along the wall', () => {
    const list = localOpenings('left', ROOMS.living)
    expect(list).toHaveLength(1)
    // The living-room door is at z = 2; the left wall's local x runs towards -z.
    expect(list[0].center).toBe(-2)
  })
})

describe('isCameraBehindWall', () => {
  it('hides the walls between the camera and the room', () => {
    const room = { width: 4, depth: 3 }
    const camera = { x: 6, z: 6 } // front-right
    expect(isCameraBehindWall('front', room, camera)).toBe(true)
    expect(isCameraBehindWall('right', room, camera)).toBe(true)
    expect(isCameraBehindWall('back', room, camera)).toBe(false)
    expect(isCameraBehindWall('left', room, camera)).toBe(false)
  })
})

describe('per-wall finishes', () => {
  const room: RoomFinishes = { wallColor: '#e8dcc8', walls: 'paint', floor: 'oak' }

  it('a wall without its own finish uses the room finish', () => {
    expect(wallFinishOf(room, 'back')).toEqual({ color: '#e8dcc8', style: 'paint' })
  })

  it('gives one wall its own finish without touching the others', () => {
    const next = { ...room, ...setWallFinish(room, 'back', { color: '#2a2a2c', style: 'tiles' }) }
    expect(wallFinishOf(next, 'back')).toEqual({ color: '#2a2a2c', style: 'tiles' })
    expect(wallFinishOf(next, 'left')).toEqual({ color: '#e8dcc8', style: 'paint' })
    expect(hasMixedWalls(next)).toBe(true)
  })

  it('setting a wall back to the room finish drops its own finish', () => {
    const feature = { ...room, ...setWallFinish(room, 'back', { color: '#2a2a2c', style: 'paint' }) }
    const back = { ...feature, ...setWallFinish(feature, 'back', { color: '#E8DCC8', style: 'paint' }) }
    expect(back.wallFinishes).toBeUndefined()
    expect(hasMixedWalls(back)).toBe(false)
  })

  it('"use on all walls" makes every wall the same', () => {
    const feature = { ...room, ...setWallFinish(room, 'back', { color: '#2a2a2c', style: 'tiles' }) }
    const all = { ...feature, ...setAllWalls({ color: '#2a2a2c', style: 'tiles' }) }
    for (const side of WALL_SIDES) expect(wallFinishOf(all, side)).toEqual({ color: '#2a2a2c', style: 'tiles' })
    expect(hasMixedWalls(all)).toBe(false)
  })
})

describe('selection ids', () => {
  it('round-trips walls and rejects anything else', () => {
    for (const side of WALL_SIDES) expect(selectedWall(wallSelection(side))).toBe(side)
    expect(selectedWall('sofa')).toBeNull()
    expect(selectedWall('wall:ceiling')).toBeNull()
    expect(selectedWall(null)).toBeNull()
    expect(wallLabel('back')).toBe('Back wall')
  })
})
