import { useEffect, useMemo, useState } from 'react'
import { Scene } from './scene/Scene'
import type { ViewMode } from './scene/roomConfig'
import { findOverlaps } from './scene/furniture/catalog'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { ViewToggle } from './components/ViewToggle'
import { RoomSelector } from './components/RoomSelector'
import { PropertiesPanel } from './components/PropertiesPanel'
import { DesignsDialog } from './components/DesignsDialog'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useDesignHistory } from './state/useDesignHistory'
import { DEFAULT_BEDROOM_DESIGN, DEFAULT_DESIGN, DEFAULT_HOUSE, type HouseDesign } from './state/design'
import { loadAutosave, writeAutosave } from './state/storage'
import { ROOMS, type RoomId } from './scene/house'

export default function App() {
  // App state: which camera view is active, and a counter used to reset the camera.
  const [view, setView] = useState<ViewMode>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [designsOpen, setDesignsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Which room you're viewing and editing.
  const [room, setRoom] = useState<RoomId>('living')

  // Each room has its own design (furniture + finishes) and its own undo/redo history.
  // Both start from the autosave, so reloading the page keeps your work.
  const [initialHouse] = useState<HouseDesign>(() => loadAutosave() ?? DEFAULT_HOUSE)
  const living = useDesignHistory(() => initialHouse.living, { bounds: ROOMS.living, defaultDesign: DEFAULT_DESIGN })
  const bedroom = useDesignHistory(() => initialHouse.bedroom, { bounds: ROOMS.bedroom, defaultDesign: DEFAULT_BEDROOM_DESIGN })
  const house = useMemo<HouseDesign>(() => ({ living: living.design, bedroom: bedroom.design }), [living.design, bedroom.design])

  // Everything below (toolbar, panels, shortcuts) works on the selected room's history.
  const history = room === 'living' ? living : bedroom
  const { design } = history
  const selectedItem = design.items.find((item) => item.id === selectedId) ?? null

  // Which pieces overlap each other. Recalculated only when the furniture changes.
  const overlaps = useMemo(() => findOverlaps(design.items), [design.items])

  // Autosave: write both rooms to browser storage shortly after every change.
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
  })

  function handleLoad(loaded: HouseDesign, name: string) {
    living.load(loaded.living)
    bedroom.load(loaded.bedroom)
    setSelectedId(null)
    setDesignsOpen(false)
    setToast(`Loaded "${name}" (both rooms). Undo goes back one room at a time.`)
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
  }

  const overlapping = selectedItem
    ? (overlaps.get(selectedItem.id) ?? []).flatMap((id) => design.items.filter((item) => item.id === id))
    : []

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
          <ErrorBoundary>
            <Scene
              view={view}
              resetKey={resetKey}
              activeRoom={room}
              house={house}
              selectedId={selectedId}
              overlaps={overlaps}
              onSelect={setSelectedId}
              onMove={(id, position) => history.previewItem(id, { position })}
              onDragBoundary={history.commit}
            />
          </ErrorBoundary>

          <div className="overlay-top">
            <RoomSelector room={room} onChange={handleRoomChange} />
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
