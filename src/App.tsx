import { useEffect, useMemo, useRef, useState } from 'react'
import { Scene } from './scene/Scene'
import type { ViewMode } from './scene/roomConfig'
import { FURNITURE_INFO, findOverlaps, isAllowedIn, overlapName, type FurnitureItem, type FurnitureType } from './scene/furniture/catalog'
import { findFreeSpot } from './scene/furniture/placement'
import { createId } from './utils/id'
import { downloadBlob } from './utils/download'
import { decodeShare, shareCodeFromHash } from './state/share'
import { CatalogDrawer, catalogFor } from './components/CatalogDrawer'
import { CatalogThumbnailRenderer } from './scene/CatalogThumbnailRenderer'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { ViewToggle } from './components/ViewToggle'
import { RoomBar } from './components/RoomBar'
import { TimeOfDayPanel } from './components/TimeOfDayPanel'
import { FloorPopover, WallPopover } from './components/SurfacePopover'
import { FLOOR_SELECTION, selectedWall, wallLabel, wallSelection } from './scene/selection'
import { setAllWalls, setWallFinish, wallFinishOf } from './scene/finishes'
import { MoonIcon, SunIcon } from './components/icons'
import { daylightAt, formatTime, sunPosition } from './scene/sun'
import { PropertiesPanel } from './components/PropertiesPanel'
import { preloadModels } from './scene/furniture/GltfModel'
import { CameraViewPicker } from './components/CameraViewPicker'
import { IntroScreen } from './components/IntroScreen'
import type { CameraViewId } from './scene/cameraViews'
import { loadThumbnails, saveThumbnail, introSeen, markIntroSeen } from './state/viewerPrefs'
import { DesignsDialog } from './components/DesignsDialog'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useHouseHistory } from './state/useDesignHistory'
import { DEFAULT_HOUSE, type HouseDesign } from './state/design'
import { loadAutosave, writeAutosave } from './state/storage'
import { ROOM_IDS, ROOMS, type RoomId, type WallSide } from './scene/house'

/** Room switch: the view fades out this fast, the room swaps, then it fades back in (see .scene-layer in index.css). */
const FADE_OUT_MS = 180

/** The name of a piece of furniture, for messages. */
const label = (item: FurnitureItem) => FURNITURE_INFO[item.type].label

const pad = (n: number) => String(n).padStart(2, '0')

