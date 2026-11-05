import { memo } from 'react'
import { getVariant, isWallMounted, type FurnitureType } from './catalog'
import { FootprintContext } from './footprintContext'
import { standardSize } from './sizes'
import { modelFor } from './models'
import { GltfFurniture } from './GltfModel'
import type { FrameId } from './frames'
import { Sofa } from './Sofa'
import { Armchair } from './Armchair'
import { CoffeeTable } from './CoffeeTable'
import { TvUnit } from './TvUnit'
import { Plant } from './Plant'
import { FloorLamp } from './FloorLamp'
import { Bed } from './Bed'
import { BedsideTable } from './BedsideTable'
import { Wardrobe } from './Wardrobe'
import { DressingTable } from './DressingTable'
import { AccentChair } from './AccentChair'
import { DiningTable } from './DiningTable'
import { DiningChair } from './DiningChair'
import { Sideboard } from './Sideboard'
import { KitchenIsland } from './KitchenIsland'
import { BarStool } from './BarStool'
import { Fridge } from './Fridge'
import { Bathtub } from './Bathtub'
import { Vanity } from './Vanity'
import { TowelRail } from './TowelRail'
import { CornerSofa } from './CornerSofa'
import { WallArt, WallMirror, WallShelf } from './WallDecor'
import { Bench, DeskChair, Ottoman } from './Seating'
import { DrawerUnit, PcTower } from './UnderDesk'
import { BathroomCabinet, Bookshelf, ChestOfDrawers, Desk, SideTable } from './TablesAndStorage'

interface ModelChoice {
  type: FurnitureType
  variant: string
  color: string
  /** Legs / frame finish (frames.ts); only the code-built models use it. */
  frame?: FrameId
  /** Custom width × depth × height in metres (Phase 15); missing = the option's size. */
  size?: [number, number, number]
}

/**
 * Code-built models that build themselves from their footprint: at a custom size
 * they're rebuilt at the new width (and depth), so legs, handles and frames keep
 * their real thickness. Only the height is scaled. 'w' = only the width is built
 * (the depth is scaled). Everything else, real (GLB) models included, is scaled.
 */
const BUILT_TO_SIZE: Partial<Record<FurnitureType, 'wd' | 'w'>> = {
  bed: 'wd',
  cornerSofa: 'wd',
  diningTable: 'wd',
  dressingTable: 'wd',
  fridge: 'wd',
  kitchenIsland: 'wd',
  bench: 'wd',
  sideboard: 'wd',
  sofa: 'w',
  desk: 'wd',
  bookshelf: 'wd',
  chestOfDrawers: 'wd',
  bathroomCabinet: 'wd',
  vanity: 'wd',
  wallArt: 'wd',
  wallMirror: 'wd',
  wallShelf: 'wd',
  wardrobe: 'wd',
}

/** Options whose shape is fixed in the code (they don't read their footprint), so they're scaled. */
const SCALED_OPTIONS = new Set(['diningTable:round', 'wallArt:gallery'])

/** Height of the middle of a piece hung on a wall: its height is scaled around this, so it stays on the wall. */
function hangCentre(type: FurnitureType, variant: string): number {
  if (type === 'wallMirror' && getVariant(type, variant).id === 'tall') return 1.15
  return type === 'wallShelf' ? 1.47 : 1.5
}

/**
 * Picks the 3D model for a piece of furniture: a real model (GLB) where one exists
 * for that option (see models.ts), with the code-built model shown while it
 * downloads; otherwise the code-built model.
 * `memo` = only re-build the model when its type, variant or colour changes.
 * Moving or rotating happens on the parent group, so dragging one piece no
 * longer re-builds every model in the room on each mouse move.
 */
