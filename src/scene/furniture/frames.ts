import * as THREE from 'three'
import { materials } from '../materials'

/**
 * Second finish for a piece: its legs, frame, base or handles (the main colour is
 * the fabric or wood). Pieces that offer it list their choices in the catalog
 * (`frame` in FURNITURE_INFO). A piece without a frame finish keeps its standard
 * look, so designs saved before Phase 11 look exactly the same.
 */
export type FrameId = 'oak' | 'walnut' | 'white' | 'black' | 'brass' | 'chrome'

export interface FrameFinish {
  id: FrameId
  name: string
  /** Colour of the little swatch in the panel. */
  swatch: string
}

export const FRAME_FINISHES: Record<FrameId, FrameFinish> = {
  oak: { id: 'oak', name: 'Oak', swatch: '#c49a6c' },
  walnut: { id: 'walnut', name: 'Walnut', swatch: '#5b3b29' },
  white: { id: 'white', name: 'White', swatch: '#f2f0eb' },
  black: { id: 'black', name: 'Black metal', swatch: '#1f1f22' },
  brass: { id: 'brass', name: 'Brass', swatch: '#b8925a' },
  chrome: { id: 'chrome', name: 'Chrome', swatch: '#d9dcdf' },
}

export const FRAME_IDS = Object.keys(FRAME_FINISHES) as FrameId[]

const matteWhite = new THREE.MeshStandardMaterial({ color: '#f2f0eb', roughness: 0.45 })

/** The shared material for each finish (shared, so it costs nothing per piece). */
const FRAME_MATERIALS: Record<FrameId, THREE.Material> = {
  oak: materials.woodLight,
  walnut: materials.woodDark,
  white: matteWhite,
  black: materials.metalBlack,
  brass: materials.brass,
  chrome: materials.chrome,
}

/** The material for a piece's frame: the chosen finish, or the piece's standard one. */
export function frameMaterial(frame: FrameId | undefined, standard: THREE.Material): THREE.Material {
  return frame ? FRAME_MATERIALS[frame] : standard
}
