import { WALL_STYLES, WALL_SWATCHES, wallColorName, type WallFinish } from '../scene/finishes'
import { ColorPicker } from './ColorPicker'

interface WallPanelProps {
  label: string
  finish: WallFinish
  /** True when this wall has a finish of its own (differs from the rest of the room). */
  custom: boolean
  /** Apply and record one undo step. */
  onChange: (finish: WallFinish) => void
  /** Apply live while picking a custom colour; `onCommit` records it. */
  onPreview: (finish: WallFinish) => void
  onCommit: () => void
  /** Give every wall this finish. */
  onAllWalls: () => void
  /** Drop this wall's own finish, so it matches the rest of the room again. */
  onMatchRoom: () => void
  onDeselect: () => void
}

/** Right-hand panel while a wall is selected: paint or tiles, its colour, and whole-room shortcuts. */
export function WallPanel({ label, finish, custom, onChange, onPreview, onCommit, onAllWalls, onMatchRoom, onDeselect }: WallPanelProps) {
  return (
    <aside className="properties">
      <section className="card">
        <div className="panel-header">
          <div>
            <h2>Properties</h2>
            <p className="item-title">{label}</p>
            <p className="muted">{custom ? 'Has its own finish' : 'Same as the rest of the room'} · click another wall to edit it</p>
          </div>
          <button className="icon-button" onClick={onDeselect} aria-label="Deselect">
            ✕
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Finish · {wallColorName(finish.color)}</h2>
        <div className="segmented" role="group" aria-label="Wall finish">
          {WALL_STYLES.map((style) => (
            <button
              key={style.id}
              className={style.id === finish.style ? 'active' : ''}
              aria-pressed={style.id === finish.style}
              onClick={() => onChange({ ...finish, style: style.id })}
            >
              {style.label}
            </button>
          ))}
        </div>
        <ColorPicker
          swatches={WALL_SWATCHES}
          value={finish.color}
          onPick={(color) => onChange({ ...finish, color })}
          onPreview={(color) => onPreview({ ...finish, color })}
          onCommit={onCommit}
        />
      </section>

      <section className="card">
        <h2>Whole room</h2>
        <div className="option-list">
          <button className="option-button" onClick={onAllWalls}>
            Use this on all walls
          </button>
          {custom && (
            <button className="option-button" onClick={onMatchRoom}>
              Match the rest of the room
            </button>
          )}
        </div>
      </section>
    </aside>
  )
}
