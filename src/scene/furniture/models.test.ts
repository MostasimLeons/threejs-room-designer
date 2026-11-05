import { describe, expect, it } from 'vitest'
import { FURNITURE_INFO, type FurnitureType } from './catalog'
import { allModelUrls, fitModel, MODELS, type ModelSpec } from './models'

const box = { size: [2, 1, 0.5] as [number, number, number], center: [0.1, 0.5, -0.2] as [number, number, number], minY: 0.02 }
const spec = (fit: ModelSpec['fit'], extra: Partial<ModelSpec> = {}): ModelSpec => ({ url: 'x.glb', tint: [], fit, ...extra })

describe('fitModel', () => {
  it("'fit' scales evenly so the model fits inside the footprint", () => {
    const { scale } = fitModel(box, [1, 1], spec('fit'))
    expect(scale).toEqual([0.5, 0.5, 0.5]) // limited by the 2 m width
  })

  it("'fit' respects the spread allowance and the height limit", () => {
    expect(fitModel(box, [1, 1], spec('fit', { spread: 1.4 })).scale[0]).toBeCloseTo(0.7)
    expect(fitModel(box, [10, 10], spec('fit', { maxHeight: 0.8 })).scale[1]).toBeCloseTo(0.8)
  })

  it("'stretch' matches width and depth exactly and keeps the real height", () => {
    const { scale } = fitModel(box, [1.6, 0.45], spec('stretch'))
    expect(scale[0]).toBeCloseTo(0.8)
    expect(scale[1]).toBe(1)
    expect(scale[2]).toBeCloseTo(0.9)
  })

  it('centres the model on its footprint and stands it on the floor', () => {
    const { scale, position } = fitModel(box, [1, 1], spec('fit'))
    expect(position[0]).toBeCloseTo(-box.center[0] * scale[0])
    expect(position[1]).toBeCloseTo(-box.minY * scale[1])
    expect(position[2]).toBeCloseTo(-box.center[2] * scale[2])
  })
})

describe('model registry', () => {
  it('every model file exists in public/models/', () => {
    // Vite lists the files that are really there (sizes are reported by `npm run models`).
    const files = Object.keys(import.meta.glob('/public/models/*.glb')).map((path) => path.replace('/public', ''))
    for (const url of allModelUrls()) expect(files).toContain(url)
  })

  it('every model belongs to a furniture option that exists', () => {
    for (const [type, variants] of Object.entries(MODELS)) {
      const ids = FURNITURE_INFO[type as FurnitureType].variants.map((v) => v.id)
      for (const variant of Object.keys(variants ?? {})) expect(ids).toContain(variant)
    }
  })
})
