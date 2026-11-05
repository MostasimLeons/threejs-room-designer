import type { RoomId } from '../scene/house'

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
