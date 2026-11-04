import { describe, expect, it } from 'vitest'
import { clamp, degToRad, normalizeDegrees } from './math'

describe('math helpers', () => {
  it('clamp limits a value to a range', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
    expect(clamp(2, 0, 3)).toBe(2)
  })

  it.each([
    [-45, 315],
    [405, 45],
    [360, 0],
    [89.6, 90],
    [-720, 0],
  ])('normalizeDegrees(%d) = %d', (input, expected) => {
    expect(normalizeDegrees(input)).toBe(expected)
  })

  it('degToRad converts degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI)
  })
})
