import { clamp, degToRad } from '../../utils/math'
// Type-only: house.ts imports this file's layouts, so a value import here would be circular.
import type { RoomId } from '../house'
import type { FrameId } from './frames'
// Only used inside functions, so this two-way import with products.ts is safe.
import { itemHeight } from './products'

export type FurnitureType =
  // Living Room
  | 'sofa'
  | 'armchair'
  | 'coffeeTable'
  | 'tvUnit'
  | 'plant'
  | 'floorLamp'
  // Bedroom
  | 'bed'
  | 'bedsideTable'
  | 'wardrobe'
  | 'dressingTable'
  | 'accentChair'
  // Dining Room
  | 'diningTable'
  | 'diningChair'
  | 'sideboard'
  // Kitchen
  | 'kitchenIsland'
  | 'barStool'
  | 'fridge'
  // Bathroom
  | 'bathtub'
  | 'vanity'
  | 'towelRail'
  // Phase 10: more seating, tables and storage (several rooms each)
  | 'cornerSofa'
  | 'ottoman'
  | 'sideTable'
  | 'desk'
  | 'deskChair'
  | 'bench'
  | 'bookshelf'
  | 'chestOfDrawers'
  | 'bathroomCabinet'
  // Phase 11: hung on a wall
  | 'wallArt'
  | 'wallMirror'
  | 'wallShelf'
  // Phase 15: under the desk
  | 'drawerUnit'
  | 'pcTower'
  // Phase 16: the Office
  | 'officeDesk'
  | 'officeChair'

/** Groups for the catalog ("Add furniture"), in the order they're shown. */
export type FurnitureCategory = 'seating' | 'tables' | 'beds' | 'storage' | 'office' | 'lighting' | 'decor' | 'kitchen' | 'bathroom'

