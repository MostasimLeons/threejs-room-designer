/** Limits `value` to the range min…max. */
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Rounds an angle to whole degrees and wraps it into 0–359 (e.g. -45 → 315, 405 → 45). */
export const normalizeDegrees = (degrees: number) => ((Math.round(degrees) % 360) + 360) % 360

export const degToRad = (degrees: number) => (degrees * Math.PI) / 180
