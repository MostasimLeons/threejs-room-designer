import { describe, expect, it } from 'vitest'
import { ROOM_IDS, ROOMS } from './house'
import { ROOM } from './roomConfig'
import { cameraView, cameraViews, fitToAspect } from './cameraViews'

const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

describe('cameraViews', () => {
  it.each(ROOM_IDS)('%s: overview, eye level and corner, in that order', (room) => {
    expect(cameraViews(room).map((view) => view.id)).toEqual(['overview', 'eye', 'corner'])
  })

  it.each(ROOM_IDS)('%s: the eye-level and corner cameras stand inside the room, below the ceiling', (room) => {
    const { width, depth } = ROOMS[room]
    for (const id of ['eye', 'corner'] as const) {
      const [x, y, z] = cameraView(room, id).position
      expect(Math.abs(x)).toBeLessThan(width / 2)
      expect(Math.abs(z)).toBeLessThan(depth / 2)
      expect(y).toBeLessThan(ROOM.height)
      expect(y).toBeGreaterThan(1)
    }
  })

  it.each(ROOM_IDS)('%s: every view looks at a point at least 0.6 m away (the closest the controls allow)', (room) => {
    for (const view of cameraViews(room)) expect(distance(view.position, view.target)).toBeGreaterThanOrEqual(0.6)
  })

  it('the corner view is on the same side as the overview (the bathroom looks from the left)', () => {
    expect(Math.sign(cameraView('bathroom', 'corner').position[0])).toBe(Math.sign(ROOMS.bathroom.camera.position[0]))
    expect(Math.sign(cameraView('living', 'corner').position[0])).toBe(1)
  })
})

describe('fitToAspect', () => {
  const overview = cameraView('living', 'overview')

  it('leaves wide views alone', () => {
    expect(fitToAspect(overview, 1.8)).toEqual(overview)
  })

  it('pulls the overview back on narrow views, along the same line of sight', () => {
    const fitted = fitToAspect(overview, 0.6)
    expect(distance(fitted.position, fitted.target)).toBeGreaterThan(distance(overview.position, overview.target))
    expect(fitted.target).toEqual(overview.target)
  })

  it('never steps back more than 1.9×', () => {
    const fitted = fitToAspect(overview, 0.1)
    expect(distance(fitted.position, fitted.target)).toBeCloseTo(distance(overview.position, overview.target) * 1.9)
  })

  it('never moves a view from inside the room', () => {
    const eye = cameraView('living', 'eye')
    expect(fitToAspect(eye, 0.5)).toEqual(eye)
  })
})
