import { useEffect, useMemo, useRef, useState } from 'react'
import { Scene } from './scene/Scene'
import type { ViewMode } from './scene/roomConfig'
import { findOverlaps, overlapName } from './scene/furniture/catalog'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { ViewToggle } from './components/ViewToggle'
import { RoomBar } from './components/RoomBar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { DesignsDialog } from './components/DesignsDialog'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useHouseHistory } from './state/useDesignHistory'
import { DEFAULT_HOUSE, type HouseDesign } from './state/design'
import { loadAutosave, writeAutosave } from './state/storage'
import { ROOM_IDS, ROOMS, type RoomId } from './scene/house'

/** Room switch: the view fades out this fast, the room swaps, then it fades back in (see .scene-layer in index.css). */
const FADE_OUT_MS = 180

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function App() {
  // App state: which camera view is active, and a counter used to reset the camera.
  const [view, setView] = useState<ViewMode>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [designsOpen, setDesignsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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
    selectRoom: (index) => {
      const next = ROOM_IDS[index]
      if (next) handleRoomChange(next)
    },
  })

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

    clearTimeout(fadeTimer.current)
    if (prefersReducedMotion()) {
      setShownRoom(next)
      return
    }
    // Fade out, swap the room while the view is hidden, then fade back in.
    setFading(true)
    fadeTimer.current = setTimeout(() => {
      setShownRoom(next)
      setFading(false)
    }, FADE_OUT_MS)
  }

  const overlapping = selectedItem ? (overlaps.get(selectedItem.id) ?? []).map((id) => overlapName(id, design.items)) : []

  return (
    <div className="app">
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
          onResetView={() => setResetKey((k) => k + 1)}
          onOpenDesigns={() => setDesignsOpen(true)}
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
        />

        <main className="viewport">
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
                onDragBoundary={history.commit}
              />
            </ErrorBoundary>
          </div>

          <div className="overlay-top">
            <ViewToggle view={view} onChange={setView} />
          </div>

          <p className="hint">
            {view === 'perspective'
              ? 'Click furniture to select · drag it to move · drag empty space to rotate · right-drag to pan · scroll to zoom'
              : 'Click furniture to select · drag it to move · drag empty space to pan · scroll to zoom'}
          </p>

          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}

          <RoomBar room={room} onChange={handleRoomChange} />
        </main>

        <PropertiesPanel
          room={room}
          item={selectedItem}
          finishes={design.finishes}
          overlapping={overlapping}
          onUpdate={(changes) => selectedItem && history.updateItem(selectedItem.id, changes)}
          onPreview={(changes) => selectedItem && history.previewItem(selectedItem.id, changes)}
          onUpdateFinishes={history.updateFinishes}
          onPreviewFinishes={history.previewFinishes}
          onCommit={history.commit}
          onDeselect={() => setSelectedId(null)}
        />
      </div>

      <DesignsDialog open={designsOpen} design={house} onClose={() => setDesignsOpen(false)} onLoad={handleLoad} />
    </div>
  )
}
