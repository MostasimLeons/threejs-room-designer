import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Selection } from '@react-three/postprocessing'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { RoomShell } from './RoomShell'
import { FurnitureLayer } from './FurnitureLayer'
import { DevStats, PERF_ENABLED } from './DevStats'
import { PostEffects } from './PostEffects'
import { RoomThumbnails } from './RoomThumbnails'
import { SceneScreenshot } from './SceneScreenshot'
import type { CameraViewId } from './cameraViews'
import { ROOMS, type RoomId, type WallSide } from './house'
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
  /** Turning a piece with the rotate ring (degrees). */
  onRotate: (id: string, rotation: number) => void
  onDragBoundary: () => void
  /** Clicked a wall / the floor in 3D (the point is where, in room coordinates). */
  onPickWall: (side: WallSide, point: [number, number, number]) => void
  onPickFloor: (point: [number, number, number]) => void
  /** Which camera view (Overview / Eye level / Corner) the Perspective camera shows. */
  cameraViewId: CameraViewId
  /** False in showcase mode: nothing can be selected, moved or painted. */
  editable: boolean
  /** Ask for a thumbnail of the room on screen (a new id = a new picture). */
  thumbnailRequest: { room: RoomId; id: number } | null
  onThumbnail: (room: RoomId, url: string) => void
  /** Ask for a high-resolution picture (a new id = a new picture). */
  screenshotRequest: number | null
  onScreenshot: (image: Blob | null) => void
  /** A small panel shown in the 3D view, pinned to a point (the wall or floor picker). */
  popover?: { point: [number, number, number]; content: ReactNode } | null
}

/** In showcase mode walls and the floor ignore clicks. */
const noPick = () => {}

/** Every room is centred on the origin, so furniture positions are already world positions. */
const ROOM_ORIGIN: [number, number] = [0, 0]

/** The 3D canvas. Everything inside <Canvas> is Three.js, written as React components. */
export function Scene({
  view,
  resetKey,
  room,
  design,
  selectedId,
  overlaps,
  onSelect,
  onMove,
  onRotate,
  onDragBoundary,
  onPickWall,
  onPickFloor,
  popover,
  cameraViewId,
  editable,
  thumbnailRequest,
  onThumbnail,
  screenshotRequest,
  onScreenshot,
}: SceneProps) {
  return (
    // `shadows` turns on shadow maps ("percentage" = PCF filtering, the smooth mode in current Three.js).
    // `dpr` keeps it sharp on high-DPI screens without going overboard.
    // `frameloop="demand"` draws a new frame only when something changes (camera move, furniture
    // edit) instead of 60 times a second, so the GPU rests while you're just looking.
    // `onPointerMissed` fires when you click empty space → deselect.
    // `flat` + `antialias: false`: tone mapping and antialiasing happen in PostEffects instead.
    <Canvas shadows="percentage" dpr={[1, 2]} frameloop="demand" flat gl={{ antialias: false }} onPointerMissed={() => onSelect(null)}>
      {/* Selection: anything inside a <Select enabled> gets the blue outline (PostEffects). */}
      <Selection>
        <CameraRig view={view} resetKey={resetKey} room={room} cameraViewId={cameraViewId} />
        <RoomThumbnails request={thumbnailRequest} onCapture={onThumbnail} />
        <SceneScreenshot request={screenshotRequest} onCapture={onScreenshot} />
        {/* Also sets the background colour, which follows the time of day. */}
        <Lighting room={room} lighting={design.lighting} />
        {PERF_ENABLED && <DevStats />}

        {/*
        key={room}: switching rooms swaps the whole room out, so nothing from one room can
        linger in another. Materials and reflection buffers are freed when a room is removed;
        floor textures are cached, so coming back to a room is quick.
      */}
        <group key={room}>
          <RoomShell
            room={room}
            finishes={design.finishes}
            selectedId={editable ? selectedId : null}
            onPickWall={editable ? onPickWall : noPick}
            onPickFloor={editable ? onPickFloor : noPick}
          />
          <FurnitureLayer
            items={design.items}
            origin={ROOM_ORIGIN}
            room={ROOMS[room]}
            interactive={editable}
            selectedId={editable ? selectedId : null}
            overlaps={overlaps}
            onSelect={onSelect}
            onMove={onMove}
            onRotate={onRotate}
            onDragBoundary={onDragBoundary}
          />
        </group>

        {popover && (
          // Pinned to the clicked point; follows it as the camera moves. `zIndexRange` keeps
          // it under the app's own overlays (room bar, dialogs).
          <Html key={popover.point.join(',')} position={popover.point} zIndexRange={[3, 0]} className="surface-popover-anchor">
            {popover.content}
          </Html>
        )}

        <PostEffects view={view} />
      </Selection>
    </Canvas>
  )
}
