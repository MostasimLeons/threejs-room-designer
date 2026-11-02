import { ROOM } from '../roomConfig'

export type FurnitureType = 'sofa' | 'armchair' | 'coffeeTable' | 'tvUnit' | 'plant' | 'floorLamp'

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
  swatches: string[]
}

const FABRIC_SWATCHES = ['#f1eee8', '#d9cbb3', '#8e9c80', '#5d6b7a', '#3a3a3c', '#b5654a']
const WOOD_SWATCHES = ['#c49a6c', '#e0c49c', '#8a5a3b', '#4a3426', '#f2f0eb', '#2a2a2c']

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
    swatches: ['#6e4b33', '#c49a6c', '#f2f0eb', '#2a2a2c', '#7d8b74', '#41556b'],
  },
  plant: {
    label: 'Indoor plant',
    variantLabel: 'Size',
    variants: [
      { id: 'large', label: 'Large', detail: '130 cm', footprint: [0.6, 0.6] },
      { id: 'small', label: 'Small', detail: '85 cm', footprint: [0.4, 0.4] },
    ],
    colorLabel: 'Pot',
    swatches: ['#b86f50', '#ecebe6', '#2a2a2c', '#7d8b74', '#c9b393', '#41556b'],
  },
  floorLamp: {
    label: 'Floor lamp',
    variantLabel: 'Shade',
    variants: [
      { id: 'tapered', label: 'Tapered', detail: '150 cm', footprint: [0.46, 0.46] },
      { id: 'drum', label: 'Drum', detail: '150 cm', footprint: [0.46, 0.46] },
    ],
    colorLabel: 'Shade',
    swatches: ['#f6eedd', '#e9d3b0', '#c9d6c2', '#e3cccc', '#c7d2de', '#ffffff'],
  },
}

/** Looks up a variant, falling back to the default if the id is unknown. */
export function getVariant(type: FurnitureType, variant: string): VariantInfo {
  const { variants } = FURNITURE_INFO[type]
  return variants.find((v) => v.id === variant) ?? variants[0]
}

/** The starting arrangement. "Reset" returns to this. */
export const DEFAULT_LAYOUT: FurnitureItem[] = [
  { id: 'sofa', type: 'sofa', variant: '3-seat', position: [0.3, -2.5], rotation: 0, color: '#f1eee8' },
  { id: 'coffee-table', type: 'coffeeTable', variant: 'rectangle', position: [0.3, -1.15], rotation: 0, color: '#c49a6c' },
  { id: 'armchair', type: 'armchair', variant: 'lounge', position: [2.2, -0.5], rotation: 250, color: '#f1eee8' },
  { id: 'tv', type: 'tvUnit', variant: '55', position: [-3.27, -0.9], rotation: 90, color: '#6e4b33' },
  { id: 'plant', type: 'plant', variant: 'large', position: [-3.05, -2.55], rotation: 0, color: '#b86f50' },
  { id: 'lamp', type: 'floorLamp', variant: 'tapered', position: [1.8, -2.6], rotation: 0, color: '#f6eedd' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Keeps a piece of furniture inside the room walls. A rotated object takes up
 * a different amount of space along x and z, so the rotation is included.
 */
export function clampToRoom(item: Pick<FurnitureItem, 'type' | 'variant' | 'position' | 'rotation'>): [number, number] {
  const [w, d] = getVariant(item.type, item.variant).footprint
  const angle = (item.rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  const halfX = (cos * w + sin * d) / 2
  const halfZ = (sin * w + cos * d) / 2
  const maxX = ROOM.width / 2 - halfX
  const maxZ = ROOM.depth / 2 - halfZ
  return [clamp(item.position[0], -maxX, maxX), clamp(item.position[1], -maxZ, maxZ)]
}
