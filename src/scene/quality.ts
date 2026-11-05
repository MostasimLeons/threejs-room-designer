import { createContext, useContext } from 'react'

/**
 * Quality levels: how much drawing work the 3D view does. Slower devices (phones,
 * older laptops) get a lighter version of the same room, so it stays smooth.
 *
 * - High: everything on (the look of Phases 1–8).
 * - Medium: half-size shadow maps, cheaper soft corner shadows (ambient occlusion),
 *   lower-resolution floor reflections, screen sharpness capped at 1.5×.
 * - Low: no ambient occlusion, no floor reflections and no glow; only the sun casts
 *   shadows; normal screen sharpness (1×).
 *
 * "Auto" picks a starting level from the device and steps down if drawing is slow
 * (see `autoStep`). The choice is kept in this browser (state/viewerPrefs.ts).
 */
export type QualityLevel = 'high' | 'medium' | 'low'
export type QualitySetting = 'auto' | QualityLevel

export const QUALITY_LEVELS: QualityLevel[] = ['high', 'medium', 'low']

export interface QualitySettings {
  level: QualityLevel
  /** Highest device pixel ratio used (2 = sharp on high-DPI screens, but 4× the pixels). */
  maxDpr: number
  /** Width and height of each shadow map, in pixels. */
  shadowMapSize: number
  /** Whether the soft overhead "ceiling" light also casts shadows (the sun always does). */
  fillShadows: boolean
  /** Ambient occlusion quality, or off. */
  ambientOcclusion: 'medium' | 'performance' | null
  /** Polished floors mirror the room; resolution of the reflection, or 0 for none. */
  reflectionResolution: number
  /** Soft glow around lights. */
  bloom: boolean
}

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  high: {
    level: 'high',
    maxDpr: 2,
    shadowMapSize: 2048,
    fillShadows: true,
    ambientOcclusion: 'medium',
    reflectionResolution: 256,
    bloom: true,
  },
  medium: {
    level: 'medium',
    maxDpr: 1.5,
    shadowMapSize: 1024,
    fillShadows: true,
    ambientOcclusion: 'performance',
    reflectionResolution: 128,
    bloom: true,
  },
  low: {
    level: 'low',
    maxDpr: 1,
    shadowMapSize: 1024,
    fillShadows: false,
    ambientOcclusion: null,
    reflectionResolution: 0,
    bloom: false,
  },
}

export const QualityContext = createContext<QualitySettings>(QUALITY.high)

/** The quality settings for the 3D view (inside the canvas). */
export const useQuality = () => useContext(QualityContext)

export const QUALITY_LABELS: Record<QualitySetting, string> = {
  auto: 'Auto',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** What we know about the device, for the starting guess. Anything unknown is left out. */
export interface DeviceHints {
  /** A touch screen is the main input (phones, tablets). */
  coarsePointer?: boolean
  /** Shortest side of the screen in CSS pixels. */
  screenShortSide?: number
  /** Approximate memory in GB (Chrome only). */
  memoryGb?: number
  /** Number of CPU cores. */
  cores?: number
}

/**
 * Where Auto starts. Phones and tablets, and computers with little memory or few
 * cores, start at Medium; very small or weak devices at Low; everything else at High.
 * Auto then steps down further if drawing is still slow.
 */
export function startingLevel(device: DeviceHints): QualityLevel {
  const weak = (device.memoryGb !== undefined && device.memoryGb <= 2) || (device.cores !== undefined && device.cores <= 2)
  if (weak) return 'low'
  const modest = (device.memoryGb !== undefined && device.memoryGb <= 4) || (device.cores !== undefined && device.cores <= 4)
  if (device.coarsePointer || modest) return 'medium'
  return 'high'
}

/** Reads the device hints from the browser. */
export function browserDeviceHints(): DeviceHints {
  if (typeof window === 'undefined') return {}
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches,
    screenShortSide: Math.min(window.screen?.width ?? Infinity, window.screen?.height ?? Infinity),
    memoryGb: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
  }
}

/** Frames needed before Auto judges the speed. */
export const AUTO_SAMPLE_FRAMES = 45
/** Slower than this (about 28 frames per second) counts as struggling. */
export const SLOW_FRAME_MS = 36
/**
 * Gaps between frames longer than this aren't drawing time: the view only redraws
 * when something changes, so a gap usually means nothing happened.
 */
export const IDLE_GAP_MS = 250

/**
 * Auto quality's decision from recent frame-to-frame times (only while something was
 * moving, so idle gaps are left out). Returns the lower level to switch to, or null
 * to stay. It only ever steps down: stepping back up and down again would make the
 * picture keep changing while you use it.
 */
export function autoStep(level: QualityLevel, frameTimes: number[]): QualityLevel | null {
  const times = frameTimes.filter((t) => t > 0 && t < IDLE_GAP_MS)
  if (times.length < AUTO_SAMPLE_FRAMES) return null
  const sorted = times.toSorted((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  if (median <= SLOW_FRAME_MS) return null
  const index = QUALITY_LEVELS.indexOf(level)
  return QUALITY_LEVELS[index + 1] ?? null
}
