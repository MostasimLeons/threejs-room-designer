import { useEffect, useState } from 'react'
import { Scene } from './scene/Scene'
import type { ViewMode } from './scene/roomConfig'
import { Sidebar } from './components/Sidebar'
import { ViewToggle } from './components/ViewToggle'
import { PropertiesPanel } from './components/PropertiesPanel'
import { DesignsDialog } from './components/DesignsDialog'
import { useDesignHistory } from './state/useDesignHistory'
import { DEFAULT_DESIGN, type RoomDesign } from './state/design'
import { loadAutosave, writeAutosave } from './state/storage'

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M7 3v5h8V3M7 21v-7h10v7" />
    </svg>
  )
}

export default function App() {
  // App state: which camera view is active, and a counter used to reset the camera.
  const [view, setView] = useState<ViewMode>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [designsOpen, setDesignsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // The room design (furniture + finishes) plus undo/redo history.
  // It starts from the autosave, so reloading the page keeps your work.
  const history = useDesignHistory(() => loadAutosave() ?? DEFAULT_DESIGN)
  const { design } = history
  const selectedItem = design.items.find((item) => item.id === selectedId) ?? null

  // Autosave: write the design to browser storage shortly after every change.
  useEffect(() => {
    const timer = setTimeout(() => writeAutosave(design), 400)
    return () => clearTimeout(timer)
  }, [design])

  // Hide the little notification after a few seconds.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  function handleLoad(loaded: RoomDesign, name: string) {
    history.load(loaded)
    setSelectedId(null)
    setDesignsOpen(false)
    setToast(`Loaded "${name}". Press Undo to go back.`)
  }

  function handleReset() {
    history.reset()
    setSelectedId(null)
    setToast('Room reset to the starting design. Press Undo to go back.')
  }

  // Keyboard shortcuts. Re-registered when the selection changes so they act on the right item.
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') return
      if (document.querySelector('dialog[open]')) return // the Designs window handles its own keys
      const ctrl = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (ctrl && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        history.undo()
      } else if (ctrl && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault()
        history.redo()
      } else if (key === 'escape') {
        setSelectedId(null)
      } else if (key === 'r' && !ctrl && selectedItem) {
        history.updateItem(selectedItem.id, { rotation: selectedItem.rotation + (event.shiftKey ? -45 : 45) })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [history, selectedItem])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <span className="brand-name">Room Designer</span>
          <span className="divider" />
          <span className="project-name">Living Room</span>
        </div>
        <div className="toolbar">
          <button className="ghost-button" onClick={history.undo} disabled={!history.canUndo} title="Undo (Ctrl+Z)">
            <UndoIcon />
            <span className="label">Undo</span>
          </button>
          <button className="ghost-button" onClick={history.redo} disabled={!history.canRedo} title="Redo (Ctrl+Y)">
            <RedoIcon />
            <span className="label">Redo</span>
          </button>
          <span className="divider" />
          <button className="ghost-button" onClick={handleReset} title="Put furniture and finishes back to the starting design">
            <ResetIcon />
            <span className="label">Reset</span>
          </button>
          <button className="ghost-button" onClick={() => setResetKey((k) => k + 1)} title="Move the camera back to the start">
            <span className="label-always">Reset view</span>
          </button>
          <span className="divider" />
          <button className="primary-button" onClick={() => setDesignsOpen(true)} title="Save, load, export or import designs">
            <SaveIcon />
            <span className="label">Save / Load</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        <Sidebar
          items={design.items}
          finishes={design.finishes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onShowRoom={() => setSelectedId(null)}
        />

        <main className="viewport">
          <Scene
            view={view}
            resetKey={resetKey}
            items={design.items}
            finishes={design.finishes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={(id, position) => history.previewItem(id, { position })}
            onDragBoundary={history.commit}
          />

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
        </main>

        <PropertiesPanel
          item={selectedItem}
          finishes={design.finishes}
          onUpdate={(changes) => selectedItem && history.updateItem(selectedItem.id, changes)}
          onPreview={(changes) => selectedItem && history.previewItem(selectedItem.id, changes)}
          onUpdateFinishes={history.updateFinishes}
          onPreviewFinishes={history.previewFinishes}
          onCommit={history.commit}
          onDeselect={() => setSelectedId(null)}
        />
      </div>

      <DesignsDialog open={designsOpen} design={design} onClose={() => setDesignsOpen(false)} onLoad={handleLoad} />
    </div>
  )
}
