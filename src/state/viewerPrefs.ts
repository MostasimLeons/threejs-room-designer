import type { RoomId } from '../scene/house'
import type { LengthUnit } from '../utils/units'
import type { QualitySetting } from '../scene/quality'

/**
 * Small per-browser conveniences that aren't part of a design (so they aren't
 * saved, exported or undone): whether you've seen the intro, and the room-bar
 * thumbnails. Storage can be blocked (private mode), so every access is guarded
 * and the app works the same without it.
 */

const INTRO_KEY = 'room-designer:intro-seen'
const THUMBNAILS_KEY = 'room-designer:thumbnails'

export function introSeen(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Not remembered: the intro shows again next time. Harmless.
  }
}

export type Thumbnails = Partial<Record<RoomId, string>>

export function loadThumbnails(): Thumbnails {
  try {
    const raw = JSON.parse(localStorage.getItem(THUMBNAILS_KEY) ?? '{}')
    const result: Thumbnails = {}
    for (const [room, url] of Object.entries(raw ?? {})) {
      // Only our own small JPEG data URLs are accepted.
      if (typeof url === 'string' && url.startsWith('data:image/jpeg;base64,') && url.length < 60_000) result[room as RoomId] = url
    }
    return result
  } catch {
    return {}
  }
}

export function saveThumbnail(room: RoomId, url: string) {
  try {
    localStorage.setItem(THUMBNAILS_KEY, JSON.stringify({ ...loadThumbnails(), [room]: url }))
  } catch {
    // Storage full or blocked: the picture just isn't kept for next time.
  }
}

const QUALITY_KEY = 'room-designer:quality'
const QUALITY_SETTINGS: QualitySetting[] = ['auto', 'high', 'medium', 'low']

/** The 3D quality setting chosen in this browser (Auto unless changed). */
export function loadQualitySetting(): QualitySetting {
  try {
    const value = localStorage.getItem(QUALITY_KEY)
    return QUALITY_SETTINGS.includes(value as QualitySetting) ? (value as QualitySetting) : 'auto'
  } catch {
    return 'auto'
  }
}

export function saveQualitySetting(setting: QualitySetting) {
  try {
    if (setting === 'auto') localStorage.removeItem(QUALITY_KEY)
    else localStorage.setItem(QUALITY_KEY, setting)
  } catch {
    // Not remembered: Auto next time. Harmless.
  }
}

const VOLUME_KEY = 'room-designer:sound-volume'

/** The ambient sound volume chosen in this browser (0–1, half by default). */
export function loadSoundVolume(): number {
  try {
    const value = Number(localStorage.getItem(VOLUME_KEY))
    return localStorage.getItem(VOLUME_KEY) !== null && value >= 0 && value <= 1 ? value : 0.5
  } catch {
    return 0.5
  }
}

export function saveSoundVolume(volume: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume))
  } catch {
    // Not remembered: half volume next time. Harmless.
  }
}

const UNIT_KEY = 'room-designer:unit'
const DIMENSIONS_KEY = 'room-designer:show-dimensions'

/** The unit lengths are shown and typed in, chosen in this browser (metres by default). */
export function loadUnit(): LengthUnit {
  try {
    const value = localStorage.getItem(UNIT_KEY)
    return value === 'cm' || value === 'ft' ? value : 'm'
  } catch {
    return 'm'
  }
}

export function saveUnit(unit: LengthUnit) {
  try {
    localStorage.setItem(UNIT_KEY, unit)
  } catch {
    // Not remembered: metres next time. Harmless.
  }
}

/** Whether the room's measurements are shown in the 3D view and plan (on by default). */
export function loadShowDimensions(): boolean {
  try {
    return localStorage.getItem(DIMENSIONS_KEY) !== '0'
  } catch {
    return true
  }
}

export function saveShowDimensions(show: boolean) {
  try {
    localStorage.setItem(DIMENSIONS_KEY, show ? '1' : '0')
  } catch {
    // Not remembered. Harmless.
  }
}
