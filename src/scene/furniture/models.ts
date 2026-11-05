import type { FurnitureType } from './catalog'

/**
 * Real 3D models (GLB files in public/models/) for some furniture options.
 * Anything not listed here keeps its code-built model, which is also what you see
 * while a model downloads, and if a model ever fails to load.
 *
 * The models are CC0 from Poly Haven (https://polyhaven.com), optimised by
 * scripts/optimize-models.mjs (`npm run models`).
 */
export interface ModelSpec {
  url: string
  /** Material names the colour swatch applies to. Empty: the model keeps its own finish. */
  tint: string[]
  /** Turn the model (degrees) so its front faces +z, like the code-built models. */
  rotation?: number
  /**
   * How it's sized to the option's footprint:
   * - 'fit': one scale for all axes, as big as fits the footprint (× `spread`) and `maxHeight`
   * - 'stretch': width and depth stretched to the footprint, height kept real (or `maxHeight`)
   */
  fit: 'fit' | 'stretch'
  /** Footprint allowance for 'fit', e.g. leaves may spread a bit past the pot. Default 1. */
  spread?: number
  /** Tallest it may be, in metres. */
  maxHeight?: number
}

const base = `${import.meta.env.BASE_URL}models/`

export const MODELS: Partial<Record<FurnitureType, Partial<Record<string, ModelSpec>>>> = {
  plant: {
    large: { url: `${base}plant-large.glb`, tint: ['potted_plant_01_pot'], fit: 'fit', spread: 1.4, maxHeight: 1.3 },
    small: { url: `${base}plant-small.glb`, tint: ['potted_plant_02_pot'], fit: 'fit', spread: 1.4, maxHeight: 0.85 },
  },
  coffeeTable: {
    rectangle: { url: `${base}coffee-table-rectangle.glb`, tint: [], rotation: 90, fit: 'fit' },
    round: { url: `${base}coffee-table-round.glb`, tint: [], fit: 'fit' },
    square: { url: `${base}coffee-table-square.glb`, tint: [], fit: 'fit' },
  },
  sideboard: {
    '160': { url: `${base}sideboard.glb`, tint: ['modern_wooden_cabinet'], fit: 'stretch' },
    '200': { url: `${base}sideboard.glb`, tint: ['modern_wooden_cabinet'], fit: 'stretch' },
  },
  armchair: {
    lounge: { url: `${base}armchair-lounge.glb`, tint: ['modern_arm_chair_01_pillow'], fit: 'fit' },
  },
  accentChair: {
    lounge: { url: `${base}accent-chair-lounge.glb`, tint: [], fit: 'fit' },
  },
  // Phase 10
  diningChair: {
    leather: { url: `${base}dining-chair-leather.glb`, tint: [], fit: 'fit' },
  },
  sideTable: {
    wood: { url: `${base}side-table.glb`, tint: [], fit: 'fit' },
  },
  ottoman: {
    leather: { url: `${base}ottoman.glb`, tint: [], fit: 'fit' },
  },
  chestOfDrawers: {
    tall: { url: `${base}chest-tall.glb`, tint: [], fit: 'fit' },
  },
  bookshelf: {
    // Real shelving is 235 × 72 cm; stretched to 200 × 45 so it fits against a wall.
    wide: { url: `${base}shelving-wide.glb`, tint: [], fit: 'stretch', maxHeight: 2.1 },
  },
}

export function modelFor(type: FurnitureType, variant: string): ModelSpec | undefined {
  return MODELS[type]?.[variant]
}

/** Every model file, once each (for preloading). */
export function allModelUrls(): string[] {
  const urls = Object.values(MODELS).flatMap((variants) => Object.values(variants ?? {}).map((spec) => spec!.url))
  return [...new Set(urls)]
}

type Vec3 = [number, number, number]

export interface ModelBox {
  /** Size along x, y, z after the model's own rotation. */
  size: Vec3
  /** Centre along x, y, z after rotation. */
  center: Vec3
  /** Lowest point (y). */
  minY: number
}

/**
 * Scale and offset that put a model on the floor, centred on its footprint, at
 * the size the option asks for. Pure maths, so it's unit-tested.
 */
export function fitModel(box: ModelBox, footprint: [number, number], spec: ModelSpec): { scale: Vec3; position: Vec3 } {
  const [sx, sy, sz] = box.size.map((v) => Math.max(v, 1e-6)) as Vec3
  const [fw, fd] = footprint
  let scale: Vec3
  if (spec.fit === 'stretch') {
    const height = spec.maxHeight ? Math.min(1, spec.maxHeight / sy) : 1
    scale = [fw / sx, height, fd / sz]
  } else {
    const spread = spec.spread ?? 1
    let s = Math.min((fw * spread) / sx, (fd * spread) / sz)
    if (spec.maxHeight) s = Math.min(s, spec.maxHeight / sy)
    scale = [s, s, s]
  }
  const [cx, , cz] = box.center
  return { scale, position: [-cx * scale[0], -box.minY * scale[1], -cz * scale[2]] }
}
