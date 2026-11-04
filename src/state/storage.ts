import { parseHouseDesign, type HouseDesign } from './design'
import { createId } from '../utils/id'
import { downloadJson } from '../utils/download'

/**
 * Saving uses the browser's `localStorage`: a small key → text store that
 * survives page reloads, but only on this browser and computer. To move a
 * design somewhere else, use Export / Import (a .json file) instead.
 */

const SAVES_KEY = 'room-designer:saves'
const AUTOSAVE_KEY = 'room-designer:autosave'
const FILE_FORMAT = 'room-designer'
const FILE_VERSION = 2 // 2 = whole house (Living Room + Bedroom); version 1 files still import

export interface SavedDesign {
  id: string
  name: string
  savedAt: string // ISO date
  /** Both rooms. Saves from before the Bedroom existed are upgraded when read. */
  design: HouseDesign
}

// localStorage can be unavailable (private mode, blocked storage), so every access is guarded.
function readJson(key: string): unknown {
  try {
    const text = localStorage.getItem(key)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function listSaves(): SavedDesign[] {
  const raw = readJson(SAVES_KEY)
  if (!Array.isArray(raw)) return []
  const saves: SavedDesign[] = []
  for (const entry of raw) {
    if (typeof entry?.id !== 'string' || typeof entry?.name !== 'string') continue
    const design = parseHouseDesign(entry.design)
    if (design) saves.push({ id: entry.id, name: entry.name, savedAt: String(entry.savedAt ?? ''), design })
  }
  return saves
}

/** Saves under `name`. Saving again with the same name overwrites that save. Returns the new list, or null on failure. */
export function saveDesign(name: string, design: HouseDesign): SavedDesign[] | null {
  const saves = listSaves()
  const existing = saves.find((s) => s.name.toLowerCase() === name.toLowerCase())
  const entry: SavedDesign = {
    id: existing?.id ?? createId(),
    name,
    savedAt: new Date().toISOString(),
    design,
  }
  const next = [entry, ...saves.filter((s) => s.id !== entry.id)]
  // Stored as { rooms: … } so it reads back the same way as exported files.
  const stored = next.map((save) => ({ ...save, design: { rooms: save.design } }))
  return writeJson(SAVES_KEY, stored) ? next : null
}

export function deleteSave(id: string): SavedDesign[] {
  const next = listSaves().filter((s) => s.id !== id)
  writeJson(SAVES_KEY, next.map((save) => ({ ...save, design: { rooms: save.design } })))
  return next
}

/**
 * The house from last time, so a page reload doesn't lose your work.
 * An autosave from before the Bedroom existed keeps its Living Room.
 */
export function loadAutosave(): HouseDesign | null {
  return parseHouseDesign(readJson(AUTOSAVE_KEY))
}

export function writeAutosave(house: HouseDesign) {
  writeJson(AUTOSAVE_KEY, { rooms: house })
}

/** Downloads both rooms as one .json file. */
export function exportDesign(house: HouseDesign, name: string) {
  const file = { format: FILE_FORMAT, version: FILE_VERSION, name, exportedAt: new Date().toISOString(), rooms: house }
  downloadJson(file, `${name.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'room-design'}.json`)
}

/** Reads a .json file chosen by the user. Throws a friendly message if it isn't a room design. */
export async function importDesign(file: File): Promise<HouseDesign> {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const design = parseHouseDesign(raw)
  if (!design) throw new Error('That file does not contain a room design.')
  return design
}
