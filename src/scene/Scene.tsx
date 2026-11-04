import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { RoomShell } from './RoomShell'
import { FurnitureLayer } from './FurnitureLayer'
import { DevStats, PERF_ENABLED } from './DevStats'
import { PostEffects } from './PostEffects'
import type { RoomId } from './house'
import type { ViewMode } from './roomConfig'
import type { RoomDesign } from '../state/design'

interface SceneProps {
  view: ViewMode
  resetKey: number
  /** The room on screen. Each room is its own scene: only this one is drawn. */
  room: RoomId
  /** That room's furniture and finishes. */
  design: RoomDesign
  selectedId: string | null
  overlaps: Map<string, string[]>
  onSelect: (id: string | null) => void
  onMove: (id: string, position: [number, number]) => void
  onDragBoundary: () => void
}

/** Every room is centred on the origin, so furniture positions are already world positions. */
const ROOM_ORIGIN: [number, number] = [0, 0]

/** The 3D canvas. Everything inside <Canvas> is Three.js, written as React components. */
export function Scene({ view, resetKey, room, design, selectedId, overlaps, onSelect, onMove, onDragBoundary }: SceneProps) {
  return (
    // `shadows` turns on shadow maps ("percentage" = PCF filtering, the smooth mode in current Three.js).
    // `dpr` keeps it sharp on high-DPI screens without going overboard.
    // `frameloop="demand"` draws a new frame only when something changes (camera move, furniture
    // edit) instead of 60 times a second, so the GPU rests while you're just looking.
    // `onPointerMissed` fires when you click empty space → deselect.
    // `flat` + `antialias: false`: tone mapping and antialiasing happen in PostEffects instead.
    <Canvas shadows="percentage" dpr={[1, 2]} frameloop="demand" flat gl={{ antialias: false }} onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#ebe7e0']} />
      <CameraRig view={view} resetKey={resetKey} room={room} />
      <Lighting room={room} />
      {PERF_ENABLED && <DevStats />}

      {/*
        key={room}: switching rooms swaps the whole room out, so nothing from one room can
        linger in another. Materials and reflection buffers are freed when a room is removed;
        floor textures are cached, so coming back to a room is quick.
      */}
      <group key={room}>
        <RoomShell room={room} finishes={design.finishes} />
        <FurnitureLayer
          items={design.items}
          origin={ROOM_ORIGIN}
          interactive
          selectedId={selectedId}
          overlaps={overlaps}
          onSelect={onSelect}
          onMove={onMove}
          onDragBoundary={onDragBoundary}
        />
      </group>

      <PostEffects view={view} />
    </Canvas>
  )
}
