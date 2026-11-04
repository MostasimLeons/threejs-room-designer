import { ROOM } from '../roomConfig'
import { clamp, degToRad } from '../../utils/math'

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
}

/** A style or size option for a piece of furniture. */
export interface VariantInfo {
  id: string
  label: string
  detail: string
  /** Width × depth in metres, used for the selection outline and keeping it inside the room. */
  footprint: [number, number]
}

interface FurnitureInfo {
  label: string
  /** Name of the option group shown in the panel, e.g. "Size" or "Style". */
  variantLabel: string
  /** The first one is the default. */
  variants: VariantInfo[]
  /** Which part the colour applies to. */
  colorLabel: string
  swatches: Swatch[]
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

export const FURNITURE_INFO: Record<FurnitureType, FurnitureInfo> = {
  sofa: {
    label: 'Sofa',
    variantLabel: 'Size',
    variants: [
      { id: '3-seat', label: '3-seater', detail: '220 cm', footprint: [2.2, 0.9] },
      { id: '2-seat', label: '2-seater', detail: '160 cm', footprint: [1.6, 0.9] },
      { id: '4-seat', label: '4-seater', detail: '280 cm', footprint: [2.8, 0.9] },
    ],
    colorLabel: 'Fabric',
    swatches: FABRIC_SWATCHES,
  },
  armchair: {
    label: 'Armchair',
    variantLabel: 'Style',
    variants: [
      { id: 'lounge', label: 'Lounge', detail: '92 cm', footprint: [0.92, 0.82] },
      { id: 'armless', label: 'Armless', detail: '70 cm', footprint: [0.7, 0.8] },
    ],
    colorLabel: 'Fabric',
    swatches: FABRIC_SWATCHES,
  },
  coffeeTable: {
    label: 'Coffee table',
    variantLabel: 'Shape',
    variants: [
      { id: 'rectangle', label: 'Rectangle', detail: '120 × 60 cm', footprint: [1.2, 0.6] },
      { id: 'round', label: 'Round', detail: 'Ø 90 cm', footprint: [0.9, 0.9] },
    ],
    colorLabel: 'Wood',
    swatches: WOOD_SWATCHES,
  },
  tvUnit: {
    label: 'TV & media unit',
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
  },
  bed: {
    label: 'Bed',
    variantLabel: 'Size',
    variants: [
      // Footprint = frame + headboard around a 180 × 200 (or 160 × 200) mattress
      { id: 'king', label: 'King', detail: '180 × 200 cm', footprint: [1.9, 2.17] },
      { id: 'queen', label: 'Queen', detail: '160 × 200 cm', footprint: [1.7, 2.17] },
    ],
    colorLabel: 'Upholstery',
    swatches: CREAM_SWATCHES,
  },
  bedsideTable: {
    label: 'Bedside table',
    variantLabel: 'Style',
    variants: [
      { id: 'drawers', label: 'Two drawers', detail: 'with lamp', footprint: [0.5, 0.4] },
      { id: 'shelf', label: 'Drawer + shelf', detail: 'with lamp', footprint: [0.5, 0.4] },
    ],
    colorLabel: 'Wood',
    swatches: OAK_SWATCHES,
  },
  wardrobe: {
    label: 'Sliding wardrobe',
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
    variantLabel: 'Style',
    variants: [
      { id: 'tub', label: 'Tub', detail: '75 cm', footprint: [0.75, 0.75] },
      { id: 'wingback', label: 'Wingback', detail: '75 cm', footprint: [0.75, 0.75] },
    ],
    colorLabel: 'Fabric',
    swatches: CREAM_SWATCHES,
  },
}

/** Looks up a variant, falling back to the default if the id is unknown. */
export function getVariant(type: FurnitureType, variant: string): VariantInfo {
  const { variants } = FURNITURE_INFO[type]
  return variants.find((v) => v.id === variant) ?? variants[0]
}

/** The Living Room's starting arrangement. "Reset" returns to this. */
export const DEFAULT_LAYOUT: FurnitureItem[] = [
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
export const DEFAULT_BEDROOM_LAYOUT: FurnitureItem[] = [
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
 * Keeps a piece of furniture inside the room walls. A rotated object takes up
 * a different amount of space along x and z, so the rotation is included.
 */
export function clampToRoom(
  item: Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'rotation'>,
  /** Room size; defaults to the Living Room. */
  room: { width: number; depth: number } = ROOM,
): [number, number] {
  const [w, d] = getVariant(item.type, item.variant).footprint
  const angle = degToRad(item.rotation)
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  const halfX = (cos * w + sin * d) / 2
  const halfZ = (sin * w + cos * d) / 2
  const maxX = room.width / 2 - halfX
  const maxZ = room.depth / 2 - halfZ
  return [clamp(item.position[0], -maxX, maxX), clamp(item.position[1], -maxZ, maxZ)]
}

type Point = [number, number]

/** The four floor corners of an item's footprint, rotated the same way as the 3D model. */
function footprintCorners(item: FurnitureItem): Point[] {
  const [w, d] = getVariant(item.type, item.variant).footprint
  const angle = degToRad(item.rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const [cx, cz] = item.position
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(
    // Same maths Three.js uses to rotate around the vertical (y) axis.
    ([x, z]): Point => [cx + x * cos + z * sin, cz - x * sin + z * cos],
  )
}

/**
 * Do two footprints overlap? Uses the "separating axis" test: two rectangles
 * do NOT overlap if you can find a direction (one of their edge directions)
 * along which their shadows don't touch.
 */
function footprintsOverlap(a: FurnitureItem, b: FurnitureItem): boolean {
  const TOLERANCE = 0.02 // 2 cm, so pieces that merely touch don't count
  const cornersA = footprintCorners(a)
  const cornersB = footprintCorners(b)
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

/** For each item that overlaps another, the ids of the items it overlaps. */
export function findOverlaps(items: FurnitureItem[]): Map<string, string[]> {
  const overlaps = new Map<string, string[]>()
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!footprintsOverlap(items[i], items[j])) continue
      overlaps.set(items[i].id, [...(overlaps.get(items[i].id) ?? []), items[j].id])
      overlaps.set(items[j].id, [...(overlaps.get(items[j].id) ?? []), items[i].id])
    }
  }
  return overlaps
}
