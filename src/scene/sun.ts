import { clamp, degToRad, normalizeDegrees } from '../utils/math'

/**
 * Time of day: where the sun is and what the light looks like.
 *
 * The sun model is the standard textbook one for a mid-latitude summer day
 * (latitude 45° N, sun declination +20°): sunrise about 4:35, highest at 12:00,
 * sunset about 19:25. It's deliberately simple. It isn't tied to a real date or
 * place; it just moves the sun believably from east to west.
 *
 * Room frame (see house.ts): every room's main windows are in its back wall, which
 * faces -z. A room's `orientation` is the compass direction those windows face
 * (180 = south, the sunniest). Turning the room turns the sun around it.
 */

/** The time slider's range, in hours. */
export const DAY_START = 5
export const DAY_END = 21

const LATITUDE = degToRad(45)
const DECLINATION = degToRad(20)

export interface RoomLighting {
  /** Hours since midnight, e.g. 14.5 = 2:30 PM. */
  time: number
  /** Compass direction the room's windows face, in degrees (0 = N, 90 = E, 180 = S, 270 = W). */
  orientation: number
}

export const DEFAULT_LIGHTING: RoomLighting = { time: 14.5, orientation: 180 }

/** Quick picks for the time slider. */
export const TIME_PRESETS: { label: string; time: number }[] = [
  { label: 'Sunrise', time: 5.5 },
  { label: 'Morning', time: 9 },
  { label: 'Midday', time: 12.5 },
  { label: 'Golden hour', time: 18.5 },
  { label: 'Dusk', time: 19.75 },
  { label: 'Night', time: 21 },
]

/** Keeps saved or typed values sensible: time inside the slider range, orientation 0–359. */
export function normalizeLighting(lighting: RoomLighting): RoomLighting {
  return { time: clamp(lighting.time, DAY_START, DAY_END), orientation: normalizeDegrees(lighting.orientation) }
}

export interface SunPosition {
  /** Height above the horizon in degrees (negative = below it). */
  elevation: number
  /** Compass direction of the sun in degrees (0 = N, 90 = E, 180 = S, 270 = W). */
  azimuth: number
}

/** Where the sun is in the sky at this time. */
export function sunPosition(time: number): SunPosition {
  const hourAngle = degToRad((time - 12) * 15) // 15° per hour, 0 at noon
  const sinElevation = Math.sin(LATITUDE) * Math.sin(DECLINATION) + Math.cos(LATITUDE) * Math.cos(DECLINATION) * Math.cos(hourAngle)
  const elevation = Math.asin(clamp(sinElevation, -1, 1))
  // Azimuth measured from south towards west, then turned into a compass bearing.
  const fromSouth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(LATITUDE) - Math.tan(DECLINATION) * Math.cos(LATITUDE))
  return { elevation: (elevation * 180) / Math.PI, azimuth: normalizeDegrees((fromSouth * 180) / Math.PI + 180) }
}

/**
 * Unit vector pointing from the room towards the sun, in room coordinates.
 * A sun straight out of the windows (azimuth = orientation) points to -z.
 */
export function sunDirection({ elevation, azimuth }: SunPosition, orientation: number): [number, number, number] {
  const turn = degToRad(azimuth - orientation) // 0 = straight out of the windows, +90 = to the right
  const h = degToRad(elevation)
  return [Math.cos(h) * Math.sin(turn), Math.sin(h), -Math.cos(h) * Math.cos(turn)]
}

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Blends two colours: t = 0 gives `a`, t = 1 gives `b`. */
export function mixColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const mixed = ca.map((v, i) => Math.round(v + (cb[i] - v) * clamp(t, 0, 1)))
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Everything the scene needs to light one moment of the day. */
export interface DaylightState {
  sun: SunPosition
  /** Unit vector towards the sun, in room coordinates. */
  sunDirection: [number, number, number]
  sunIntensity: number
  sunColor: string
  /** 0 at night, 1 in full daylight (smooth through twilight). */
  daylight: number
  /** 0 in daylight, 1 when the room's own lights are fully on. */
  interior: number
  fillIntensity: number
  fillColor: string
  hemisphere: { sky: string; ground: string; intensity: number }
  environment: number
  /** What you see through the windows, and how bright (above 1 = glowing daylight). */
  sky: { color: string; brightness: number }
  /** The 3D view's backdrop: warm studio grey by day, dark slate at night. */
  background: string
}

export function daylightAt({ time, orientation }: RoomLighting): DaylightState {
  const sun = sunPosition(time)
  const h = sun.elevation
  const daylight = smoothstep(-6, 8, h) // civil twilight to a clearly risen sun
  const warmth = 1 - smoothstep(4, 32, h) // low sun is orange, high sun is white
  const interior = 1 - smoothstep(0, 14, h) // lamps come on as the sun gets low

  // The sky through the window: night → orange twilight → pale blue day.
  const twilight = smoothstep(-8, 2, h)
  const day = smoothstep(2, 22, h)
  const skyColor = day > 0 ? mixColor('#f4b38c', '#e4f0f7', day) : mixColor('#141a2b', '#f4b38c', twilight)

  return {
    sun,
    sunDirection: sunDirection(sun, orientation),
    sunIntensity: 3.4 * smoothstep(-1, 6, h) * (0.6 + 0.4 * (1 - warmth)),
    sunColor: mixColor('#fff4e6', '#ff9a55', warmth),
    daylight,
    interior,
    // Lower than the sun, so sunlight through a window reads as a clear bright patch.
    fillIntensity: 0.12 + 0.68 * daylight,
    fillColor: mixColor('#94a6d1', '#fffaf2', daylight),
    hemisphere: {
      sky: mixColor('#55648a', '#fff7ea', daylight),
      ground: mixColor('#2f2a27', '#b89f80', daylight),
      intensity: 0.1 + 0.4 * daylight,
    },
    environment: 0.1 + 0.4 * daylight,
    sky: { color: skyColor, brightness: 0.45 + 1.15 * daylight },
    background: mixColor('#2b2d35', '#ebe7e0', 0.15 + 0.85 * daylight),
  }
}

/** "2:30 PM" style clock text. */
export function formatTime(time: number): string {
  const minutes = Math.round(time * 60)
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** "S", "NE", … for an orientation in degrees. */
export function compassName(degrees: number): string {
  return COMPASS[Math.round(normalizeDegrees(degrees) / 45) % 8]
}
