import { memo } from 'react'
import type { FurnitureType } from './catalog'
import { Sofa } from './Sofa'
import { Armchair } from './Armchair'
import { CoffeeTable } from './CoffeeTable'
import { TvUnit } from './TvUnit'
import { Plant } from './Plant'
import { FloorLamp } from './FloorLamp'

/**
 * Picks the right 3D model for a furniture type.
 * `memo` = only re-build the model when its type, variant or colour changes.
 * Moving or rotating happens on the parent group, so dragging one piece no
 * longer re-builds every model in the room on each mouse move.
 */
export const FurnitureModel = memo(function FurnitureModel({ type, variant, color }: { type: FurnitureType; variant: string; color: string }) {
  switch (type) {
    case 'sofa':
      return <Sofa color={color} variant={variant} />
    case 'armchair':
      return <Armchair color={color} variant={variant} />
    case 'coffeeTable':
      return <CoffeeTable color={color} variant={variant} />
    case 'tvUnit':
      return <TvUnit color={color} variant={variant} />
    case 'plant':
      return <Plant color={color} variant={variant} />
    case 'floorLamp':
      return <FloorLamp color={color} variant={variant} />
  }
})
