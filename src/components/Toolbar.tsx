import { CameraIcon, CompareIcon, ListIcon, VideoIcon, ResetViewIcon, RedoIcon, ResetIcon, SaveIcon, ShowcaseIcon, UndoIcon } from './icons'

interface ToolbarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onResetView: () => void
  onOpenDesigns: () => void
  onShowcase: () => void
  /** Download a high-resolution picture of the 3D view. */
  onSaveImage: () => void
  /** Open the shopping list (quote). */
  onShoppingList: () => void
  /** Open the "record a video" dialog. */
  onRecordVideo: () => void
  /** Open the before/after comparison. */
  onCompare: () => void
  /** True while a picture is being made. */
  savingImage: boolean
}

/** The buttons in the top bar. On medium screens only the icons are shown. */
export function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onResetView,
  onOpenDesigns,
  onShowcase,
  onSaveImage,
  savingImage,
  onShoppingList,
  onRecordVideo,
  onCompare,
}: ToolbarProps) {
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
      <button className="ghost-button" onClick={onResetView} title="Move the camera back to the start" aria-label="Reset view">
        <ResetViewIcon />
        <span className="label">Reset view</span>
      </button>
      <button className="ghost-button" onClick={onShowcase} title="Full-screen view without the editing panels" aria-label="Showcase">
        <ShowcaseIcon />
        <span className="label">Showcase</span>
      </button>
      <button
        className="ghost-button"
        onClick={onSaveImage}
        disabled={savingImage}
        title="Download a high-resolution picture of the 3D view (PNG)"
        aria-label="Save image"
      >
        <CameraIcon />
        <span className="label">{savingImage ? 'Saving…' : 'Save image'}</span>
      </button>
      <button className="ghost-button" onClick={onCompare} title="Compare before and after" aria-label="Compare">
        <CompareIcon />
        <span className="label">Compare</span>
      </button>
      <button
        className="ghost-button"
        onClick={onRecordVideo}
        title="Record a video of the room (turntable or tour)"
        aria-label="Record video"
      >
        <VideoIcon />
        <span className="label">Video</span>
      </button>
      <button
        className="ghost-button"
        onClick={onShoppingList}
        title="Shopping list with example prices (CSV or print)"
        aria-label="Shopping list"
      >
        <ListIcon />
        <span className="label">Shopping list</span>
      </button>
      <span className="divider" />
      <button className="primary-button" onClick={onOpenDesigns} title="Save, load, export or import designs" aria-label="Save / Load">
        <SaveIcon />
        <span className="label">Save / Load</span>
      </button>
    </div>
  )
}
