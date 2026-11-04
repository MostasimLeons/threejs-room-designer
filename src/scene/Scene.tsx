import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { Room } from './Room'
import { BedroomShell, SharedWall } from './Bedroom'
import { FurnitureLayer } from './FurnitureLayer'
import { DevStats, PERF_ENABLED } from './DevStats'
import { ROOM_IDS, ROOMS, type RoomId } from './house'
import type { ViewMode } from './roomConfig'
import type { HouseDesign } from '../state/design'

interface SceneProps {
  view: ViewMode
  resetKey: number
  /** The room being edited: the camera frames it and only its furniture is clickable. */
  activeRoom: RoomId
  /** Both rooms' furniture and finishes; the whole house is always drawn. */
  house: HouseDesign
  selectedId: string | null
  overlaps: Map<string, string[]>
  onSelect: (id: string | null) => void
  onMove: (id: string, position: [number, number]) => void
  onDragBoundary: () => void
}

const NO_OVERLAPS = new Map<string, string[]>()

/** The 3D canvas. Everything inside <Canvas> is Three.js, written as React components. */
export function Scene({ view, resetKey, activeRoom, house, selectedId, overlaps, onSelect, onMove, onDragBoundary }: SceneProps) {
  return (
    // `shadows` turns on shadow maps ("percentage" = PCF filtering, the smooth mode in current Three.js).
    // `dpr` keeps it sharp on high-DPI screens without going overboard.
    // `frameloop="demand"` draws a new frame only when something changes (camera move, furniture
    // edit) instead of 60 times a second, so the GPU rests while you're just looking.
    // `onPointerMissed` fires when you click empty space → deselect.
    <Canvas shadows="percentage" dpr={[1, 2]} frameloop="demand" onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#ebe7e0']} />
      <CameraRig view={view} resetKey={resetKey} room={activeRoom} />
      <Lighting room={activeRoom} />
      {PERF_ENABLED && <DevStats />}

      {/* Living Room: floor, walls, window and front door (unchanged) */}
      <Room finishes={house.living.finishes} />
      {/* Wall between the rooms, with the connecting door */}
      <SharedWall
        livingWallColor={house.living.finishes.wallColor}
        bedroomWallColor={house.bedroom.finishes.wallColor}
        activeRoom={activeRoom}
      />
      {/* Bedroom: floor, walls, curtained window, slat accent wall, carpet */}
      <BedroomShell finishes={house.bedroom.finishes} />

      {/* Movable furniture for each room, placed relative to that room's centre */}
      {ROOM_IDS.map((room) => (
        <FurnitureLayer
          key={room}
          items={house[room].items}
          origin={ROOMS[room].center}
          interactive={room === activeRoom}
          selectedId={room === activeRoom ? selectedId : null}
          overlaps={room === activeRoom ? overlaps : NO_OVERLAPS}
          onSelect={onSelect}
          onMove={onMove}
          onDragBoundary={onDragBoundary}
        />
      ))}
    </Canvas>
  )
}
