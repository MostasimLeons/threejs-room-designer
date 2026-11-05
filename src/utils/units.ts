import { createContext, useContext } from 'react'

/**
 * Lengths in the units people measure with (Phase 14). Everything is stored in
 * metres (1 unit in the 3D view = 1 m); units only change how lengths are shown
 * and typed, so switching units never changes a design.
 */
export type LengthUnit = 'm' | 'cm' | 'ft'

export const LENGTH_UNITS: { id: LengthUnit; label: string }[] = [
  { id: 'm', label: 'Metres' },
  { id: 'cm', label: 'Centimetres' },
  { id: 'ft', label: 'Feet & inches' },
]

export const INCH = 0.0254
export const FOOT = 0.3048

/** "3.50 m", "350 cm" or "11′ 6″" (feet and inches, to the nearest half inch). */
export function formatLength(metres: number, unit: LengthUnit): string {
  if (unit === 'cm') return `${Math.round(metres * 100)} cm`
  if (unit === 'm') return `${metres.toFixed(2)} m`
  const sign = metres < 0 ? '-' : ''
  const halfInches = Math.round(Math.abs(metres) / INCH / 0.5)
  const totalInches = halfInches / 2
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches - feet * 12
  const inchText = Number.isInteger(inches) ? String(inches) : inches.toFixed(1)
  if (feet === 0) return `${sign}${inchText}″`
  return `${sign}${feet}′ ${inchText}″`
}

/** Area: "42.0 m²" or "452 ft²". */
export function formatArea(squareMetres: number, unit: LengthUnit): string {
  return unit === 'ft' ? `${Math.round(squareMetres / (FOOT * FOOT))} ft²` : `${(Math.round(squareMetres * 10) / 10).toFixed(1)} m²`
}

/**
 * Reads a typed length and returns metres, or null if it isn't one. Accepts any
 * unit whatever the setting: "3.5", "3.5 m", "350cm", "1,5 m", "12'6", "12′ 6″",
 * "12 ft 6 in", "6in", "12 feet". A bare number is in `unit`.
 */
export function parseLength(text: string, unit: LengthUnit): number | null {
  const t = text.trim().toLowerCase().replace(/,/g, '.').replace(/[′’`]/g, "'").replace(/[″”]/g, '"').replace(/''/g, '"')
  if (!t) return null
  const num = '(\\d+(?:\\.\\d+)?|\\.\\d+)'
  const feetInches = t.match(new RegExp(`^${num}\\s*(?:'|ft|feet|foot)\\s*(?:${num}\\s*(?:"|in|inch|inches)?)?$`))
  if (feetInches) return Number(feetInches[1]) * FOOT + (feetInches[2] ? Number(feetInches[2]) * INCH : 0)
  const single = t.match(new RegExp(`^${num}\\s*(m|metres?|meters?|cm|centimetres?|centimeters?|mm|"|in|inch|inches)?$`))
  if (!single) return null
  const value = Number(single[1])
  const suffix = single[2]
  if (!suffix) return unit === 'cm' ? value / 100 : unit === 'ft' ? value * FOOT : value
  if (suffix.startsWith('mm')) return value / 1000
  if (suffix.startsWith('c')) return value / 100
  if (suffix.startsWith('m')) return value
  return value * INCH // " or in
}

/** The unit chosen in this browser, for everything that shows a length. */
export const UnitContext = createContext<LengthUnit>('m')
export const useUnit = () => useContext(UnitContext)
