import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import { FLOOR_OPTIONS, WALL_SWATCHES, wallColorName, type RoomFinishes } from '../scene/finishes'
import { ROOM } from '../scene/roomConfig'
import type { FinishChanges, ItemChanges } from '../state/useDesignHistory'

interface PropertiesPanelProps {
  item: FurnitureItem | null
  finishes: RoomFinishes
  /** Apply a change and record an undo step. */
  onUpdate: (changes: ItemChanges) => void
  /** Apply a change live (while sliding); `onCommit` records it when you let go. */
  onPreview: (changes: ItemChanges) => void
  onUpdateFinishes: (changes: FinishChanges) => void
  onPreviewFinishes: (changes: FinishChanges) => void
  onCommit: () => void
  onDeselect: () => void
}

/** Props that make a slider/colour input record ONE undo step when you let go. */
function commitHandlers(onCommit: () => void) {
  return { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit }
}

interface ColorPickerProps {
  swatches: { color: string; name: string }[]
  value: string
  onPick: (color: string) => void
  onPreview: (color: string) => void
  onCommit: () => void
}

/** A grid of preset swatches plus a "+" button that opens the browser's colour picker. */
function ColorPicker({ swatches, value, onPick, onPreview, onCommit }: ColorPickerProps) {
  return (
    <div className="swatch-grid">
      {swatches.map((swatch) => (
        <button
          key={swatch.color}
          className={`swatch-button ${swatch.color.toLowerCase() === value.toLowerCase() ? 'active' : ''}`}
          style={{ background: swatch.color }}
          onClick={() => onPick(swatch.color)}
          aria-label={swatch.name}
          title={swatch.name}
        />
      ))}
      <label className="swatch-button custom" title="Custom colour">
        <input type="color" value={value} onChange={(e) => onPreview(e.target.value)} onBlur={onCommit} aria-label="Custom colour" />+
      </label>
    </div>
  )
}

/** Shown when nothing is selected: edit the room itself. */
function RoomPanel({ finishes, onUpdateFinishes, onPreviewFinishes, onCommit }: Omit<PropertiesPanelProps, 'item' | 'onUpdate' | 'onPreview' | 'onDeselect'>) {
  return (
    <aside className="properties">
      <section className="card">
        <h2>Room</h2>
        <p className="item-title">Living room</p>
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
          <li><kbd>Drag</kbd> furniture to move it</li>
          <li><kbd>R</kbd> / <kbd>Shift</kbd>+<kbd>R</kbd> rotate 45°</li>
          <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Y</kbd> redo</li>
          <li><kbd>Esc</kbd> deselect</li>
        </ul>
      </section>
    </aside>
  )
}

export function PropertiesPanel(props: PropertiesPanelProps) {
  const { item, onUpdate, onPreview, onCommit, onDeselect } = props
  if (!item) return <RoomPanel {...props} />

  const info = FURNITURE_INFO[item.type]
  const variant = getVariant(item.type, item.variant)
  const [x, z] = item.position

  return (
    <aside className="properties">
      <section className="card">
        <div className="panel-header">
          <div>
            <h2>Properties</h2>
            <p className="item-title">{info.label}</p>
            <p className="muted">
              {variant.label} · {variant.detail}
            </p>
          </div>
          <button className="icon-button" onClick={onDeselect} aria-label="Deselect">
            ✕
          </button>
        </div>
      </section>

      <section className="card">
        <h2>{info.variantLabel}</h2>
        <div className="option-list">
          {info.variants.map((option) => (
            <button
              key={option.id}
              className={`option-button ${option.id === variant.id ? 'active' : ''}`}
              onClick={() => onUpdate({ variant: option.id })}
              aria-pressed={option.id === variant.id}
            >
              {option.label}
              <span className="item-detail">{option.detail}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Colour · {info.colorLabel}</h2>
        <ColorPicker
          swatches={info.swatches.map((color) => ({ color, name: `Colour ${color}` }))}
          value={item.color}
          onPick={(color) => onUpdate({ color })}
          onPreview={(color) => onPreview({ color })}
          onCommit={onCommit}
        />
        <p className="muted small">Current: {item.color.toUpperCase()}</p>
      </section>

      <section className="card">
        <h2>Rotation</h2>
        <div className="rotate-row">
          <button className="ghost-button" onClick={() => onUpdate({ rotation: item.rotation - 45 })} aria-label="Rotate left 45 degrees">
            ⟲ 45°
          </button>
          <output className="rotation-value">{item.rotation}°</output>
          <button className="ghost-button" onClick={() => onUpdate({ rotation: item.rotation + 45 })} aria-label="Rotate right 45 degrees">
            45° ⟳
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={item.rotation}
          onChange={(e) => onPreview({ rotation: Number(e.target.value) })}
          aria-label="Rotation in degrees"
          {...commitHandlers(onCommit)}
        />
      </section>

      <section className="card">
        <h2>Position</h2>
        <label className="field">
          <span>Left ↔ Right</span>
          <output>{x.toFixed(2)} m</output>
        </label>
        <input
          type="range"
          min={-ROOM.width / 2}
          max={ROOM.width / 2}
          step={0.05}
          value={x}
          onChange={(e) => onPreview({ position: [Number(e.target.value), z] })}
          aria-label="Left to right position"
          {...commitHandlers(onCommit)}
        />
        <label className="field">
          <span>Back ↔ Front</span>
          <output>{z.toFixed(2)} m</output>
        </label>
        <input
          type="range"
          min={-ROOM.depth / 2}
          max={ROOM.depth / 2}
          step={0.05}
          value={z}
          onChange={(e) => onPreview({ position: [x, Number(e.target.value)] })}
          aria-label="Back to front position"
          {...commitHandlers(onCommit)}
        />
        <p className="muted small">Tip: you can also drag it in the 3D view.</p>
      </section>
    </aside>
  )
}