export const CATEGORIES: { id: FurnitureCategory; label: string }[] = [
  { id: 'seating', label: 'Seating' },
  { id: 'tables', label: 'Tables & desks' },
  { id: 'beds', label: 'Beds' },
  { id: 'storage', label: 'Storage' },
  { id: 'office', label: 'Office' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'decor', label: 'Plants & decor' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bathroom' },
]

/** One piece of furniture in the room. This plain data is what undo/redo and saving store. */
export interface FurnitureItem {
  id: string
  type: FurnitureType
  /** Which style/size option is chosen, e.g. '2-seat'. See `variants` below. */
  variant: string
  /** Position on the floor as [x, z] in metres. */
  position: [number, number]
  /** Rotation around the vertical axis, in degrees (0–359). */
  rotation: number
  /** Main colour, e.g. the sofa fabric or the table wood. */
  color: string
  /** Finish of the legs / frame / handles (see frames.ts). Missing = the piece's standard finish. */
  frame?: FrameId
  /**
   * Custom width × depth × height in metres (Phase 15). Missing = the chosen option's
   * standard size, which is how every older design is stored. Round pieces use the
   * width as the diameter (depth = width). Kept within limits by sizes.ts.
   */
  size?: [number, number, number]
}

/** A style or size option for a piece of furniture. */
export interface VariantInfo {
  id: string
  label: string
  detail: string
  /** Width × depth in metres, used for the selection outline and keeping it inside the room. */
  footprint: [number, number]
  /** A circular footprint (diameter = footprint[0]), e.g. a round table: overlap and wall checks use the circle. */
  round?: boolean
}

interface FurnitureInfo {
  label: string
  /** Where it's listed in the catalog. */
  category: FurnitureCategory
  /**
   * The rooms this piece belongs in. Saved or imported furniture in any other room
   * is skipped, so rooms never mix (a bed can't end up in the kitchen).
   */
  rooms: RoomId[]
  /** Name of the option group shown in the panel, e.g. "Size" or "Style". */
  variantLabel: string
  /** The first one is the default. */
  variants: VariantInfo[]
  /** Which part the colour applies to. */
  colorLabel: string
  swatches: Swatch[]
  /**
   * A second finish for the legs, frame, base or handles, where the piece has them.
   * "Standard" (no choice) keeps the look it always had.
   */
  frame?: { label: string; options: FrameId[] }
  /**
   * 'wall': hangs on a wall (art, mirrors, shelves). It always sits flush against the
   * nearest wall, facing into the room, and never clashes with floor furniture.
   * Its footprint is [width along the wall, depth out from the wall].
   */
  mount?: 'wall'
  /**
   * A desk or table with knee space: how far below its top the space underneath
   * starts (top + apron or drawer). Chairs and low pieces may tuck under it.
   */
  kneeBelowTop?: number
  /**
   * May go under a desk or table (see kneeBelowTop):
   * - 'seat': a chair; the front `under` part of its depth may go under, the back stays out
   *   (round chairs: all but the middle `1 - under` of their width)
   * - 'low': anything lower than the knee space may go fully under (drawer units, PCs, poufs, benches)
   */
  tuck?: { kind: 'seat'; under: number } | { kind: 'low' }
}

/** A preset colour with a readable name (shown as a tooltip and read by screen readers). */
export interface Swatch {
  color: string
  name: string
}

const FABRIC_SWATCHES: Swatch[] = [
  { color: '#f1eee8', name: 'Ivory' },
  { color: '#d9cbb3', name: 'Oatmeal' },
  { color: '#8e9c80', name: 'Sage' },
  { color: '#5d6b7a', name: 'Slate blue' },
  { color: '#3a3a3c', name: 'Charcoal' },
  { color: '#b5654a', name: 'Rust' },
]
const WOOD_SWATCHES: Swatch[] = [
  { color: '#c49a6c', name: 'Natural oak' },
  { color: '#e0c49c', name: 'Birch' },
  { color: '#8a5a3b', name: 'Teak' },
  { color: '#4a3426', name: 'Walnut' },
  { color: '#f2f0eb', name: 'White' },
  { color: '#2a2a2c', name: 'Black' },
]

// Bedroom palette: cream whites and natural oak (modern luxury)
const CREAM_SWATCHES: Swatch[] = [
  { color: '#efe6d6', name: 'Cream' },
  { color: '#f6f2ea', name: 'Ivory white' },
  { color: '#e2d3bb', name: 'Champagne' },
  { color: '#cbb89c', name: 'Latte' },
  { color: '#9aa391', name: 'Sage' },
  { color: '#5c6470', name: 'Slate' },
]
const OAK_SWATCHES: Swatch[] = [
  { color: '#c49a6c', name: 'Natural oak' },
  { color: '#dcc0a0', name: 'Light oak' },
  { color: '#a87c52', name: 'Honey oak' },
  { color: '#6f4a31', name: 'Smoked oak' },
  { color: '#f1ebdf', name: 'Cream' },
  { color: '#2a2a2c', name: 'Black' },
]

const CABINET_SWATCHES: Swatch[] = [
  { color: '#f1ebdf', name: 'Cream' },
  { color: '#8e9c80', name: 'Sage' },
  { color: '#41556b', name: 'Navy' },
  { color: '#2a2a2c', name: 'Black' },
  { color: '#c49a6c', name: 'Natural oak' },
  { color: '#b98b73', name: 'Clay' },
]
const APPLIANCE_SWATCHES: Swatch[] = [
  { color: '#c9ccce', name: 'Stainless steel' },
  { color: '#f3f2ef', name: 'White' },
  { color: '#2a2a2c', name: 'Black' },
  { color: '#e8dcc3', name: 'Cream' },
  { color: '#9fae9a', name: 'Sage' },
  { color: '#9a3b34', name: 'Retro red' },
]
// Artwork colours: the main tone of the print.
const ART_SWATCHES: Swatch[] = [
  { color: '#c7764f', name: 'Terracotta' },
  { color: '#8e9c80', name: 'Sage' },
  { color: '#41556b', name: 'Navy' },
  { color: '#d4a64a', name: 'Ochre' },
  { color: '#d9a7a0', name: 'Blush' },
  { color: '#3a3a3c', name: 'Charcoal' },
]
// Mirror frames.
const MIRROR_SWATCHES: Swatch[] = [
  { color: '#b8925a', name: 'Brass' },
  { color: '#2a2a2c', name: 'Black' },
  { color: '#c49a6c', name: 'Natural oak' },
  { color: '#f2f0eb', name: 'White' },
  { color: '#d9dcdf', name: 'Silver' },
  { color: '#8a5a3b', name: 'Teak' },
]

const BATH_SWATCHES: Swatch[] = [
  { color: '#f6f5f2', name: 'Gloss white' },
  { color: '#2a2a2c', name: 'Matte black' },
  { color: '#8e9c80', name: 'Sage' },
  { color: '#c7a493', name: 'Clay' },
  { color: '#41556b', name: 'Navy' },
  { color: '#b8925a', name: 'Brass' },
]

export const FURNITURE_INFO: Record<FurnitureType, FurnitureInfo> = {
  sofa: {
    label: 'Sofa',
    category: 'seating',
    rooms: ['living'],
    variantLabel: 'Size',
    variants: [
      { id: '3-seat', label: '3-seater', detail: '220 cm', footprint: [2.2, 0.9] },
      { id: '2-seat', label: '2-seater', detail: '160 cm', footprint: [1.6, 0.9] },
      { id: '4-seat', label: '4-seater', detail: '280 cm', footprint: [2.8, 0.9] },
    ],
    colorLabel: 'Fabric',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Legs', options: ['walnut', 'oak', 'black', 'brass'] },
  },
  armchair: {
    label: 'Armchair',
    category: 'seating',
    rooms: ['living'],
    variantLabel: 'Style',
    variants: [
      { id: 'lounge', label: 'Lounge', detail: '82 cm, oak and leather', footprint: [0.82, 0.99] },
      { id: 'armless', label: 'Armless', detail: '70 cm', footprint: [0.7, 0.8] },
    ],
    colorLabel: 'Fabric',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Legs', options: ['oak', 'walnut', 'black'] },
  },
  coffeeTable: {
    label: 'Coffee table',
    category: 'tables',
    rooms: ['living'],
    variantLabel: 'Shape',
    variants: [
      { id: 'rectangle', label: 'Rectangle', detail: '120 × 60 cm', footprint: [1.2, 0.6] },
      { id: 'round', label: 'Round', detail: 'Ø 90 cm', footprint: [0.9, 0.9], round: true },
      { id: 'square', label: 'Square, carved top', detail: '100 × 100 cm, wood on black', footprint: [1.0, 1.0] },
    ],
    colorLabel: 'Wood',
    swatches: WOOD_SWATCHES,
  },
  tvUnit: {
    label: 'TV & media unit',
    category: 'storage',
    rooms: ['living'],
    variantLabel: 'Screen',
    variants: [
      { id: '55', label: '55" TV', detail: '180 cm unit', footprint: [1.8, 0.42] },
      { id: '65', label: '65" TV', detail: '180 cm unit', footprint: [1.8, 0.42] },
    ],
    colorLabel: 'Cabinet',
    swatches: [
      { color: '#6e4b33', name: 'Dark walnut' },
      { color: '#c49a6c', name: 'Natural oak' },
      { color: '#f2f0eb', name: 'White' },
      { color: '#2a2a2c', name: 'Black' },
      { color: '#7d8b74', name: 'Olive' },
      { color: '#41556b', name: 'Navy' },
    ],
  },
  plant: {
    label: 'Indoor plant',
    category: 'decor',
    rooms: ['living', 'bedroom', 'dining', 'kitchen', 'bathroom', 'office'],
    variantLabel: 'Size',
    variants: [
      { id: 'large', label: 'Large', detail: '130 cm', footprint: [0.6, 0.6] },
      { id: 'small', label: 'Small', detail: '85 cm', footprint: [0.4, 0.4] },
    ],
    colorLabel: 'Pot',
    swatches: [
      { color: '#b86f50', name: 'Terracotta' },
      { color: '#ecebe6', name: 'White ceramic' },
      { color: '#2a2a2c', name: 'Black' },
      { color: '#7d8b74', name: 'Olive' },
      { color: '#c9b393', name: 'Sand' },
      { color: '#41556b', name: 'Navy' },
    ],
  },
  floorLamp: {
    label: 'Floor lamp',
    category: 'lighting',
    rooms: ['living', 'bedroom', 'dining', 'office'],
    variantLabel: 'Shade',
    variants: [
      { id: 'tapered', label: 'Tapered', detail: '150 cm', footprint: [0.46, 0.46] },
      { id: 'drum', label: 'Drum', detail: '150 cm', footprint: [0.46, 0.46] },
    ],
    colorLabel: 'Shade',
    swatches: [
      { color: '#f6eedd', name: 'Linen' },
      { color: '#e9d3b0', name: 'Honey' },
      { color: '#c9d6c2', name: 'Mint' },
      { color: '#e3cccc', name: 'Blush' },
      { color: '#c7d2de', name: 'Sky' },
      { color: '#ffffff', name: 'White' },
    ],
    frame: { label: 'Stand', options: ['brass', 'black', 'chrome', 'white'] },
  },
  bed: {
    label: 'Bed',
    category: 'beds',
    rooms: ['bedroom'],
    variantLabel: 'Size',
    variants: [
      // Footprint = frame + headboard around a 180 × 200 (or 160 × 200) mattress
      { id: 'king', label: 'King', detail: '180 × 200 cm', footprint: [1.9, 2.17] },
      { id: 'queen', label: 'Queen', detail: '160 × 200 cm', footprint: [1.7, 2.17] },
      { id: 'double', label: 'Double', detail: '140 × 200 cm', footprint: [1.5, 2.17] },
      { id: 'single', label: 'Single', detail: '90 × 200 cm', footprint: [1.0, 2.17] },
    ],
    colorLabel: 'Upholstery',
    swatches: CREAM_SWATCHES,
    frame: { label: 'Plinth', options: ['oak', 'walnut', 'white', 'black'] },
  },
  bedsideTable: {
    label: 'Bedside table',
    category: 'tables',
    rooms: ['bedroom'],
    variantLabel: 'Style',
    variants: [
      { id: 'drawers', label: 'Two drawers', detail: 'with lamp', footprint: [0.5, 0.4] },
      { id: 'shelf', label: 'Drawer + shelf', detail: 'with lamp', footprint: [0.5, 0.4] },
    ],
    colorLabel: 'Wood',
    swatches: OAK_SWATCHES,
    frame: { label: 'Legs & handles', options: ['brass', 'black', 'chrome'] },
  },
  wardrobe: {
    label: 'Sliding wardrobe',
    category: 'storage',
    rooms: ['bedroom'],
    variantLabel: 'Size',
    variants: [
      { id: '2-door', label: '2 doors', detail: '200 cm', footprint: [2.0, 0.62] },
      { id: '3-door', label: '3 doors', detail: '270 cm', footprint: [2.7, 0.62] },
    ],
    colorLabel: 'Doors',
    swatches: CREAM_SWATCHES,
  },
  dressingTable: {
    label: 'Dressing table',
    category: 'tables',
    rooms: ['bedroom'],
    variantLabel: 'Mirror',
    variants: [
      // Depth includes the stool tucked in front
      { id: 'round', label: 'Round mirror', detail: '100 cm', footprint: [1.0, 0.75] },
      { id: 'tall', label: 'Tall mirror', detail: '100 cm', footprint: [1.0, 0.75] },
    ],
    colorLabel: 'Wood',
    swatches: OAK_SWATCHES,
  },
  accentChair: {
    label: 'Accent chair',
    category: 'seating',
    rooms: ['bedroom', 'living', 'office'],
    tuck: { kind: 'seat', under: 0.5 },
    variantLabel: 'Style',
    variants: [
      { id: 'tub', label: 'Tub', detail: '75 cm', footprint: [0.75, 0.75] },
      { id: 'wingback', label: 'Wingback', detail: '75 cm', footprint: [0.75, 0.75] },
      { id: 'lounge', label: 'Mid-century lounge', detail: '101 cm, swivel', footprint: [1.0, 1.18] },
    ],
    colorLabel: 'Fabric',
    swatches: CREAM_SWATCHES,
    frame: { label: 'Legs', options: ['oak', 'walnut', 'black', 'brass'] },
  },
  diningTable: {
    label: 'Dining table',
    category: 'tables',
    rooms: ['dining', 'kitchen'],
    kneeBelowTop: 0.12,
    variantLabel: 'Shape',
    variants: [
      { id: 'rectangle', label: 'Rectangle', detail: '180 × 90 cm, seats 6', footprint: [1.8, 0.9] },
      { id: 'round', label: 'Round', detail: 'Ø 120 cm, seats 4', footprint: [1.2, 1.2], round: true },
      { id: 'long', label: 'Long', detail: '220 × 95 cm, seats 8', footprint: [2.2, 0.95] },
    ],
    colorLabel: 'Wood',
    swatches: WOOD_SWATCHES,
  },
  diningChair: {
    label: 'Dining chair',
    category: 'seating',
    rooms: ['dining', 'kitchen'],
    tuck: { kind: 'seat', under: 0.7 },
    variantLabel: 'Style',
    variants: [
      { id: 'upholstered', label: 'Upholstered', detail: '46 cm', footprint: [0.46, 0.52] },
      { id: 'spindle', label: 'Spindle back', detail: '46 cm', footprint: [0.46, 0.5] },
      { id: 'leather', label: 'Leather', detail: '45 cm, brown leather', footprint: [0.45, 0.58] },
    ],
    colorLabel: 'Seat',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Frame', options: ['oak', 'walnut', 'black', 'white'] },
  },
  sideboard: {
    label: 'Sideboard',
    category: 'storage',
    rooms: ['dining', 'living'],
    variantLabel: 'Size',
    variants: [
      { id: '160', label: '160 cm', detail: '3 doors', footprint: [1.6, 0.45] },
      { id: '200', label: '200 cm', detail: '4 doors', footprint: [2.0, 0.45] },
    ],
    colorLabel: 'Wood',
    swatches: WOOD_SWATCHES,
  },
  kitchenIsland: {
    label: 'Kitchen island',
    category: 'kitchen',
    rooms: ['kitchen'],
    variantLabel: 'Size',
    variants: [
      { id: 'large', label: 'Large', detail: '180 × 90 cm', footprint: [1.8, 0.9] },
      { id: 'compact', label: 'Compact', detail: '140 × 80 cm', footprint: [1.4, 0.8] },
    ],
    colorLabel: 'Cabinets',
    swatches: CABINET_SWATCHES,
  },
  barStool: {
    label: 'Bar stool',
    category: 'seating',
    rooms: ['kitchen'],
    tuck: { kind: 'low' },
    variantLabel: 'Style',
    variants: [
      { id: 'backless', label: 'Backless', detail: '75 cm seat', footprint: [0.4, 0.4] },
      { id: 'low-back', label: 'Low back', detail: '75 cm seat', footprint: [0.42, 0.42] },
    ],
    colorLabel: 'Seat',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Frame', options: ['black', 'brass', 'chrome', 'white'] },
  },
  fridge: {
    label: 'Fridge',
    category: 'kitchen',
    rooms: ['kitchen'],
    variantLabel: 'Size',
    variants: [
      { id: 'single', label: 'Fridge-freezer', detail: '60 cm', footprint: [0.6, 0.68] },
      { id: 'double', label: 'American style', detail: '90 cm', footprint: [0.9, 0.72] },
    ],
    colorLabel: 'Finish',
    swatches: APPLIANCE_SWATCHES,
  },
  bathtub: {
    label: 'Bath or shower',
    category: 'bathroom',
    rooms: ['bathroom'],
    variantLabel: 'Type',
    variants: [
      { id: 'freestanding', label: 'Freestanding bath', detail: '170 × 78 cm', footprint: [1.7, 0.78] },
      { id: 'shower', label: 'Walk-in shower', detail: '120 × 80 cm', footprint: [1.2, 0.8] },
    ],
    colorLabel: 'Outside',
    swatches: BATH_SWATCHES,
  },
  vanity: {
    label: 'Vanity unit',
    category: 'bathroom',
    rooms: ['bathroom'],
    variantLabel: 'Basins',
    variants: [
      { id: 'single', label: 'Single basin', detail: '80 cm, with mirror', footprint: [0.8, 0.5] },
      { id: 'double', label: 'Double basin', detail: '120 cm, with mirrors', footprint: [1.2, 0.5] },
    ],
    colorLabel: 'Cabinet',
    swatches: WOOD_SWATCHES,
  },
  towelRail: {
    label: 'Towel rail',
    category: 'bathroom',
    rooms: ['bathroom'],
    variantLabel: 'Style',
    variants: [
      { id: 'ladder', label: 'Ladder', detail: '50 × 110 cm', footprint: [0.5, 0.12] },
      { id: 'bar', label: 'Wall bar', detail: '60 cm', footprint: [0.6, 0.12] },
    ],
    colorLabel: 'Towel',
    swatches: FABRIC_SWATCHES,
  },
  // ---------- Phase 10 ----------
  cornerSofa: {
    label: 'Corner sofa',
    category: 'seating',
    rooms: ['living'],
    variantLabel: 'Chaise side',
    variants: [
      { id: 'left', label: 'Chaise on the left', detail: '260 × 170 cm', footprint: [2.6, 1.7] },
      { id: 'right', label: 'Chaise on the right', detail: '260 × 170 cm', footprint: [2.6, 1.7] },
    ],
    colorLabel: 'Fabric',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Legs', options: ['walnut', 'oak', 'black', 'brass'] },
  },
  ottoman: {
    label: 'Ottoman',
    category: 'seating',
    rooms: ['living', 'bedroom'],
    tuck: { kind: 'low' },
    variantLabel: 'Style',
    variants: [
      { id: 'pouf', label: 'Round pouf', detail: 'Ø 55 cm', footprint: [0.55, 0.55], round: true },
      { id: 'leather', label: 'Leather footstool', detail: '88 × 62 cm', footprint: [0.88, 0.62] },
    ],
    colorLabel: 'Fabric',
    swatches: FABRIC_SWATCHES,
  },
  sideTable: {
    label: 'Side table',
    category: 'tables',
    rooms: ['living', 'bedroom', 'office'],
    variantLabel: 'Style',
    variants: [
      { id: 'round', label: 'Round', detail: 'Ø 45 cm', footprint: [0.45, 0.45], round: true },
      { id: 'wood', label: 'Wooden cube', detail: '55 × 45 cm', footprint: [0.55, 0.45] },
    ],
    colorLabel: 'Top',
    swatches: WOOD_SWATCHES,
    frame: { label: 'Base', options: ['black', 'brass', 'chrome', 'white'] },
  },
  desk: {
    label: 'Desk',
    category: 'tables',
    rooms: ['bedroom', 'living', 'office'],
    kneeBelowTop: 0.12,
    variantLabel: 'Size',
    variants: [
      { id: '120', label: 'Writing desk', detail: '120 × 60 cm', footprint: [1.2, 0.6] },
      { id: '100', label: 'Compact', detail: '100 × 50 cm', footprint: [1.0, 0.5] },
    ],
    colorLabel: 'Wood',
    swatches: OAK_SWATCHES,
    frame: { label: 'Legs', options: ['black', 'white', 'brass', 'oak'] },
  },
  deskChair: {
    label: 'Desk chair',
    category: 'seating',
    rooms: ['bedroom', 'living', 'office'],
    tuck: { kind: 'seat', under: 0.6 },
    variantLabel: 'Style',
    variants: [
      { id: 'task', label: 'Swivel', detail: '62 cm, on castors', footprint: [0.62, 0.62], round: true },
      { id: 'side', label: 'Upholstered', detail: '50 cm', footprint: [0.5, 0.54] },
    ],
    colorLabel: 'Seat',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Frame', options: ['black', 'chrome', 'white', 'oak'] },
  },
  bench: {
    label: 'Bench',
    category: 'seating',
    rooms: ['bedroom', 'dining', 'kitchen', 'living'],
    tuck: { kind: 'low' },
    variantLabel: 'Style',
    variants: [
      { id: 'upholstered', label: 'Upholstered', detail: '120 × 40 cm', footprint: [1.2, 0.4] },
      { id: 'wood', label: 'Wooden', detail: '140 × 35 cm', footprint: [1.4, 0.35] },
    ],
    colorLabel: 'Seat',
    swatches: CREAM_SWATCHES,
    frame: { label: 'Frame', options: ['oak', 'walnut', 'black', 'white'] },
  },
  bookshelf: {
    label: 'Bookshelf',
    category: 'storage',
    rooms: ['living', 'bedroom', 'dining', 'kitchen', 'office'],
    variantLabel: 'Size',
    variants: [
      { id: 'open', label: 'Open shelves', detail: '90 × 35 cm, 180 tall', footprint: [0.9, 0.35] },
      { id: 'wide', label: 'Wall shelving', detail: '200 × 45 cm, steel and wood', footprint: [2.0, 0.45] },
    ],
    colorLabel: 'Wood',
    swatches: WOOD_SWATCHES,
  },
  chestOfDrawers: {
    label: 'Chest of drawers',
    category: 'storage',
    rooms: ['bedroom', 'living'],
    variantLabel: 'Style',
    variants: [
      { id: 'low', label: 'Low, 3 drawers', detail: '90 × 45 cm', footprint: [0.9, 0.45] },
      { id: 'tall', label: 'Tall, steel frame', detail: '114 × 49 cm, drawers and shelves', footprint: [1.14, 0.49] },
    ],
    colorLabel: 'Wood',
    swatches: OAK_SWATCHES,
    frame: { label: 'Handles', options: ['brass', 'black', 'chrome'] },
  },
  bathroomCabinet: {
    label: 'Bathroom cabinet',
    category: 'bathroom',
    rooms: ['bathroom'],
    variantLabel: 'Size',
    variants: [
      { id: 'tall', label: 'Tall', detail: '40 × 32 cm, 170 tall', footprint: [0.4, 0.32] },
      { id: 'low', label: 'Low', detail: '60 × 32 cm, 85 tall', footprint: [0.6, 0.32] },
    ],
    colorLabel: 'Cabinet',
    swatches: BATH_SWATCHES,
    frame: { label: 'Handles & legs', options: ['chrome', 'brass', 'black'] },
  },

  // ---------- Phase 11: on the wall ----------
  wallArt: {
    label: 'Wall art',
    category: 'decor',
    rooms: ['living', 'bedroom', 'dining', 'kitchen', 'bathroom', 'office'],
    mount: 'wall',
    variantLabel: 'Print',
    variants: [
      { id: 'abstract', label: 'Abstract', detail: '60 × 80 cm, portrait', footprint: [0.6, 0.04] },
      { id: 'landscape', label: 'Landscape', detail: '120 × 80 cm', footprint: [1.2, 0.04] },
      { id: 'gallery', label: 'Set of three', detail: '3 × 40 × 50 cm', footprint: [1.5, 0.04] },
    ],
    colorLabel: 'Artwork',
    swatches: ART_SWATCHES,
    frame: { label: 'Frame', options: ['black', 'white', 'oak', 'brass'] },
  },
  wallMirror: {
    label: 'Mirror',
    category: 'decor',
    rooms: ['living', 'bedroom', 'dining', 'bathroom', 'office'],
    mount: 'wall',
    variantLabel: 'Shape',
    variants: [
      { id: 'round', label: 'Round', detail: 'Ø 80 cm', footprint: [0.8, 0.04] },
      { id: 'tall', label: 'Tall', detail: '60 × 160 cm', footprint: [0.6, 0.04] },
    ],
    colorLabel: 'Frame',
    swatches: MIRROR_SWATCHES,
  },
  wallShelf: {
    label: 'Wall shelf',
    category: 'storage',
    rooms: ['living', 'bedroom', 'dining', 'kitchen', 'bathroom', 'office'],
    mount: 'wall',
    variantLabel: 'Style',
    variants: [
      { id: 'single', label: 'Floating shelf', detail: '100 × 22 cm', footprint: [1.0, 0.22] },
      { id: 'double', label: 'Two shelves', detail: '80 × 22 cm, on brackets', footprint: [0.8, 0.22] },
    ],
    colorLabel: 'Wood',
    swatches: WOOD_SWATCHES,
    frame: { label: 'Brackets', options: ['black', 'brass', 'white'] },
  },

  // ---------- Phase 15: under the desk ----------
  drawerUnit: {
    label: 'Drawer unit',
    category: 'office',
    rooms: ['bedroom', 'living', 'office'],
    tuck: { kind: 'low' },
    variantLabel: 'Style',
    variants: [
      { id: 'castors', label: 'On castors', detail: '41 × 50 cm, 58 tall, 3 drawers', footprint: [0.41, 0.5] },
      { id: 'desk-height', label: 'Desk height', detail: '43 × 58 cm, 72 tall, file drawer', footprint: [0.43, 0.58] },
    ],
    colorLabel: 'Body',
    swatches: OAK_SWATCHES,
    frame: { label: 'Handles', options: ['black', 'chrome', 'brass'] },
  },
  pcTower: {
    label: 'PC tower',
    category: 'office',
    rooms: ['bedroom', 'living', 'office'],
    tuck: { kind: 'low' },
    variantLabel: 'Size',
    variants: [
      { id: 'mid', label: 'Mid tower', detail: '21 × 45 cm, 46 tall', footprint: [0.21, 0.45] },
      { id: 'mini', label: 'Small form factor', detail: '17 × 36 cm, 34 tall', footprint: [0.17, 0.36] },
    ],
    colorLabel: 'Case',
    swatches: [
      { color: '#2a2a2c', name: 'Black' },
      { color: '#f2f0eb', name: 'White' },
      { color: '#9ea3a8', name: 'Silver' },
    ],
  },

  // ---------- Phase 16: the Office ----------
  officeDesk: {
    label: 'Office desk',
    category: 'office',
    rooms: ['office', 'bedroom', 'living'],
    kneeBelowTop: 0.1,
    variantLabel: 'Style',
    variants: [
      { id: 'straight', label: 'Straight', detail: '160 × 80 cm, steel frame', footprint: [1.6, 0.8] },
      { id: 'compact', label: 'Compact', detail: '120 × 70 cm, steel frame', footprint: [1.2, 0.7] },
      { id: 'standing', label: 'Sit-stand', detail: '140 × 70 cm, 72–125 cm high', footprint: [1.4, 0.7] },
    ],
    colorLabel: 'Top',
    swatches: OAK_SWATCHES,
    frame: { label: 'Frame', options: ['black', 'white', 'chrome'] },
  },
  officeChair: {
    label: 'Office chair',
    category: 'office',
    rooms: ['office', 'bedroom', 'living'],
    tuck: { kind: 'seat', under: 0.6 },
    variantLabel: 'Style',
    variants: [
      { id: 'ergonomic', label: 'Ergonomic', detail: 'mesh back, headrest, 68 cm', footprint: [0.68, 0.68], round: true },
      { id: 'task', label: 'Task chair', detail: 'mesh back, 60 cm', footprint: [0.6, 0.6], round: true },
    ],
    colorLabel: 'Seat',
    swatches: FABRIC_SWATCHES,
    frame: { label: 'Base', options: ['black', 'chrome', 'white'] },
  },
}

/** Does this piece hang on a wall (art, mirrors, shelves)? */
export const isWallMounted = (type: FurnitureType) => FURNITURE_INFO[type].mount === 'wall'

/**
 * Where a wall-mounted piece hangs: flush against the wall nearest to its
 * position, centred on that point along the wall, facing into the room.
 * Rotation: back wall 0°, left wall 90°, front wall 180°, right wall 270° (pieces
 * face +z at 0°, like everything else).
 */
export function mountOnWall(
  item: Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'size'>,
  room: { width: number; depth: number },
): { position: [number, number]; rotation: number } {
  const [w, d] = itemFootprint(item)
  const halfW = room.width / 2
  const halfD = room.depth / 2
  // A point dragged past a wall counts as at that wall (otherwise its distance would be negative).
  const x = clamp(item.position[0], -halfW, halfW)
  const z = clamp(item.position[1], -halfD, halfD)
  const along = (half: number) => Math.max(half - w / 2, 0)
  const walls = [
    { gap: z + halfD, rotation: 0, position: [clamp(x, -along(halfW), along(halfW)), -halfD + d / 2] },
    { gap: halfD - z, rotation: 180, position: [clamp(x, -along(halfW), along(halfW)), halfD - d / 2] },
    { gap: x + halfW, rotation: 90, position: [-halfW + d / 2, clamp(z, -along(halfD), along(halfD))] },
    { gap: halfW - x, rotation: 270, position: [halfW - d / 2, clamp(z, -along(halfD), along(halfD))] },
  ] as const
  const nearest = walls.reduce((best, wall) => (wall.gap < best.gap ? wall : best))
  return { position: [nearest.position[0], nearest.position[1]], rotation: nearest.rotation }
}

/**
 * Where a piece ends up in a room: kept inside the walls, and for wall-mounted
 * pieces, hung on the nearest wall (which also sets their rotation).
 */
export function placeInRoom(
  item: Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'rotation' | 'size'>,
  room: { width: number; depth: number },
): { position: [number, number]; rotation: number } {
  if (isWallMounted(item.type)) return mountOnWall(item, room)
  return { position: clampToRoom(item, room), rotation: item.rotation }
}

/** Can this kind of furniture go in this room? */
export function isAllowedIn(type: FurnitureType, room: RoomId): boolean {
  return FURNITURE_INFO[type].rooms.includes(room)
}

/** Looks up a variant, falling back to the default if the id is unknown. */
export function getVariant(type: FurnitureType, variant: string): VariantInfo {
  const { variants } = FURNITURE_INFO[type]
  return variants.find((v) => v.id === variant) ?? variants[0]
}

/**
 * Width × depth on the floor in metres: the piece's custom size if it has one,
 * otherwise its option's. Everything that measures a piece (walls, overlaps,
 * outlines, guides) goes through this.
 */
export function itemFootprint(item: Pick<FurnitureItem, 'type' | 'variant' | 'size'>): [number, number] {
  const { footprint, round } = getVariant(item.type, item.variant)
  if (!item.size) return footprint
  return round ? [item.size[0], item.size[0]] : [item.size[0], item.size[1]]
}

/** The Living Room's starting arrangement. "Reset" returns to this. */
const LIVING_LAYOUT: FurnitureItem[] = [
  { id: 'sofa', type: 'sofa', variant: '3-seat', position: [0.3, -2.5], rotation: 0, color: '#f1eee8' },
  { id: 'coffee-table', type: 'coffeeTable', variant: 'rectangle', position: [0.3, -1.15], rotation: 0, color: '#c49a6c' },
  { id: 'armchair', type: 'armchair', variant: 'lounge', position: [2.2, -0.5], rotation: 250, color: '#f1eee8' },
  { id: 'tv', type: 'tvUnit', variant: '55', position: [-3.27, -0.9], rotation: 90, color: '#6e4b33' },
  { id: 'plant', type: 'plant', variant: 'large', position: [-3.05, -2.55], rotation: 0, color: '#b86f50' },
  { id: 'lamp', type: 'floorLamp', variant: 'tapered', position: [1.8, -2.6], rotation: 0, color: '#f6eedd' },
]

/**
 * The Bedroom's starting arrangement (5 × 4 m). Positions are measured from the
 * bedroom's centre: x -2.5…2.5, z -2…2 (back wall at z = -2, shared wall at x = -2.5).
 */
const BEDROOM_LAYOUT: FurnitureItem[] = [
  // King bed centred on the oak slat wall, headboard against the back wall
  { id: 'bed', type: 'bed', variant: 'king', position: [-0.35, -0.915], rotation: 0, color: '#efe6d6' },
  { id: 'bedside-left', type: 'bedsideTable', variant: 'drawers', position: [-1.61, -1.78], rotation: 0, color: '#c49a6c' },
  { id: 'bedside-right', type: 'bedsideTable', variant: 'drawers', position: [0.91, -1.78], rotation: 0, color: '#c49a6c' },
  // Sliding wardrobe against the shared wall (sliding doors need no swing space beside the bed)
  { id: 'wardrobe', type: 'wardrobe', variant: '2-door', position: [-2.19, -1.0], rotation: 90, color: '#efe6d6' },
  // Dressing table on the right wall, near the front
  { id: 'dressing-table', type: 'dressingTable', variant: 'round', position: [2.125, 0.6], rotation: 270, color: '#c49a6c' },
  { id: 'accent-chair', type: 'accentChair', variant: 'tub', position: [1.0, 1.3], rotation: 225, color: '#e2d3bb' },
  { id: 'bedroom-plant', type: 'plant', variant: 'large', position: [2.2, 1.7], rotation: 0, color: '#ecebe6' },
  { id: 'bedroom-plant-small', type: 'plant', variant: 'small', position: [-2.28, 0.4], rotation: 0, color: '#c9b393' },
]

/**
 * Dining Room (4.5 × 4 m): x -2.25…2.25, z -2…2. Table for six under the pendant
 * light, chairs pulled out a little, sideboard against the right wall.
 */
const DINING_LAYOUT: FurnitureItem[] = [
  { id: 'dining-table', type: 'diningTable', variant: 'rectangle', position: [0, -0.1], rotation: 0, color: '#8a5a3b' },
  { id: 'chair-back-left', type: 'diningChair', variant: 'upholstered', position: [-0.6, -0.86], rotation: 0, color: '#d9cbb3' },
  { id: 'chair-back-mid', type: 'diningChair', variant: 'upholstered', position: [0, -0.86], rotation: 0, color: '#d9cbb3' },
  { id: 'chair-back-right', type: 'diningChair', variant: 'upholstered', position: [0.6, -0.86], rotation: 0, color: '#d9cbb3' },
  { id: 'chair-front-left', type: 'diningChair', variant: 'upholstered', position: [-0.6, 0.66], rotation: 180, color: '#d9cbb3' },
  { id: 'chair-front-mid', type: 'diningChair', variant: 'upholstered', position: [0, 0.66], rotation: 180, color: '#d9cbb3' },
  { id: 'chair-front-right', type: 'diningChair', variant: 'upholstered', position: [0.6, 0.66], rotation: 180, color: '#d9cbb3' },
  { id: 'sideboard', type: 'sideboard', variant: '160', position: [2.0, -0.2], rotation: 270, color: '#c49a6c' },
  { id: 'dining-plant', type: 'plant', variant: 'large', position: [1.85, -1.6], rotation: 0, color: '#b86f50' },
]

/**
 * Kitchen (4 × 3.5 m): x -2…2, z -1.75…1.75. The units along the back wall are
 * built in (see ROOMS.kitchen.fixedZones); the island, stools and fridge move.
 */
const KITCHEN_LAYOUT: FurnitureItem[] = [
  { id: 'island', type: 'kitchenIsland', variant: 'large', position: [-0.2, 0.3], rotation: 0, color: '#8e9c80' },
  { id: 'stool-left', type: 'barStool', variant: 'low-back', position: [-0.8, 1.02], rotation: 180, color: '#3a3a3c' },
  { id: 'stool-mid', type: 'barStool', variant: 'low-back', position: [-0.2, 1.02], rotation: 180, color: '#3a3a3c' },
  { id: 'stool-right', type: 'barStool', variant: 'low-back', position: [0.4, 1.02], rotation: 180, color: '#3a3a3c' },
  { id: 'fridge', type: 'fridge', variant: 'single', position: [1.66, -0.7], rotation: 270, color: '#c9ccce' },
  { id: 'kitchen-plant', type: 'plant', variant: 'small', position: [-1.75, -0.6], rotation: 0, color: '#ecebe6' },
]

/**
 * Bathroom (3 × 2.5 m): x -1.5…1.5, z -1.25…1.25. Bath under the window, vanity
 * on the right wall, towel rail by the door. The toilet is built in.
 */
const BATHROOM_LAYOUT: FurnitureItem[] = [
  { id: 'bath', type: 'bathtub', variant: 'freestanding', position: [0.55, -0.82], rotation: 0, color: '#f6f5f2' },
  { id: 'vanity', type: 'vanity', variant: 'single', position: [1.25, 0.72], rotation: 270, color: '#c49a6c' },
  { id: 'towel-rail', type: 'towelRail', variant: 'ladder', position: [-1.44, -0.3], rotation: 90, color: '#f1eee8' },
  { id: 'bathroom-plant', type: 'plant', variant: 'small', position: [0.2, 1.0], rotation: 0, color: '#ecebe6' },
]

/**
 * Office (4.5 × 4 m): x -2.25…2.25, z -2…2. The desk sits under the window with the
 * chair tucked in, the PC and a drawer unit under it; a bookshelf beside the window.
 */
const OFFICE_LAYOUT: FurnitureItem[] = [
  { id: 'office-desk', type: 'officeDesk', variant: 'straight', position: [0, -1.6], rotation: 0, color: '#c49a6c' },
  { id: 'office-chair', type: 'officeChair', variant: 'ergonomic', position: [0, -0.98], rotation: 180, color: '#3a3a3c' },
  { id: 'office-pc', type: 'pcTower', variant: 'mid', position: [-0.58, -1.65], rotation: 0, color: '#2a2a2c' },
  { id: 'office-drawers', type: 'drawerUnit', variant: 'castors', position: [0.52, -1.65], rotation: 0, color: '#f1ebdf' },
  { id: 'office-bookshelf', type: 'bookshelf', variant: 'open', position: [1.7, -1.82], rotation: 0, color: '#c49a6c' },
  { id: 'office-plant', type: 'plant', variant: 'large', position: [-1.85, -1.6], rotation: 0, color: '#ecebe6' },
  { id: 'office-lamp', type: 'floorLamp', variant: 'tapered', position: [-1.95, 0.42], rotation: 0, color: '#f6eedd' },
  { id: 'office-art', type: 'wallArt', variant: 'landscape', position: [-2.23, -0.4], rotation: 90, color: '#41556b' },
]

/** Each room's starting arrangement, measured from the room's centre. "Reset" returns to it. */
export const DEFAULT_LAYOUTS: Record<RoomId, FurnitureItem[]> = {
  living: LIVING_LAYOUT,
  bedroom: BEDROOM_LAYOUT,
  dining: DINING_LAYOUT,
  kitchen: KITCHEN_LAYOUT,
  bathroom: BATHROOM_LAYOUT,
  office: OFFICE_LAYOUT,
}

/**
 * Keeps a piece of furniture inside the room walls. A rotated object takes up
 * a different amount of space along x and z, so the rotation is included.
 */
/**
 * Half the size of a piece along x and z, after its rotation. A round piece is the
 * same size whichever way it's turned.
 */
export function footprintHalfExtents(item: Pick<FurnitureItem, 'type' | 'variant' | 'rotation' | 'size'>): [number, number] {
  const { round } = getVariant(item.type, item.variant)
  const [w, d] = itemFootprint(item)
  if (round) return [w / 2, w / 2]
  const angle = degToRad(item.rotation)
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  return [(cos * w + sin * d) / 2, (sin * w + cos * d) / 2]
}

export function clampToRoom(
  item: Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'rotation' | 'size'>,
  /** The room's inner size. */
  room: { width: number; depth: number },
): [number, number] {
  const [halfX, halfZ] = footprintHalfExtents(item)
  const maxX = room.width / 2 - halfX
  const maxZ = room.depth / 2 - halfZ
  return [clamp(item.position[0], -maxX, maxX), clamp(item.position[1], -maxZ, maxZ)]
}

type Point = [number, number]

/** The four floor corners of an item's footprint, rotated the same way as the 3D model. */
/**
 * Something built into a room that furniture shouldn't overlap, such as the
 * kitchen units or the toilet. Rectangles on the floor, never rotated.
 */
export interface FixedZone {
  /** Shown in the overlap warning, e.g. "kitchen units". */
  label: string
  /** Centre on the floor, [x, z], and size [width, depth], in metres. */
  position: [number, number]
  size: [number, number]
  /** A window or door: only pieces hung on a wall can clash with it (see openingZones in house.ts). */
  onWall?: boolean
}

/** Overlap results use this prefix for built-in zones, so they can't be mistaken for furniture ids. */
export const ZONE_PREFIX = 'zone:'

function rectCorners([cx, cz]: Point, [w, d]: Point, rotation: number): Point[] {
  const angle = degToRad(rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(
    // Same maths Three.js uses to rotate around the vertical (y) axis.
    ([x, z]): Point => [cx + x * cos + z * sin, cz - x * sin + z * cos],
  )
}

/** A footprint on the floor: a (rotated) rectangle by its corners, or a circle. */
type Shape = { kind: 'rect'; corners: Point[] } | { kind: 'circle'; center: Point; radius: number }

/** An item's footprint, rotated the same way as the 3D model. */
function footprintShape(item: FurnitureItem): Shape {
  const { round } = getVariant(item.type, item.variant)
  const footprint = itemFootprint(item)
  if (round) return { kind: 'circle', center: item.position, radius: footprint[0] / 2 }
  return { kind: 'rect', corners: rectCorners(item.position, footprint, item.rotation) }
}

const TOLERANCE = 0.02 // 2 cm, so pieces that merely touch don't count

/** Do two footprints overlap (by more than the tolerance)? */
function shapesOverlap(a: Shape, b: Shape): boolean {
  if (a.kind === 'rect' && b.kind === 'rect') return cornersOverlap(a.corners, b.corners)
  if (a.kind === 'circle' && b.kind === 'circle') {
    return Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]) < a.radius + b.radius - TOLERANCE
  }
  const circle = (a.kind === 'circle' ? a : b) as Extract<Shape, { kind: 'circle' }>
  const rect = (a.kind === 'rect' ? a : b) as Extract<Shape, { kind: 'rect' }>
  return circleRectGap(circle, rect.corners) < -TOLERANCE
}

