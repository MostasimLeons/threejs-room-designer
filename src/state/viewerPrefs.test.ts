import { beforeEach, describe, expect, it, vi } from 'vitest'
import { introSeen, loadQualitySetting, loadThumbnails, markIntroSeen, saveQualitySetting, saveThumbnail } from './viewerPrefs'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

const JPEG = 'data:image/jpeg;base64,AAAA'

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

describe('viewer preferences', () => {
  it('remembers that the intro was seen', () => {
    expect(introSeen()).toBe(false)
    markIntroSeen()
    expect(introSeen()).toBe(true)
  })

  it('saves and loads room thumbnails', () => {
    saveThumbnail('kitchen', JPEG)
    saveThumbnail('bathroom', JPEG)
    expect(loadThumbnails()).toEqual({ kitchen: JPEG, bathroom: JPEG })
  })

  it('only accepts small JPEG data URLs', () => {
    localStorage.setItem(
      'room-designer:thumbnails',
      JSON.stringify({ living: 'https://example.com/x.jpg', bedroom: 42, dining: JPEG, kitchen: `${JPEG}${'A'.repeat(70_000)}` }),
    )
    expect(loadThumbnails()).toEqual({ dining: JPEG })
  })

  it('works (just forgets) when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(introSeen()).toBe(false)
    expect(() => markIntroSeen()).not.toThrow()
    expect(loadThumbnails()).toEqual({})
    expect(() => saveThumbnail('living', JPEG)).not.toThrow()
  })

  it('remembers the 3D quality setting, Auto by default', () => {
    expect(loadQualitySetting()).toBe('auto')
    saveQualitySetting('low')
    expect(loadQualitySetting()).toBe('low')
    saveQualitySetting('auto')
    expect(loadQualitySetting()).toBe('auto')
    localStorage.setItem('room-designer:quality', 'ultra')
    expect(loadQualitySetting()).toBe('auto')
  })
})