export const FurnitureModel = memo(function FurnitureModel({ type, variant, color, frame, size }: ModelChoice) {
  const spec = modelFor(type, variant)
  const code = <CodeModel type={type} variant={variant} color={color} frame={frame} />
  const model = spec ? <GltfFurniture spec={spec} footprint={getVariant(type, variant).footprint} color={color} fallback={code} /> : code
  if (!size) return model

  // A custom size: rebuild what can be rebuilt, scale the rest.
  const [w0, d0, h0] = standardSize(type, variant)
  const built = spec || SCALED_OPTIONS.has(`${type}:${getVariant(type, variant).id}`) ? undefined : BUILT_TO_SIZE[type]
  const scale: [number, number, number] = [built ? 1 : size[0] / w0, size[2] / h0, built === 'wd' ? 1 : size[1] / d0]
  const footprint: [number, number] | null = built ? [size[0], built === 'wd' ? size[1] : d0] : null
  // Pieces on a wall grow up and down around their middle, not from the floor.
  const pivot = isWallMounted(type) ? hangCentre(type, variant) : 0
  return (
    <FootprintContext.Provider value={footprint}>
      <group position={[0, pivot * (1 - scale[1]), 0]} scale={scale}>
        {model}
      </group>
    </FootprintContext.Provider>
  )
})

/** The code-built model for each furniture type (see the files next to this one). */
function CodeModel({ type, variant, color, frame }: ModelChoice) {
  switch (type) {
    case 'sofa':
      return <Sofa color={color} variant={variant} frame={frame} />
    case 'armchair':
      return <Armchair color={color} variant={variant} frame={frame} />
    case 'coffeeTable':
      return <CoffeeTable color={color} variant={variant} frame={frame} />
    case 'tvUnit':
      return <TvUnit color={color} variant={variant} frame={frame} />
    case 'plant':
      return <Plant color={color} variant={variant} frame={frame} />
    case 'floorLamp':
      return <FloorLamp color={color} variant={variant} frame={frame} />
    case 'bed':
      return <Bed color={color} variant={variant} frame={frame} />
    case 'bedsideTable':
      return <BedsideTable color={color} variant={variant} frame={frame} />
    case 'wardrobe':
      return <Wardrobe color={color} variant={variant} frame={frame} />
    case 'dressingTable':
      return <DressingTable color={color} variant={variant} frame={frame} />
    case 'accentChair':
      return <AccentChair color={color} variant={variant} frame={frame} />
    case 'diningTable':
      return <DiningTable color={color} variant={variant} frame={frame} />
    case 'diningChair':
      return <DiningChair color={color} variant={variant} frame={frame} />
    case 'sideboard':
      return <Sideboard color={color} variant={variant} frame={frame} />
    case 'kitchenIsland':
      return <KitchenIsland color={color} variant={variant} frame={frame} />
    case 'barStool':
      return <BarStool color={color} variant={variant} frame={frame} />
    case 'fridge':
      return <Fridge color={color} variant={variant} frame={frame} />
    case 'bathtub':
      return <Bathtub color={color} variant={variant} frame={frame} />
    case 'vanity':
      return <Vanity color={color} variant={variant} frame={frame} />
    case 'towelRail':
      return <TowelRail color={color} variant={variant} frame={frame} />
    case 'cornerSofa':
      return <CornerSofa color={color} variant={variant} frame={frame} />
    case 'ottoman':
      return <Ottoman color={color} variant={variant} frame={frame} />
    case 'sideTable':
      return <SideTable color={color} variant={variant} frame={frame} />
    case 'desk':
      return <Desk color={color} variant={variant} frame={frame} />
    case 'deskChair':
      return <DeskChair color={color} variant={variant} frame={frame} />
    case 'bench':
      return <Bench color={color} variant={variant} frame={frame} />
    case 'bookshelf':
      return <Bookshelf color={color} variant={variant} frame={frame} />
    case 'chestOfDrawers':
      return <ChestOfDrawers color={color} variant={variant} frame={frame} />
    case 'bathroomCabinet':
      return <BathroomCabinet color={color} variant={variant} frame={frame} />
    case 'wallArt':
      return <WallArt color={color} variant={variant} frame={frame} />
    case 'wallMirror':
      return <WallMirror color={color} variant={variant} frame={frame} />
    case 'wallShelf':
      return <WallShelf color={color} variant={variant} frame={frame} />
    case 'drawerUnit':
      return <DrawerUnit color={color} variant={variant} frame={frame} />
    case 'pcTower':
      return <PcTower color={color} variant={variant} frame={frame} />
  }
}
