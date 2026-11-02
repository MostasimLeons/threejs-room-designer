import { RedoIcon, ResetIcon, SaveIcon, UndoIcon } from './icons'

interface ToolbarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onResetView: () => void
  onOpenDesigns: () => void
}

/** The buttons in the top bar. On medium screens only the icons are shown. */
export function Toolbar({ canUndo, canRedo, onUndo, onRedo, onReset, onResetView, onOpenDesigns }: ToolbarProps) {
  return (
    <div className="toolbar">
      <button className="ghost-button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
        <UndoIcon />
        <span className="label">Undo</span>
      </button>
      <button className="ghost-button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo">
        <RedoIcon />
        <span className="label">Redo</span>
      </button>
      <span className="divider" />
      <button className="ghost-button" onClick={onReset} title="Put furniture and finishes back to the starting design" aria-label="Reset">
        <ResetIcon />
        <span className="label">Reset</span>
      </button>
      <button className="ghost-button" onClick={onResetView} title="Move the camera back to the start">
        Reset view
      </button>
      <span className="divider" />
      <button className="primary-button" onClick={onOpenDesigns} title="Save, load, export or import designs" aria-label="Save / Load">
        <SaveIcon />
        <span className="label">Save / Load</span>
      </button>
    </div>
  )
}
