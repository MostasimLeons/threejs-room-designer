import { createContext, useContext } from 'react'
import { getVariant, type FurnitureType } from './catalog'

/**
 * A custom width × depth (Phase 15) for the model being drawn. Models that build
 * themselves from their footprint read it through `useFootprint`, so a wider desk
 * gets a longer top with legs of the same thickness instead of a stretched one.
 */
export const FootprintContext = createContext<[number, number] | null>(null)

/** The footprint to build this model at: the custom one if set, otherwise the option's. */
export function useFootprint(type: FurnitureType, variant: string): [number, number] {
  return useContext(FootprintContext) ?? getVariant(type, variant).footprint
}
