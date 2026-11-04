import { describe, expect, it } from 'vitest'
import {
  compassName,
  DAY_END,
  DAY_START,
  daylightAt,
  formatTime,
  mixColor,
  normalizeLighting,
  sunDirection,
  sunPosition,
  TIME_PRESETS,
} from './sun'

/** Red and blue channels of a #rrggbb colour. */
const red = (hex: string) => parseInt(hex.slice(1, 3), 16)
const blue = (hex: string) => parseInt(hex.slice(5, 7), 16)

describe('sunPosition', () => {
  it('is highest at noon, in the south', () => {
    const noon = sunPosition(12)
    expect(noon.azimuth).toBe(180)
    expect(noon.elevation).toBeCloseTo(65, 0) // 90 - 45 + 20
    expect(sunPosition(9).elevation).toBeLessThan(noon.elevation)
    expect(sunPosition(15).elevation).toBeLessThan(noon.elevation)
  })

  it('rises in the east-ish morning sky and sets in the west', () => {
    expect(sunPosition(7).azimuth).toBeGreaterThan(45)
    expect(sunPosition(7).azimuth).toBeLessThan(135)
    expect(sunPosition(17).azimuth).toBeGreaterThan(225)
    expect(sunPosition(17).azimuth).toBeLessThan(315)
  })

  it('is up between roughly 4:35 and 19:25, and down outside that', () => {
    expect(sunPosition(4.5).elevation).toBeLessThan(0)
    expect(sunPosition(4.7).elevation).toBeGreaterThan(0)
    expect(sunPosition(19.3).elevation).toBeGreaterThan(0)
    expect(sunPosition(19.6).elevation).toBeLessThan(0)
  })

  it('is symmetric around noon', () => {
    expect(sunPosition(9).elevation).toBeCloseTo(sunPosition(15).elevation)
    expect(sunPosition(9).azimuth + sunPosition(15).azimuth).toBeCloseTo(360, 0)
  })
})

describe('sunDirection', () => {
  it('points straight out of the windows (-z) when the sun is where the windows face', () => {
    const [x, y, z] = sunDirection({ elevation: 0, azimuth: 180 }, 180)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
    expect(z).toBeCloseTo(-1)
  })

  it('a sun 90° clockwise of the windows is to the right (+x)', () => {
    const [x, , z] = sunDirection({ elevation: 0, azimuth: 270 }, 180)
    expect(x).toBeCloseTo(1)
    expect(z).toBeCloseTo(0)
  })

  it('turning the room turns the sun around it', () => {
    // Windows facing north at noon: the sun is behind the room (+z).
    const [, , z] = sunDirection(sunPosition(12), 0)
    expect(z).toBeGreaterThan(0)
  })

  it('is a unit vector', () => {
    const [x, y, z] = sunDirection(sunPosition(10), 120)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1)
  })
})

describe('daylightAt', () => {
  it('full daylight at noon: room lights off, bright sun', () => {
    const noon = daylightAt({ time: 12, orientation: 180 })
    expect(noon.daylight).toBeCloseTo(1)
    expect(noon.interior).toBe(0)
    expect(noon.sunIntensity).toBeGreaterThan(2)
  })

  it('night at 9 PM: no sun, room lights fully on, dark backdrop', () => {
    const night = daylightAt({ time: 21, orientation: 180 })
    expect(night.sunIntensity).toBe(0)
    expect(night.interior).toBe(1)
    expect(night.daylight).toBeLessThan(0.05)
    expect(night.background).not.toBe('#ebe7e0')
  })

  it('golden hour is warmer than midday', () => {
    const golden = daylightAt({ time: 18.5, orientation: 180 }).sunColor
    const midday = daylightAt({ time: 12, orientation: 180 }).sunColor
    expect(red(golden) - blue(golden)).toBeGreaterThan(red(midday) - blue(midday))
  })

  it('every preset is inside the slider range, in order', () => {
    const times = TIME_PRESETS.map((preset) => preset.time)
    expect(times).toEqual(times.toSorted((a, b) => a - b))
    for (const time of times) {
      expect(time).toBeGreaterThanOrEqual(DAY_START)
      expect(time).toBeLessThanOrEqual(DAY_END)
    }
  })
})

describe('helpers', () => {
  it('formatTime uses a 12-hour clock', () => {
    expect(formatTime(5)).toBe('5:00 AM')
    expect(formatTime(12)).toBe('12:00 PM')
    expect(formatTime(14.5)).toBe('2:30 PM')
    expect(formatTime(21)).toBe('9:00 PM')
    expect(formatTime(6 + 25 / 60)).toBe('6:25 AM')
  })

  it('compassName rounds to the nearest of 8 directions', () => {
    expect(compassName(0)).toBe('N')
    expect(compassName(100)).toBe('E')
    expect(compassName(180)).toBe('S')
    expect(compassName(350)).toBe('N')
    expect(compassName(225)).toBe('SW')
  })

  it('mixColor blends between two colours', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mixColor('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('normalizeLighting keeps time in range and wraps orientation', () => {
    expect(normalizeLighting({ time: 2, orientation: -90 })).toEqual({ time: DAY_START, orientation: 270 })
    expect(normalizeLighting({ time: 30, orientation: 400 })).toEqual({ time: DAY_END, orientation: 40 })
  })
})
