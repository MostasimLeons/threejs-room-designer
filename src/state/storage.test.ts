import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteSave, importDesign, listSaves, loadAutosave, saveDesign, writeAutosave } from './storage'
import { DEFAULT_HOUSE } from './design'

/** Minimal in-memory stand-in for the browser's localStorage. */
function createMemoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
})

describe('saves', () => {
  it('saves and lists designs, newest first', () => {
    saveDesign('First', DEFAULT_HOUSE)
    saveDesign('Second', DEFAULT_HOUSE)
    expect(listSaves().map((save) => save.name)).toEqual(['Second', 'First'])
    expect(listSaves()[0].design).toEqual(DEFAULT_HOUSE)
  })

  it('overwrites a save with the same name (ignoring case)', () => {
    const [first] = saveDesign('My room', DEFAULT_HOUSE)!
    const after = saveDesign('MY ROOM', DEFAULT_HOUSE)!
    expect(after).toHaveLength(1)
    expect(after[0].id).toBe(first.id)
  })

  it('deletes a save', () => {
    const [save] = saveDesign('Gone soon', DEFAULT_HOUSE)!
    expect(deleteSave(save.id)).toEqual([])
    expect(listSaves()).toEqual([])
  })

  it('returns null instead of crashing when storage is full or blocked', () => {
    vi.stubGlobal('localStorage', {
      ...createMemoryStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    })
    expect(saveDesign('x', DEFAULT_HOUSE)).toBeNull()
  })
})

describe('autosave', () => {
  it('round-trips the whole house', () => {
    expect(loadAutosave()).toBeNull()
    writeAutosave(DEFAULT_HOUSE)
    expect(loadAutosave()).toEqual(DEFAULT_HOUSE)
  })

  it('ignores corrupted data', () => {
    localStorage.setItem('room-designer:autosave', '{not json')
    expect(loadAutosave()).toBeNull()
  })
})

const file = (text: string) => new File([text], 'design.json', { type: 'application/json' })

describe('importDesign', () => {
  it('reads an exported file', async () => {
    const exported = { format: 'room-designer', version: 2, name: 'x', rooms: DEFAULT_HOUSE }
    await expect(importDesign(file(JSON.stringify(exported)))).resolves.toEqual(DEFAULT_HOUSE)
  })

  it('gives a friendly error for non-JSON', async () => {
    await expect(importDesign(file('hello'))).rejects.toThrow('not valid JSON')
  })

  it('gives a friendly error for JSON that is not a design', async () => {
    await expect(importDesign(file('{"a":1}'))).rejects.toThrow('does not contain a room design')
  })
})
