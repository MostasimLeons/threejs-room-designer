import { getVariant, itemFootprint, type FurnitureItem, type FurnitureType } from './catalog'
import { formatLength, type LengthUnit } from '../../utils/units'

/**
 * Product details for the product card and the shopping list: a short
 * description, what it's made of, its height, and an EXAMPLE price per option.
 *
 * The prices are made-up example figures (in US dollars) so the shopping list
 * and quote can be tried out. They don't come from any real shop or brand. To
 * use a real catalog, replace the numbers here (one per option).
 */
export interface ProductInfo {
  description: string
  materials: string
  /** Height in cm: one number for every option, or one per option id. */
  height: number | Record<string, number>
  /** Example price per option id, in dollars. */
  price: Record<string, number>
}

export const CURRENCY = 'USD'

export const PRODUCTS: Record<FurnitureType, ProductInfo> = {
  sofa: {
    description: 'Deep-seated sofa with soft feather-wrapped cushions and two scatter cushions.',
    materials: 'Woven fabric, solid wood legs',
    height: 85,
    price: { '3-seat': 1290, '2-seat': 990, '4-seat': 1590 },
  },
  armchair: {
    description: 'Comfortable reading chair with a padded seat and back.',
    materials: 'Fabric, solid wood frame',
    height: { lounge: 80, armless: 78 },
    price: { lounge: 690, armless: 450 },
  },
  coffeeTable: {
    description: 'Low table with room for books and a vase.',
    materials: 'Solid wood; the square one has a carved top on a black base',
    height: { rectangle: 43, round: 43, square: 37 },
    price: { rectangle: 390, round: 340, square: 620 },
  },
  tvUnit: {
    description: 'Low media unit with cable management, shown with a TV.',
    materials: 'Wood veneer, metal legs',
    height: { '55': 120, '65': 130 },
    price: { '55': 520, '65': 590 },
  },
  plant: {
    description: 'Real-looking indoor plant in a ceramic pot.',
    materials: 'Faux foliage, glazed ceramic pot',
    height: { large: 130, small: 85 },
    price: { large: 160, small: 85 },
  },
  floorLamp: {
    description: 'Floor lamp with a linen shade; lights the room at night.',
    materials: 'Metal stand, linen shade',
    height: 150,
    price: { tapered: 210, drum: 230 },
  },
  bed: {
    description: 'Upholstered bed with a channel-tufted headboard and a floating plinth.',
    materials: 'Fabric upholstery, wooden plinth (mattress and bedding not included)',
    height: 125,
    price: { king: 1890, queen: 1690, double: 1490, single: 990 },
  },
  bedsideTable: {
    description: 'Bedside table with drawers and a small table lamp.',
    materials: 'Oak, lacquered drawer fronts, metal legs',
    height: 56,
    price: { drawers: 290, shelf: 260 },
  },
  wardrobe: {
    description: 'Wardrobe with sliding doors, hanging rail and shelves inside.',
    materials: 'Wood veneer, lacquered doors',
    height: 220,
    price: { '2-door': 1150, '3-door': 1490 },
  },
  dressingTable: {
    description: 'Dressing table with a mirror and a slim drawer.',
    materials: 'Oak, mirror glass',
    height: 150,
    price: { round: 540, tall: 580 },
  },
  accentChair: {
    description: 'Statement chair for a corner or the end of the bed.',
    materials: 'Fabric or leather, wooden legs',
    height: { tub: 75, wingback: 105, lounge: 80 },
    price: { tub: 480, wingback: 690, lounge: 790 },
  },
  diningTable: {
    description: 'Dining table for everyday meals and dinner parties.',
    materials: 'Solid wood',
    height: 75,
    price: { rectangle: 990, round: 790, long: 1390 },
  },
  diningChair: {
    description: 'Dining chair with a comfortable seat.',
    materials: 'Fabric or leather seat, wooden frame',
    height: { upholstered: 92, spindle: 90, leather: 97 },
    price: { upholstered: 189, spindle: 149, leather: 259 },
  },
  sideboard: {
    description: 'Sideboard with doors and drawers for tableware.',
    materials: 'Wood veneer, metal legs',
    height: 75,
    price: { '160': 890, '200': 1090 },
  },
  kitchenIsland: {
    description: 'Kitchen island with a stone worktop and storage on both sides.',
    materials: 'Lacquered cabinets, quartz worktop',
    height: 92,
    price: { large: 2890, compact: 1990 },
  },
  barStool: {
    description: 'Counter-height stool with a padded seat and a footrest.',
    materials: 'Metal frame, fabric seat',
    height: { backless: 66, 'low-back': 80 },
    price: { backless: 129, 'low-back': 159 },
  },
  fridge: {
    description: 'Freestanding fridge-freezer.',
    materials: 'Steel, enamel finish',
    height: 190,
    price: { single: 899, double: 1790 },
  },
  bathtub: {
    description: 'Freestanding bath or a walk-in shower with a glass screen.',
    materials: 'Acrylic or glass and chrome',
    height: { freestanding: 60, shower: 200 },
    price: { freestanding: 1490, shower: 1190 },
  },
  vanity: {
    description: 'Wall-hung vanity unit with basin(s) and a mirror.',
    materials: 'Lacquered cabinet, ceramic basin',
    height: 190,
    price: { single: 790, double: 1290 },
  },
  towelRail: {
    description: 'Towel rail for the bathroom wall.',
    materials: 'Chrome-plated steel',
    height: { ladder: 160, bar: 6 },
    price: { ladder: 149, bar: 59 },
  },
  cornerSofa: {
    description: 'L-shaped corner sofa with a chaise longue for stretching out.',
    materials: 'Woven fabric, solid wood legs',
    height: 85,
    price: { left: 2190, right: 2190 },
  },
  ottoman: {
    description: 'Extra seat or footrest.',
    materials: 'Knitted fabric pouf, or leather on wooden legs',
    height: { pouf: 42, leather: 40 },
    price: { pouf: 119, leather: 349 },
  },
  sideTable: {
    description: 'Small table next to a sofa or bed.',
    materials: 'Wood top, metal base; or solid wood',
    height: { round: 55, wood: 55 },
    price: { round: 149, wood: 189 },
  },
  desk: {
    description: 'Writing desk with a shallow drawer.',
    materials: 'Oak top, metal legs',
    height: 75,
    price: { '120': 450, '100': 360 },
  },
  deskChair: {
    description: 'Desk chair: swivel with castors, or upholstered on wooden legs.',
    materials: 'Fabric, metal or wood',
    height: { task: 100, side: 84 },
    price: { task: 290, side: 220 },
  },
  bench: {
    description: 'Bench for the end of a bed, a hallway or a dining table.',
    materials: 'Upholstered seat on a wooden frame, or solid wood',
    height: { upholstered: 46, wood: 45 },
    price: { upholstered: 340, wood: 290 },
  },
  bookshelf: {
    description: 'Shelving for books and decorative pieces.',
    materials: 'Wood; or a steel frame with wooden shelves',
    height: { open: 180, wide: 210 },
    price: { open: 290, wide: 890 },
  },
  chestOfDrawers: {
    description: 'Chest of drawers for clothes and linen.',
    materials: 'Wood with metal handles; or a steel frame with wooden drawers',
    height: { low: 78, tall: 188 },
    price: { low: 590, tall: 990 },
  },
  bathroomCabinet: {
    description: 'Moisture-resistant bathroom cupboard.',
    materials: 'Lacquered cabinet, metal handles',
    height: { tall: 170, low: 85 },
    price: { tall: 340, low: 290 },
  },
  wallArt: {
    description: 'Framed art print, hung at eye level.',
    materials: 'Giclée print on paper, wooden or metal frame',
    height: { abstract: 80, landscape: 80, gallery: 50 },
    price: { abstract: 149, landscape: 249, gallery: 279 },
  },
  wallMirror: {
    description: 'Wall mirror that makes the room feel bigger and brighter.',
    materials: 'Mirror glass, metal or wooden frame',
    height: { round: 80, tall: 160 },
    price: { round: 189, tall: 259 },
  },
  wallShelf: {
    description: 'Wall shelf for books, plants and small things.',
    materials: 'Solid wood, metal brackets',
    height: { single: 4, double: 50 },
    price: { single: 89, double: 149 },
  },
  drawerUnit: {
    description: 'Drawer unit for papers and stationery. The one on castors rolls under a desk.',
    materials: 'Wood veneer, metal handles',
    height: { castors: 58, 'desk-height': 72 },
    price: { castors: 189, 'desk-height': 249 },
  },
  pcTower: {
    description: 'Desktop computer case, on the floor or under the desk.',
    materials: 'Steel case, tempered-glass side panel',
    height: { mid: 46, mini: 34 },
    price: { mid: 1199, mini: 899 },
  },
  officeDesk: {
    description: 'Work desk with a cable tray under the top. The sit-stand desk rises on two electric columns.',
    materials: 'Wood-veneer top, powder-coated steel frame',
    height: 75,
    price: { straight: 549, compact: 399, standing: 799 },
  },
  officeChair: {
    description: 'Swivel office chair with a breathable mesh back, adjustable armrests and castors.',
    materials: 'Mesh back, fabric seat, nylon or aluminium base',
    height: { ergonomic: 120, task: 95 },
    price: { ergonomic: 459, task: 229 },
  },
  monitor: {
    description: 'Computer monitor on a height-adjustable stand, for a desk or table.',
    materials: 'Matte screen, aluminium stand',
    height: { '24': 42, '27': 46, ultrawide: 46, dual: 42 },
    price: { '24': 189, '27': 329, ultrawide: 549, dual: 378 },
  },
  laptop: {
    description: 'Laptop, open on the desk or raised on a stand.',
    materials: 'Aluminium case',
    height: { open: 22, stand: 32 },
    price: { open: 999, stand: 1049 },
  },
  keyboardMouse: {
    description: 'Wireless keyboard and mouse.',
    materials: 'Plastic and aluminium',
    height: 3,
    price: { full: 79, compact: 59 },
  },
  deskLamp: {
    description: 'LED desk lamp that lights your work from the evening on.',
    materials: 'Powder-coated steel, LED',
    height: { arm: 45, dome: 38 },
    price: { arm: 69, dome: 59 },
  },
  deskAccessories: {
    description: 'Small things for the desk: a pen pot, notepad and phone, or a little plant.',
    materials: 'Wood, ceramic and paper',
    height: { organiser: 14, plant: 22 },
    price: { organiser: 39, plant: 25 },
  },
  wallClock: {
    description: 'Round wall clock with a silent movement.',
    materials: 'Metal or wooden frame, glass front',
    height: { '30': 30, '40': 40 },
    price: { '30': 45, '40': 65 },
  },
  filingCabinet: {
    description: 'Lockable filing cabinet for A4 hanging files.',
    materials: 'Powder-coated steel',
    height: { '2': 72, '3': 102 },
    price: { '2': 219, '3': 289 },
  },
}

