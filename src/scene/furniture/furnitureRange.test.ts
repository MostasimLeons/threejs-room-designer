import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  clampToRoom,
  findOverlaps,
  FURNITURE_INFO,
  isAllowedIn,
  placeInRoom,
  type FurnitureItem,
  type FurnitureType,
} from './catalog'
import { placeNew } from './placement'
import { MODELS } from './models'
import { ROOM_IDS, ROOMS } from '../house'
import { DEFAULT_HOUSE, parseHouseDesign } from '../../state/design'
import { createHouseHistory, houseReducer } from '../../state/useDesignHistory'
import { catalogFor, catalogSections } from '../../components/CatalogDrawer'

/**
 * Phase 10: the bigger furniture range. Every piece must have a category, fit in
 * every room it's allowed in (next to the starting furniture), and survive saving
 * and undo like the original pieces.
 */

const TYPES = Object.keys(FURNITURE_INFO) as FurnitureType[]

const newItem = (type: FurnitureType, variant: string, id = `test-${type}-${variant}`): FurnitureItem => ({
  id,
  type,
  variant,
  position: [0, 0],
  rotation: 0,
  color: FURNITURE_INFO[type].swatches[0].color,
})

/** Problems found, as readable lines; the tests expect none, so a failure lists them all. */
type Problems = string[]

const countIn = (category: string) => TYPES.filter((t) => FURNITURE_INFO[t].category === category).length
const categoryOrder = (id: string) => CATEGORIES.findIndex((c) => c.id === id)

describe('furniture range', () => {
  it('every piece has a known category, rooms, options and colours', () => {
    const problems: Problems = []
    for (const type of TYPES) {
      const info = FURNITURE_INFO[type]
      if (categoryOrder(info.category) < 0) problems.push(`${type}: unknown category ${info.category}`)
      if (!info.rooms.length) problems.push(`${type}: no rooms`)
      if (!info.variants.length) problems.push(`${type}: no options`)
      if (!info.swatches.length) problems.push(`${type}: no colours`)
      if (new Set(info.variants.map((v) => v.id)).size !== info.variants.length) problems.push(`${type}: duplicate option ids`)
    }
    expect(problems).toEqual([])
  })

  it('offers more sofas, beds, chairs, tables and storage than before', () => {
    // Before Phase 10: 5 seating, 4 tables, 3 storage types; beds came in 2 sizes.
    expect(countIn('seating')).toBeGreaterThanOrEqual(9)
    expect(countIn('tables')).toBeGreaterThanOrEqual(6)
    expect(countIn('storage')).toBeGreaterThanOrEqual(5)
    expect(FURNITURE_INFO.bed.variants.length).toBeGreaterThanOrEqual(4)
  })

  it('each room has a varied catalog, grouped in category order', () => {
    for (const room of ROOM_IDS) {
      const sections = catalogSections(room)
      expect(catalogFor(room).length).toBeGreaterThanOrEqual(5)
      expect(sections.flatMap((s) => s.types)).toEqual(catalogFor(room))
      const order = sections.map((s) => categoryOrder(s.id))
      expect(order).toEqual(order.toSorted((a, b) => a - b))
    }
  })

  it.each(ROOM_IDS)('%s: every option it allows fits inside the room', (room) => {
    const { width, depth } = ROOMS[room]
    const problems: Problems = []
    for (const type of TYPES.filter((t) => isAllowedIn(t, room))) {
      for (const variant of FURNITURE_INFO[type].variants) {
        const [w, d] = variant.footprint
        const fits = Math.min(w, d) <= Math.min(width, depth) && Math.max(w, d) <= Math.max(width, depth)
        if (!fits) problems.push(`${type}/${variant.id} is too big for the ${room}`)
      }
    }
    expect(problems).toEqual([])
  })

  it.each(ROOM_IDS)('%s: each piece not already there can be added next to the starting furniture without overlapping', (room) => {
    const info = ROOMS[room]
    const existing = DEFAULT_HOUSE[room].items
    const problems: Problems = []
    // A second bed, island or dining table doesn't fit next to the first: those rooms are full.
    const already = new Set(existing.map((i) => i.type))
    for (const type of TYPES.filter((t) => isAllowedIn(t, room) && !already.has(t))) {
      // As the catalog adds it: the default option, or the first one that has room.
      const item = newItem(type, FURNITURE_INFO[type].variants[0].id)
      const ids = FURNITURE_INFO[type].variants.map((v) => v.id)
      const placed = { ...item, ...placeNew(item, ids, existing, info, info.fixedZones) }
      const { position } = placed
      const inside = clampToRoom(placed, info).every((v, i) => Math.abs(v - position[i]) < 1e-9)
      if (!inside) problems.push(`${type}: placed outside the walls`)
      if (findOverlaps([...existing, placed], info.fixedZones).has(placed.id)) problems.push(`${type}: no free spot`)
    }
    expect(problems).toEqual([])
  })

  it('real models are only used for options that exist', () => {
    const problems: Problems = []
    for (const [type, variants] of Object.entries(MODELS)) {
      const ids = FURNITURE_INFO[type as FurnitureType].variants.map((v) => v.id)
      for (const variant of Object.keys(variants ?? {})) if (!ids.includes(variant)) problems.push(`${type}/${variant}`)
    }
    expect(problems).toEqual([])
  })
})