/** Local date and time for file names, e.g. "2026-11-04 18.42". */
function fileStamp(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())}`
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function App() {
  // App state: which camera view is active, and a counter used to reset the camera.
  const [view, setView] = useState<ViewMode>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [designsOpen, setDesignsOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  // Where a wall or the floor was clicked, so its quick picker appears right there.
  const [pick, setPick] = useState<{ id: string; point: [number, number, number] } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  /** The furniture catalog drawer, and its pictures (drawn the first time it opens; kept for this visit only). */
  const [catalogOpen, setCatalogOpen] = useState(false)
  /** A design from a share link, waiting for you to open it (or not). */
  const [shared, setShared] = useState<HouseDesign | null>(null)
  // Read once when the app starts (the address bar is cleared right after).
  const [shareCode] = useState(() => shareCodeFromHash(window.location.hash))
  /** A high-resolution picture in progress (its request id). */
  const [screenshotRequest, setScreenshotRequest] = useState<number | null>(null)
  const [catalogThumbs, setCatalogThumbs] = useState<Partial<Record<FurnitureType, string>>>({})

  // Camera view (Overview / Eye level / Corner). It stays the same when you switch rooms.
  const [cameraViewId, setCameraViewId] = useState<CameraViewId>('overview')
  // Showcase: the editing panels are hidden and nothing can be changed, just looked at.
  const [showcase, setShowcase] = useState(false)
  // Welcome screen on the first visit, or with ?intro in the address.
  const [introOpen, setIntroOpen] = useState(() => !introSeen() || new URLSearchParams(window.location.search).has('intro'))
  // Small pictures of each room for the room bar, taken when you leave a room.
  const [thumbnails, setThumbnails] = useState(loadThumbnails)
  const [thumbnailRequest, setThumbnailRequest] = useState<{ room: RoomId; id: number } | null>(null)

  // Which room you're editing. `shownRoom` is the one in the 3D view: during the short
  // fade between rooms it still shows the old room, then catches up.
  const [room, setRoom] = useState<RoomId>('living')
  const [shownRoom, setShownRoom] = useState<RoomId>('living')
  const [fading, setFading] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Every room has its own design (furniture + finishes) and its own undo/redo history.
  // They start from the autosave, so reloading the page keeps your work.
  const { house, forRoom, loadHouse } = useHouseHistory(() => loadAutosave() ?? DEFAULT_HOUSE)

  // Everything below (toolbar, panels, shortcuts) works on the selected room's history.
  const history = forRoom(room)
  const { design } = history
  const selectedItem = design.items.find((item) => item.id === selectedId) ?? null
  const wall = selectedWall(selectedId)

  /** Clicked a wall in 3D: select it and show its quick picker there. */
  function handlePickWall(side: WallSide, point: [number, number, number]) {
    history.commit()
    setSelectedId(wallSelection(side))
    setPick({ id: wallSelection(side), point })
  }

  /**
   * Clicked the floor: if something else is selected, the first click just deselects
   * it (as clicking empty space always did); otherwise it selects the floor.
   */
  function handlePickFloor(point: [number, number, number]) {
    if (selectedId !== null && selectedId !== FLOOR_SELECTION) {
      setSelectedId(null)
      return
    }
    setSelectedId(FLOOR_SELECTION)
    setPick({ id: FLOOR_SELECTION, point })
  }

  const closePick = () => setSelectedId(null)
  const popoverContent =
    pick && pick.id === selectedId ? (
      wall ? (
        <WallPopover
          label={wallLabel(wall)}
          finish={wallFinishOf(design.finishes, wall)}
          onChange={(finish) => history.updateFinishes(setWallFinish(design.finishes, wall, finish))}
          onAllWalls={() => history.updateFinishes(setAllWalls(wallFinishOf(design.finishes, wall)))}
          onClose={closePick}
        />
      ) : selectedId === FLOOR_SELECTION ? (
        <FloorPopover floor={design.finishes.floor} onChange={(floor) => history.updateFinishes({ floor })} onClose={closePick} />
      ) : null
    ) : null

  // Which pieces overlap each other. Recalculated only when the furniture changes.
  // Built-in units (kitchen units, toilet) count too.
  const overlaps = useMemo(() => findOverlaps(design.items, ROOMS[room].fixedZones), [design.items, room])
  const shownItems = house[shownRoom].items
  const shownOverlaps = useMemo(() => findOverlaps(shownItems, ROOMS[shownRoom].fixedZones), [shownItems, shownRoom])

  useEffect(() => () => clearTimeout(fadeTimer.current), [])

  // Autosave: write every room to browser storage shortly after every change.
  useEffect(() => {
    const timer = setTimeout(() => writeAutosave(house), 400)
    return () => clearTimeout(timer)
  }, [house])

  // Hide the little notification after a few seconds.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  useKeyboardShortcuts({
    selectedItem,
    undo: history.undo,
    redo: history.redo,
    deselect: () => setSelectedId(null),
    updateItem: history.updateItem,
    previewItem: history.previewItem,
    commit: history.commit,
    removeSelected: handleDelete,
    duplicateSelected: handleDuplicate,
    selectRoom: (index) => {
      const next = ROOM_IDS[index]
      if (next) handleRoomChange(next)
    },
  })

  // Opened from a share link? Unpack it and offer it; your own design stays until you accept.
  useEffect(() => {
    if (!shareCode) return
    // Take the design out of the address bar, so a reload doesn't offer it again.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    let cancelled = false
    decodeShare(shareCode).then((sharedHouse) => {
      if (cancelled) return
      if (sharedHouse) setShared(sharedHouse)
      else setToast("That share link is damaged or out of date, so it couldn't be opened.")
    })
    return () => {
      cancelled = true
    }
  }, [shareCode])

  function handleLoad(loaded: HouseDesign, name: string) {
    loadHouse(loaded)
    setSelectedId(null)
    setDesignsOpen(false)
    setToast(`Loaded "${name}" (all rooms). Undo goes back one room at a time.`)
  }

  function handleReset() {
    history.reset()
    setSelectedId(null)
    setToast(`${ROOMS[room].label} reset to its starting design. Press Undo to go back.`)
  }

  function handleRoomChange(next: RoomId) {
    if (next === room) return
    history.commit() // finish any drag/slide in the room you're leaving
    setSelectedId(null)
    setRoom(next)
    // Picture of the room you're leaving, for the room bar (taken on the next frame,
    // before the view swaps to the new room).
    setThumbnailRequest({ room: shownRoom, id: Date.now() })

    clearTimeout(fadeTimer.current)
    if (prefersReducedMotion()) {
      // No fade, but still wait a moment so the thumbnail is of the old room.
      fadeTimer.current = setTimeout(() => setShownRoom(next), 60)
      return
    }
    // Fade out, swap the room while the view is hidden, then fade back in.
    setFading(true)
    fadeTimer.current = setTimeout(() => {
      setShownRoom(next)
      setFading(false)
    }, FADE_OUT_MS)
  }

  function handleDelete() {
    if (!selectedItem) return
    history.removeItem(selectedItem.id)
    setSelectedId(null)
    setToast(`Removed ${label(selectedItem).toLowerCase()}. Undo brings it back.`)
  }

  function handleDuplicate() {
    if (!selectedItem) return
    const copy: FurnitureItem = { ...selectedItem, id: createId() }
    const near: [number, number] = [selectedItem.position[0] + 0.3, selectedItem.position[1] + 0.3]
    copy.position = findFreeSpot(copy, design.items, ROOMS[room], ROOMS[room].fixedZones, near)
    history.addItem(copy)
    setSelectedId(copy.id)
  }

  /** Adds a new piece (from the catalog) at a free spot near the middle of the room, and selects it. */
  function handleAdd(type: FurnitureType) {
    const info = FURNITURE_INFO[type]
    const item: FurnitureItem = {
      id: createId(),
      type,
      variant: info.variants[0].id,
      position: [0, 0],
      rotation: 0,
      color: info.swatches[0].color,
    }
    item.position = findFreeSpot(item, design.items, ROOMS[room], ROOMS[room].fixedZones)
    history.addItem(item)
    setSelectedId(item.id)
    setToast(`Added ${info.label.toLowerCase()}. Drag it into place.`)
  }

  /**
   * Moves the selected piece to another room where it belongs: removed here, added
   * there at a free spot. That's one undo step in each room.
   */
  function handleMoveTo(target: RoomId) {
    if (!selectedItem || !isAllowedIn(selectedItem.type, target)) return
    const targetHistory = forRoom(target)
    const moved: FurnitureItem = { ...selectedItem, id: createId() }
    moved.position = findFreeSpot(moved, targetHistory.design.items, ROOMS[target], ROOMS[target].fixedZones)
    history.removeItem(selectedItem.id)
    targetHistory.addItem(moved)
    setSelectedId(null)
    setToast(`Moved ${label(selectedItem).toLowerCase()} to the ${ROOMS[target].label}. Undo in each room to reverse.`)
  }

  /** Save image: deselect first (no outline or guides in the picture), then capture. */
  function handleSaveImage() {
    setSelectedId(null)
    setPick(null)
    setScreenshotRequest(Date.now())
  }

  function handleScreenshot(image: Blob | null) {
    setScreenshotRequest(null)
    if (!image) {
      setToast("Couldn't make the picture. Try a smaller window.")
      return
    }
    downloadBlob(image, `${ROOMS[room].label} ${fileStamp(new Date())}.png`)
    setToast(`Saved a picture of the ${ROOMS[room].label}.`)
  }

  function handleThumbnail(thumbRoom: RoomId, url: string) {
    setThumbnails((current) => ({ ...current, [thumbRoom]: url }))
    saveThumbnail(thumbRoom, url)
  }

  // Start downloading the real 3D models in the background (1.6 MB in total), so
  // switching rooms finds them ready. Code-built models show until they arrive.
  useEffect(() => {
    const timer = setTimeout(preloadModels, 1200)
    return () => clearTimeout(timer)
  }, [])

  // A first picture of the room you start in, once it has had a moment to draw.
  useEffect(() => {
    const timer = setTimeout(() => setThumbnailRequest({ room: 'living', id: Date.now() }), 2000)
    return () => clearTimeout(timer)
  }, [])

  function enterShowcase() {
    history.commit()
    setSelectedId(null)
    setTimeOpen(false)
    setView('perspective')
    setShowcase(true)
  }

  // Esc leaves showcase mode.
  useEffect(() => {
    if (!showcase) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowcase(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showcase])

  function closeIntro(tour: boolean) {
    markIntroSeen()
    setIntroOpen(false)
    if (tour) {
      enterShowcase()
      setCameraViewId('eye')
    }
  }

  const overlapping = selectedItem ? (overlaps.get(selectedItem.id) ?? []).map((id) => overlapName(id, design.items)) : []

  return (
    <div className={`app ${showcase ? 'showcase' : ''}`}>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <span className="brand-name">Room Designer</span>
          <span className="divider" />
          <span className="project-name">My House</span>
        </div>
        <Toolbar
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={history.undo}
          onRedo={history.redo}
          onReset={handleReset}
          onResetView={() => {
            setCameraViewId('overview')
            setResetKey((k) => k + 1)
          }}
          onOpenDesigns={() => setDesignsOpen(true)}
          onShowcase={enterShowcase}
          onSaveImage={handleSaveImage}
          savingImage={screenshotRequest !== null}
        />
      </header>

      <div className="workspace">
        <Sidebar
          room={room}
          items={design.items}
          finishes={design.finishes}
          selectedId={selectedId}
          overlaps={overlaps}
          onSelect={setSelectedId}
          onShowRoom={() => setSelectedId(null)}
          lighting={design.lighting}
          onShowLighting={() => setTimeOpen(true)}
          onAddFurniture={() => setCatalogOpen(true)}
        />

        {/* Background follows the time of day, so the room-switch fade dips to the same tone as the 3D backdrop. */}
        <main className="viewport" style={{ background: daylightAt(house[shownRoom].lighting).background }}>
          <div className={`scene-layer ${fading ? 'fading' : ''}`}>
            <ErrorBoundary>
              <Scene
                view={view}
                resetKey={resetKey}
                room={shownRoom}
                design={house[shownRoom]}
                selectedId={shownRoom === room ? selectedId : null}
                overlaps={shownOverlaps}
                onSelect={setSelectedId}
                onMove={(id, position) => history.previewItem(id, { position })}
                onRotate={(id, rotation) => history.previewItem(id, { rotation })}
                onDragBoundary={history.commit}
                onPickWall={handlePickWall}
                onPickFloor={handlePickFloor}
                popover={!showcase && popoverContent && pick && shownRoom === room ? { point: pick.point, content: popoverContent } : null}
                cameraViewId={cameraViewId}
                editable={!showcase}
                thumbnailRequest={thumbnailRequest}
                onThumbnail={handleThumbnail}
                screenshotRequest={screenshotRequest}
                onScreenshot={handleScreenshot}
              />
            </ErrorBoundary>
          </div>

          <div className="overlay-top">
            {!showcase && <ViewToggle view={view} onChange={setView} />}
            {view === 'perspective' && <CameraViewPicker room={room} value={cameraViewId} onChange={setCameraViewId} />}
            <button
              className={`time-toggle ${timeOpen ? 'active' : ''}`}
              aria-pressed={timeOpen}
              aria-label={`Time of day: ${formatTime(design.lighting.time)}`}
              onClick={() => setTimeOpen((open) => !open)}
            >
              {sunPosition(design.lighting.time).elevation < 0 ? <MoonIcon /> : <SunIcon />}
              {formatTime(design.lighting.time)}
            </button>
            {showcase && (
              <button className="showcase-exit" onClick={() => setShowcase(false)}>
                Exit showcase <kbd>Esc</kbd>
              </button>
            )}
          </div>

          {timeOpen && (
            <TimeOfDayPanel
              roomLabel={ROOMS[room].label}
              lighting={design.lighting}
              onUpdate={history.updateLighting}
              onPreview={history.previewLighting}
              onCommit={history.commit}
              onClose={() => setTimeOpen(false)}
            />
          )}

          <p className="hint" hidden={timeOpen || showcase}>
            {view === 'perspective'
              ? 'Click furniture to select · drag it to move · drag empty space to rotate · right-drag to pan · scroll to zoom'
              : 'Click furniture to select · drag it to move · drag empty space to pan · scroll to zoom'}
          </p>

          {catalogOpen && !showcase && (
            <CatalogDrawer
              room={room}
              thumbnails={catalogThumbs}
              onAdd={(type) => {
                handleAdd(type)
                setCatalogOpen(false)
              }}
              onClose={() => setCatalogOpen(false)}
            />
          )}

          {shared && (
            <div className="share-banner" role="dialog" aria-label="Shared design">
              <span>Someone shared a design with you.</span>
              <button
                className="primary-button"
                onClick={() => {
                  handleLoad(shared, 'shared design')
                  setShared(null)
                }}
              >
                Open it
              </button>
              <button className="ghost-button" onClick={() => setShared(null)}>
                Keep mine
              </button>
            </div>
          )}

          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}

          <RoomBar room={room} onChange={handleRoomChange} thumbnails={thumbnails} />
        </main>

        <PropertiesPanel
          room={room}
          item={selectedItem}
          wall={wall}
          finishes={design.finishes}
          overlapping={overlapping}
          onUpdate={(changes) => selectedItem && history.updateItem(selectedItem.id, changes)}
          onPreview={(changes) => selectedItem && history.previewItem(selectedItem.id, changes)}
          onUpdateFinishes={history.updateFinishes}
          onPreviewFinishes={history.previewFinishes}
          onCommit={history.commit}
          onDeselect={() => setSelectedId(null)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          moveTargets={selectedItem ? ROOM_IDS.filter((id) => id !== room && isAllowedIn(selectedItem.type, id)) : []}
          onMoveTo={handleMoveTo}
        />
      </div>

      {catalogOpen && (
        <CatalogThumbnailRenderer
          types={catalogFor(room).filter((type) => !catalogThumbs[type])}
          onThumbnail={(type, url) => setCatalogThumbs((current) => ({ ...current, [type]: url }))}
        />
      )}

      {introOpen && <IntroScreen onStart={() => closeIntro(false)} onTour={() => closeIntro(true)} />}

      <DesignsDialog open={designsOpen} design={house} onClose={() => setDesignsOpen(false)} onLoad={handleLoad} />
    </div>
  )
}