/**
 * Distance from a circle's edge to a rectangle (negative = they overlap by that much).
 * Works in the rectangle's own frame, where it's axis-aligned.
 */
function circleRectGap(circle: { center: Point; radius: number }, corners: Point[]): number {
  const [c0, c1, , c3] = corners
  const ux: Point = [c1[0] - c0[0], c1[1] - c0[1]]
  const uz: Point = [c3[0] - c0[0], c3[1] - c0[1]]
  const lx = Math.hypot(...ux)
  const lz = Math.hypot(...uz)
  const rel: Point = [circle.center[0] - c0[0], circle.center[1] - c0[1]]
  const px = (rel[0] * ux[0] + rel[1] * ux[1]) / lx
  const pz = (rel[0] * uz[0] + rel[1] * uz[1]) / lz
  const dx = Math.max(-px, 0, px - lx)
  const dz = Math.max(-pz, 0, pz - lz)
  // Centre inside the rectangle: overlapping by at least the radius.
  if (dx === 0 && dz === 0) return -circle.radius - Math.min(px, lx - px, pz, lz - pz)
  return Math.hypot(dx, dz) - circle.radius
}

/**
 * Do two footprints overlap? Uses the "separating axis" test: two rectangles
 * do NOT overlap if you can find a direction (one of their edge directions)
 * along which their shadows don't touch.
 */