describe('new pieces keep saving and undo working', () => {
  it('a house with every new piece survives saving and loading unchanged', () => {
    const house = structuredClone(DEFAULT_HOUSE)
    for (const room of ROOM_IDS) {
      const extra = TYPES.filter((t) => isAllowedIn(t, room)).flatMap((type) =>
        FURNITURE_INFO[type].variants.map((v, i) => {
          const item = { ...newItem(type, v.id, `new-${room}-${type}-${v.id}`), position: [0, i * 0.01] as [number, number] }
          // Where the app would have put it (pieces on a wall hang on the nearest wall), with every frame finish set.
          const frame = FURNITURE_INFO[type].frame?.options.at(-1)
          return { ...item, ...placeInRoom(item, ROOMS[room]), ...(frame ? { frame } : {}) }
        }),
      )
      house[room] = { ...house[room], items: [...house[room].items, ...extra] }
    }
    const loaded = parseHouseDesign(JSON.parse(JSON.stringify({ rooms: house })))
    expect(loaded).toEqual(house)
  })

  it('pieces from the wrong room are still dropped (a desk never ends up in the bathroom)', () => {
    const house = structuredClone(DEFAULT_HOUSE)
    house.bathroom.items.push(newItem('desk', '120'), newItem('cornerSofa', 'left'))
    const loaded = parseHouseDesign(JSON.parse(JSON.stringify({ rooms: house })))!
    expect(loaded.bathroom.items.some((i) => i.type === 'desk' || i.type === 'cornerSofa')).toBe(false)
  })

  it('adding, recolouring and changing the option of a new piece can each be undone', () => {
    const bounds = ROOMS.bedroom
    let state = createHouseHistory(DEFAULT_HOUSE)
    const desk = { ...newItem('desk', '120', 'my-desk'), position: [0.5, 0.5] as [number, number] }
    const step = (action: Parameters<typeof houseReducer>[1]['action']) => (state = houseReducer(state, { room: 'bedroom', action }))
    step({ type: 'addItem', item: desk, bounds })
    step({ type: 'updateItem', id: 'my-desk', changes: { variant: '100' }, transient: false, bounds })
    step({ type: 'updateItem', id: 'my-desk', changes: { color: '#2a2a2c' }, transient: false, bounds })
    const find = () => state.bedroom.present.items.find((i) => i.id === 'my-desk')
    expect(find()).toMatchObject({ variant: '100', color: '#2a2a2c' })
    step({ type: 'undo' })
    expect(find()?.color).toBe(desk.color)
    step({ type: 'undo' })
    expect(find()?.variant).toBe('120')
    step({ type: 'undo' })
    expect(find()).toBeUndefined()
    step({ type: 'redo' })
    expect(find()).toBeDefined()
  })
})