/** Height of one option in cm. */
export function productHeight(type: FurnitureType, variant: string): number {
  const { height } = PRODUCTS[type]
  return typeof height === 'number' ? height : (height[getVariant(type, variant).id] ?? Object.values(height)[0])
}

/** Height in metres: the piece's custom height if it has one, otherwise its option's. */
export function itemHeight(item: Pick<FurnitureItem, 'type' | 'variant' | 'size'>): number {
  return item.size ? item.size[2] : productHeight(item.type, item.variant) / 100
}

/** Example price of one option, in dollars. */
export function productPrice(type: FurnitureType, variant: string): number {
  const { price } = PRODUCTS[type]
  return price[getVariant(type, variant).id] ?? Object.values(price)[0]
}

const cm = (metres: number) => Math.round(metres * 100)

/**
 * Width × depth × height, e.g. "220 × 90 × 85 cm", "2.20 × 0.90 × 0.85 m" or, in
 * feet, each length in feet and inches. Round pieces show the diameter (Ø).
 * A custom size (Phase 15) is shown as it is.
 */
export function productSize(item: Pick<FurnitureItem, 'type' | 'variant' | 'size'>, unit: LengthUnit = 'cm'): string {
  const { round } = getVariant(item.type, item.variant)
  const footprint = itemFootprint(item)
  const h = itemHeight(item)
  const parts = round ? [footprint[0], h] : [footprint[0], footprint[1], h]
  const prefix = round ? 'Ø ' : ''
  if (unit === 'cm') return `${prefix}${parts.map(cm).join(' × ')} cm`
  if (unit === 'm') return `${prefix}${parts.map((v) => v.toFixed(2)).join(' × ')} m`
  return prefix + parts.map((v) => formatLength(v, 'ft')).join(' × ')
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 })

/** "$1,290" */
export const formatPrice = (amount: number) => money.format(amount)
