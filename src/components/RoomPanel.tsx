import { ROOMS, type RoomId } from '../scene/house'
import { FLOOR_OPTIONS, WALL_SWATCHES, wallColorName, type RoomFinishes } from '../scene/finishes'
import type { FinishChanges } from '../state/useDesignHistory'
import { ColorPicker } from './ColorPicker'

interface RoomPanelProps {
  room: RoomId
  finishes: RoomFinishes
  onUpdateFinishes: (changes: FinishChanges) => void
  onPreviewFinishes: (changes: FinishChanges) => void
  onCommit: () => void
}

/** Right-hand panel when nothing is selected: wall paint, floor material and shortcut tips. */
export function RoomPanel({ room, finishes, onUpdateFinishes, onPreviewFinishes, onCommit }: RoomPanelProps) {
  return (
    <aside className="properties">
      <section className="card">
        <h2>Room</h2>
        <p className="item-title">{ROOMS[room].label}</p>
        <p className="muted">Select furniture to edit it, or style the room below.</p>
      </section>

      <section className="card">
        <h2>Walls · {wallColorName(finishes.wallColor)}</h2>
        <ColorPicker
          swatches={WALL_SWATCHES}
          value={finishes.wallColor}
          onPick={(wallColor) => onUpdateFinishes({ wallColor })}
          onPreview={(wallColor) => onPreviewFinishes({ wallColor })}
          onCommit={onCommit}
        />
      </section>

      <section className="card">
        <h2>Floor</h2>
        <div className="option-list">
          {FLOOR_OPTIONS.map((floor) => (
            <button
              key={floor.id}
              className={`option-button ${floor.id === finishes.floor ? 'active' : ''}`}
              onClick={() => onUpdateFinishes({ floor: floor.id })}
              aria-pressed={floor.id === finishes.floor}
            >
              <span className="swatch" style={{ background: floor.swatch }} />
              {floor.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Shortcuts</h2>
        <ul className="tips">
          <li>
            <kbd>Drag</kbd> furniture to move it
          </li>
          <li>
            <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> nudge 5 cm (<kbd>Shift</kbd> 25 cm)
          </li>
          <li>
            <kbd>R</kbd> / <kbd>Shift</kbd>+<kbd>R</kbd> rotate 45°
          </li>
          <li>
            <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Y</kbd> redo
          </li>
          <li>
            <kbd>Esc</kbd> deselect
          </li>
        </ul>
      </section>
    </aside>
  )
}
