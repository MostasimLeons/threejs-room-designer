import { describe, expect, it } from 'vitest'
import { ROOM_IDS, ROOMS, resolveRoom } from './house'
import { WALL_SWATCHES } from './finishes'
import { DEFAULT_LAYOUTS, findOverlaps, FURNITURE_INFO, isAllowedIn, tuckedUnder, type FurnitureItem } from './furniture/catalog'
import { normalizeSize, sizeLimits } from './furniture/sizes'
import { productPrice } from './furniture/products'
import { catalogSections } from '../components/CatalogDrawer'
import { DEFAULT_HOUSE, parseHouseDesign } from '../state/design'
import { shoppingList } from '../state/shoppingList'
import { defaultLayout, normalizeLayout } from './layout'
import { openingProblems } from './walls'

/** Phase 16: the Office, the sixth room. */

const office = DEFAULT_LAYOUTS.office
const byId = (id: string) => office.find((item) => item.id === id)!

describe('the Office room', () => {
  it('is the sixth room, after the five existing ones (key 6 selects it)', () => {
    expect(ROOM_IDS).toEqual(['living', 'bedroom', 'dining', 'kitchen', 'bathroom', 'office'])
    expect(ROOMS.office).toMatchObject({ label: 'Office', width: 4.5, depth: 4, height: 2.8, wallThickness: 0.12 })
  })

  it('has a window over the desk and a door, valid at its standard and smallest sizes', () => {
    expect(ROOMS.office.openings.back?.[0]).toMatchObject({ kind: 'window', width: 1.8 })
    expect(ROOMS.office.openings.left?.[0]).toMatchObject({ kind: 'door' })
    expect(openingProblems(ROOMS.office)).toEqual([])
    const tiny = normalizeLayout({ ...defaultLayout('office'), width: 1.5, depth: 1.5 })
    expect(openingProblems(resolveRoom('office', tiny))).toEqual([])
  })

  it('starts furnished: desk, office chair, PC tower and drawer unit, with no overlaps', () => {
    const types = office.map((item) => item.type)
    for (const type of ['officeDesk', 'officeChair', 'pcTower', 'drawerUnit'] as const) expect(types).toContain(type)
    expect([...findOverlaps(office, ROOMS.office.fixedZones).keys()]).toEqual([])
  })

  it('the chair, PC and drawer unit are tucked under the desk, not just placed near it', () => {
    const desk = byId('office-desk')
    const tucked = ['office-chair', 'office-pc', 'office-drawers'].filter((id) => tuckedUnder(byId(id), desk))
    expect(tucked).toEqual(['office-chair', 'office-pc', 'office-drawers'])
  })

  it('starts with named colours and finishes (no custom colour codes in the lists)', () => {
    for (const item of office) {
      const names = FURNITURE_INFO[item.type].swatches.map((swatch) => swatch.color)
      expect(names).toContain(item.color)
    }
    expect(WALL_SWATCHES.map((swatch) => swatch.color)).toContain(ROOMS.office.defaultFinishes.wallColor)
  })

  it('lists the Office furniture in its catalog, under Office', () => {
    const sections = catalogSections('office')
    const officeSection = sections.find((section) => section.id === 'office')
    expect(officeSection?.types).toEqual(expect.arrayContaining(['officeDesk', 'officeChair', 'pcTower', 'drawerUnit']))
    // Kitchen and bathroom pieces stay out.
    expect(sections.flatMap((section) => section.types)).not.toContain('fridge')
    expect(sections.flatMap((section) => section.types)).not.toContain('bathtub')
  })
})

describe('office furniture', () => {
  it('office desks and chairs also fit the Bedroom and Living Room, not the Kitchen', () => {
    for (const type of ['officeDesk', 'officeChair'] as const) {
      expect(isAllowedIn(type, 'office')).toBe(true)
      expect(isAllowedIn(type, 'bedroom')).toBe(true)
      expect(isAllowedIn(type, 'kitchen')).toBe(false)
    }
  })

  it('a sit-stand desk can be raised to standing height; the PC and drawers still fit under it', () => {
    expect(sizeLimits('officeDesk', 'standing').height).toEqual([0.6, 1.25])
    const raised: FurnitureItem = {
      ...byId('office-desk'),
      variant: 'standing',
      size: normalizeSize('officeDesk', 'standing', [1.4, 0.7, 1.1]),
    }
    expect(raised.size).toEqual([1.4, 0.7, 1.1])
    expect(tuckedUnder({ ...byId('office-pc'), position: [-0.5, -1.65] }, raised)).toBe(true)
  })

  it('every office option has an example price', () => {
    for (const variant of ['straight', 'compact', 'standing']) expect(productPrice('officeDesk', variant)).toBeGreaterThan(0)
    for (const variant of ['ergonomic', 'task']) expect(productPrice('officeChair', variant)).toBeGreaterThan(0)
  })

  it('the shopping list has the Office, on its own and in the whole house', () => {
    const lines = shoppingList(DEFAULT_HOUSE, ['office'])
    expect(lines.map((line) => line.item)).toEqual(expect.arrayContaining(['Office desk', 'Office chair', 'PC tower', 'Drawer unit']))
    expect(lines.every((line) => line.room === 'Office')).toBe(true)
    expect(shoppingList(DEFAULT_HOUSE, ROOM_IDS).filter((line) => line.room === 'Office')).toEqual(lines)
  })
})

describe('saves from before the Office', () => {
  it('a five-room save gets the default Office; the other rooms load unchanged', () => {
    const { office: _office, ...fiveRooms } = DEFAULT_HOUSE
    const changedLiving = { ...fiveRooms.living, finishes: { ...fiveRooms.living.finishes, wallColor: '#112233' } }
    const house = parseHouseDesign({ rooms: { ...fiveRooms, living: changedLiving } })!
    expect(house.office).toEqual(DEFAULT_HOUSE.office)
    expect(house.living).toEqual(changedLiving)
    for (const id of ['bedroom', 'dining', 'kitchen', 'bathroom'] as const) expect(house[id]).toEqual(DEFAULT_HOUSE[id])
  })

  it('an Office design is saved and loads back', () => {
    const custom = { ...DEFAULT_HOUSE.office, items: DEFAULT_HOUSE.office.items.slice(0, 2) }
    const house = parseHouseDesign(JSON.parse(JSON.stringify({ rooms: { ...DEFAULT_HOUSE, office: custom } })))!
    expect(house.office).toEqual(custom)
  })
})
