import { parseDesign, type RoomDesign } from './design'
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
const FILE_VERSION = 1

export interface SavedDesign {
  id: string
  name: string
  savedAt: string // ISO date
  design: RoomDesign
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
    const design = parseDesign(entry.design)
    if (design) saves.push({ id: entry.id, name: entry.name, savedAt: String(entry.savedAt ?? ''), design })
  }
  return saves
}

/** Saves under `name`. Saving again with the same name overwrites that save. Returns the new list, or null on failure. */
export function saveDesign(name: string, design: RoomDesign): SavedDesign[] | null {
  const saves = listSaves()
  const existing = saves.find((s) => s.name.toLowerCase() === name.toLowerCase())
  const entry: SavedDesign = {
    id: existing?.id ?? createId(),
    name,
    savedAt: new Date().toISOString(),
    design,
  }
  const next = [entry, ...saves.filter((s) => s.id !== entry.id)]
  return writeJson(SAVES_KEY, next) ? next : null
}

export function deleteSave(id: string): SavedDesign[] {
  const next = listSaves().filter((s) => s.id !== id)
  writeJson(SAVES_KEY, next)
  return next
}

/** The design from last time, so a page reload doesn't lose your work. */
export function loadAutosave(): RoomDesign | null {
  return parseDesign(readJson(AUTOSAVE_KEY))
}

export function writeAutosave(design: RoomDesign) {
  writeJson(AUTOSAVE_KEY, design)
}

/** Downloads the design as a .json file. */
export function exportDesign(design: RoomDesign, name: string) {
  const file = { format: FILE_FORMAT, version: FILE_VERSION, name, exportedAt: new Date().toISOString(), ...design }
  downloadJson(file, `${name.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'room-design'}.json`)
}

/** Reads a .json file chosen by the user. Throws a friendly message if it isn't a room design. */
export async function importDesign(file: File): Promise<RoomDesign> {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const design = parseDesign(raw)
  if (!design) throw new Error('That file does not contain a room design.')
  return design
}