function cornersOverlap(cornersA: Point[], cornersB: Point[]): boolean {
  for (const corners of [cornersA, cornersB]) {
    for (let i = 0; i < 2; i++) {
      const [x1, z1] = corners[i]
      const [x2, z2] = corners[i + 1]
      const axis: Point = [z1 - z2, x2 - x1] // perpendicular to this edge
      const project = (points: Point[]) => points.map(([x, z]) => x * axis[0] + z * axis[1])
      const pa = project(cornersA)
      const pb = project(cornersB)
      const length = Math.hypot(axis[0], axis[1])
      const gap = Math.max(Math.min(...pb) - Math.max(...pa), Math.min(...pa) - Math.max(...pb)) / length
      if (gap > -TOLERANCE) return false
    }
  }
  return true
}

/** Below this knee space a chair can't be pushed under (e.g. a desk made very low). */
const MIN_SEAT_KNEE = 0.5

/**
 * Is `guest` tucked under `host` in a way that works in real life? The host needs
 * knee space (a desk or table). A low piece (drawer unit, PC, pouf) fits if it's
 * lower than the knee space. A chair may push its seat under as long as its back
 * stays outside: the back strip of its depth (or, for a round swivel chair, the
 * middle of it with the armrests) must not overlap the host.
 */
export function tuckedUnder(guest: FurnitureItem, host: FurnitureItem, hostShape: Shape = footprintShape(host)): boolean {
  const { kneeBelowTop } = FURNITURE_INFO[host.type]
  const { tuck } = FURNITURE_INFO[guest.type]
  if (kneeBelowTop === undefined || !tuck) return false
  const knee = itemHeight(host) - kneeBelowTop
  if (tuck.kind === 'low') return itemHeight(guest) <= knee + 0.005
  if (knee < MIN_SEAT_KNEE) return false
  const { round } = getVariant(guest.type, guest.variant)
  const [w, d] = itemFootprint(guest)
  if (round) return !shapesOverlap({ kind: 'circle', center: guest.position, radius: (w / 2) * (1 - tuck.under) }, hostShape)
  // The back strip: chairs face +z, so their back is at -z (turned with the chair).
  const backDepth = d * (1 - tuck.under)
  const angle = degToRad(guest.rotation)
  const offset = -d / 2 + backDepth / 2
  const center: Point = [guest.position[0] + offset * Math.sin(angle), guest.position[1] + offset * Math.cos(angle)]
  return !shapesOverlap({ kind: 'rect', corners: rectCorners(center, [w, backDepth], guest.rotation) }, hostShape)
}

