import { describe, expect, it } from 'vitest'
import { AUTO_SAMPLE_FRAMES, autoStep, IDLE_GAP_MS, QUALITY, QUALITY_LEVELS, SLOW_FRAME_MS, startingLevel } from './quality'

const frames = (ms: number, count = AUTO_SAMPLE_FRAMES) => Array.from({ length: count }, () => ms)

describe('quality levels', () => {
  it('each level does less work than the one above it', () => {
    for (let i = 1; i < QUALITY_LEVELS.length; i++) {
      const higher = QUALITY[QUALITY_LEVELS[i - 1]]
      const lower = QUALITY[QUALITY_LEVELS[i]]
      expect(lower.maxDpr).toBeLessThanOrEqual(higher.maxDpr)
      expect(lower.shadowMapSize).toBeLessThanOrEqual(higher.shadowMapSize)
      expect(lower.reflectionResolution).toBeLessThanOrEqual(higher.reflectionResolution)
    }
    expect(QUALITY.low.ambientOcclusion).toBeNull()
    expect(QUALITY.low.reflectionResolution).toBe(0)
  })
})

describe('startingLevel', () => {
  it('starts desktops at High', () => {
    expect(startingLevel({ coarsePointer: false, memoryGb: 8, cores: 8 })).toBe('high')
    expect(startingLevel({})).toBe('high')
  })

  it('starts phones, tablets and modest computers at Medium', () => {
    expect(startingLevel({ coarsePointer: true, memoryGb: 8, cores: 8 })).toBe('medium')
    expect(startingLevel({ memoryGb: 4, cores: 8 })).toBe('medium')
    expect(startingLevel({ cores: 4 })).toBe('medium')
  })

  it('starts very weak devices at Low', () => {
    expect(startingLevel({ memoryGb: 2 })).toBe('low')
    expect(startingLevel({ coarsePointer: true, cores: 2 })).toBe('low')
  })
})

describe('autoStep', () => {
  it('waits for enough frames before judging', () => {
    expect(autoStep('high', frames(100, AUTO_SAMPLE_FRAMES - 1))).toBeNull()
  })

  it('stays when drawing is smooth', () => {
    expect(autoStep('high', frames(16))).toBeNull()
    expect(autoStep('high', frames(SLOW_FRAME_MS))).toBeNull()
  })

  it('steps down one level at a time when slow, and never below Low', () => {
    expect(autoStep('high', frames(50))).toBe('medium')
    expect(autoStep('medium', frames(50))).toBe('low')
    expect(autoStep('low', frames(50))).toBeNull()
  })

  it('ignores idle gaps (the view only draws when something changes)', () => {
    const idle = frames(IDLE_GAP_MS + 1000)
    expect(autoStep('high', [...idle, ...frames(16)])).toBeNull()
    expect(autoStep('high', idle)).toBeNull()
  })

  it('goes by the typical frame, not one slow hiccup', () => {
    expect(autoStep('high', [...frames(16, AUTO_SAMPLE_FRAMES - 5), 200, 200, 200, 200, 200])).toBeNull()
  })
})
