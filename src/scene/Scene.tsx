import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { Room } from './Room'
import { FurnitureLayer } from './FurnitureLayer'
import type { ViewMode } from './roomConfig'
import type { FurnitureItem } from './furniture/catalog'
import type { RoomFinishes } from './finishes'

interface SceneProps {
  view: ViewMode
  resetKey: number
  items: FurnitureItem[]
  finishes: RoomFinishes
  selectedId: string | null
  overlaps: Map<string, string[]>
  onSelect: (id: string | null) => void
  onMove: (id: string, position: [number, number]) => void
  onDragBoundary: () => void
}

/** The 3D canvas. Everything inside <Canvas> is Three.js, written as React components. */
export function Scene({ view, resetKey, items, finishes, selectedId, overlaps, onSelect, onMove, onDragBoundary }: SceneProps) {
  return (
    // `shadows` turns on shadow maps ("percentage" = PCF filtering, the smooth mode in current Three.js).
    // `dpr` keeps it sharp on high-DPI screens without going overboard.
    // `frameloop="demand"` draws a new frame only when something changes (camera move, furniture
    // edit) instead of 60 times a second, so the GPU rests while you're just looking.
    // `onPointerMissed` fires when you click empty space → deselect.
    <Canvas shadows="percentage" dpr={[1, 2]} frameloop="demand" onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#ebe7e0']} />
      <CameraRig view={view} resetKey={resetKey} />
      <Lighting />
      {/* Floor, walls, window and door, in the chosen finishes */}
      <Room finishes={finishes} />

      {/* Movable furniture, driven by the layout data in App */}
      <FurnitureLayer items={items} selectedId={selectedId} overlaps={overlaps} onSelect={onSelect} onMove={onMove} onDragBoundary={onDragBoundary} />
    </Canvas>
  )
}
