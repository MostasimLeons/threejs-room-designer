import { useEffect, useState, type ReactNode } from 'react'
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
import { AutoQuality } from './AutoQuality'
import { browserDeviceHints, QUALITY, QualityContext, startingLevel, type QualityLevel, type QualitySetting } from './quality'
import type { CameraViewId } from './cameraViews'
import { resolveRoom, type RoomId, type WallSide } from './house'
import { RoomInfoContext } from './roomContext'
import type { OpeningRef } from './layout'
import { TourCamera } from './TourCamera'
import { RoomDimensions } from './RoomDimensions'
import { selectedOpening } from './layout'
import { UnitContext, type LengthUnit } from '../utils/units'
import { ArSource, ROOM_OBJECT_NAME, type ArTarget } from './ArSource'
import type * as THREE from 'three'
import type { TourShot } from './tour'
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
  /** Clicked a window or door in 3D. */
  onPickOpening: (ref: OpeningRef) => void
  /** Asks for a copy of a piece or the room for AR (a new id = a new copy). */
  arRequest?: { id: number; target: ArTarget } | null
  onArModel?: (model: THREE.Group | null) => void
  /** Units for every length shown in the 3D view. */
  unit: LengthUnit
  /** Show the room's measurements (width, depth, height, windows and doors). */
  showDimensions: boolean
  /** While a video records: draw at this pixel ratio, and keep the quality level fixed. */
  recordingDpr?: number | null
  /** The guided tour's current shot, while the tour plays (it drives the camera). */
  tour?: { shot: TourShot; shotId: number; paused: boolean; onEnd: () => void } | null
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
  /** A smaller picture for the before/after comparison (a new id = a new picture). */
  compareCapture?: { id: number; onCapture: (image: Blob | null) => void } | null
  /** Auto, or a fixed quality level (quality.ts). */
  qualitySetting: QualitySetting
  /** Tells the app which level is in use (for Auto, the one it picked). */
  onQualityLevel: (level: QualityLevel) => void
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
  onPickOpening,
  tour,
  recordingDpr,
  unit,
  showDimensions,
  arRequest,
  onArModel,
  popover,
  cameraViewId,
  editable,
  thumbnailRequest,
  onThumbnail,
  screenshotRequest,
  onScreenshot,
  compareCapture,
  qualitySetting,
  onQualityLevel,
}: SceneProps) {
  // Auto starts from a guess for this device and can only step down from there.
  const [autoLevel, setAutoLevel] = useState<QualityLevel>(() => startingLevel(browserDeviceHints()))
  const level = qualitySetting === 'auto' ? autoLevel : qualitySetting
  const quality = QUALITY[level]
  // The room with its current layout (size, height, openings): shared with everything in the canvas.
  const info = resolveRoom(room, design.layout)
  useEffect(() => onQualityLevel(level), [level, onQualityLevel])

  return (
    // `shadows` turns on shadow maps ("percentage" = PCF filtering, the smooth mode in current Three.js).
    // `dpr` keeps it sharp on high-DPI screens without going overboard (lower on lower quality).
    // `frameloop="demand"` draws a new frame only when something changes (camera move, furniture
    // edit) instead of 60 times a second, so the GPU rests while you're just looking.
    // `onPointerMissed` fires when you click empty space → deselect.
    // `flat` + `antialias: false`: tone mapping and antialiasing happen in PostEffects instead.
    <Canvas
      shadows="percentage"
      dpr={recordingDpr ? recordingDpr : [1, quality.maxDpr]}
      frameloop="demand"
      flat
      gl={{ antialias: false }}
      onPointerMissed={() => onSelect(null)}
    >
      <QualityContext.Provider value={quality}>
        <RoomInfoContext.Provider value={info}>
          <UnitContext.Provider value={unit}>
            {qualitySetting === 'auto' && !recordingDpr && <AutoQuality level={autoLevel} onStepDown={setAutoLevel} />}
            {/* Selection: anything inside a <Select enabled> gets the blue outline (PostEffects). */}
            <Selection>
              <CameraRig view={view} resetKey={resetKey} room={room} cameraViewId={cameraViewId} />
              {tour && view === 'perspective' && tour.shot.room === room && (
                <TourCamera shot={tour.shot} shotId={tour.shotId} paused={tour.paused} onEnd={tour.onEnd} />
              )}
              <RoomThumbnails request={thumbnailRequest} onCapture={onThumbnail} />
              <SceneScreenshot request={screenshotRequest} onCapture={onScreenshot} />
              <ArSource request={arRequest ?? null} onModel={(model) => onArModel?.(model)} />
              <SceneScreenshot request={compareCapture?.id ?? null} onCapture={(image) => compareCapture?.onCapture(image)} longSide={0} />
              {/* Also sets the background colour, which follows the time of day. */}
              <Lighting lighting={design.lighting} />
              {PERF_ENABLED && <DevStats />}

              {/*
        key={room}: switching rooms swaps the whole room out, so nothing from one room can
        linger in another. Materials and reflection buffers are freed when a room is removed;
        floor textures are cached, so coming back to a room is quick.
      */}
              {showDimensions && editable && !tour && <RoomDimensions selected={selectedOpening(selectedId)} />}
              <group key={room} name={ROOM_OBJECT_NAME}>
                <RoomShell
                  room={room}
                  finishes={design.finishes}
                  selectedId={editable ? selectedId : null}
                  onPickWall={editable ? onPickWall : noPick}
                  onPickFloor={editable ? onPickFloor : noPick}
                  onPickOpening={editable ? onPickOpening : noPick}
                />
                <FurnitureLayer
                  items={design.items}
                  origin={ROOM_ORIGIN}
                  room={info}
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
          </UnitContext.Provider>
        </RoomInfoContext.Provider>
      </QualityContext.Provider>
    </Canvas>
  )
}