/**
 * For each item that overlaps something, what it overlaps: other items' ids, and
 * built-in zones as `zone:<label>` (for example "zone:kitchen units").
 */
export function findOverlaps(items: FurnitureItem[], zones: FixedZone[] = []): Map<string, string[]> {
  const overlaps = new Map<string, string[]>()
  const add = (id: string, other: string) => overlaps.set(id, [...(overlaps.get(id) ?? []), other])
  const shapes = items.map(footprintShape)
  const zoneShapes = zones.map((zone): Shape => ({ kind: 'rect', corners: rectCorners(zone.position, zone.size, 0) }))
  for (let i = 0; i < items.length; i++) {
    const onWall = isWallMounted(items[i].type)
    for (let j = i + 1; j < items.length; j++) {
      // Art above a sofa is fine: pieces on the wall only clash with each other.
      if (onWall !== isWallMounted(items[j].type)) continue
      if (!shapesOverlap(shapes[i], shapes[j])) continue
      // A chair or drawer unit tucked under a desk or table is fine.
      if (tuckedUnder(items[i], items[j], shapes[j]) || tuckedUnder(items[j], items[i], shapes[i])) continue
      add(items[i].id, items[j].id)
      add(items[j].id, items[i].id)
    }
    zones.forEach((zone, z) => {
      // Floor pieces clash with built-in units; wall pieces with windows and doors.
      if (onWall === Boolean(zone.onWall) && shapesOverlap(shapes[i], zoneShapes[z])) add(items[i].id, ZONE_PREFIX + zone.label)
    })
  }
  return overlaps
}

/** A readable name for something in an overlap list: a furniture label, or a built-in zone's label. */
export function overlapName(id: string, items: FurnitureItem[]): string {
  if (id.startsWith(ZONE_PREFIX)) return id.slice(ZONE_PREFIX.length)
  const item = items.find((other) => other.id === id)
  return item ? FURNITURE_INFO[item.type].label.toLowerCase() : id
}
