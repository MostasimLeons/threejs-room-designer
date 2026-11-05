import { memo } from 'react'
import { getVariant, type FurnitureType } from './catalog'
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
import { BathroomCabinet, Bookshelf, ChestOfDrawers, Desk, SideTable } from './TablesAndStorage'

interface ModelChoice {
  type: FurnitureType
  variant: string
  color: string
  /** Legs / frame finish (frames.ts); only the code-built models use it. */
  frame?: FrameId
}

/**
 * Picks the 3D model for a piece of furniture: a real model (GLB) where one exists
 * for that option (see models.ts), with the code-built model shown while it
 * downloads; otherwise the code-built model.
 * `memo` = only re-build the model when its type, variant or colour changes.
 * Moving or rotating happens on the parent group, so dragging one piece no
 * longer re-builds every model in the room on each mouse move.
 */
export const FurnitureModel = memo(function FurnitureModel({ type, variant, color, frame }: ModelChoice) {
  const spec = modelFor(type, variant)
  const code = <CodeModel type={type} variant={variant} color={color} frame={frame} />
  if (!spec) return code
  return <GltfFurniture spec={spec} footprint={getVariant(type, variant).footprint} color={color} fallback={code} />
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
  }
}
