import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import type { RoomFinishes } from '../scene/finishes'
import { ROOMS, type RoomId } from '../scene/house'
import type { FinishChanges, ItemChanges } from '../state/useDesignHistory'
import { ColorPicker } from './ColorPicker'
import { RoomPanel } from './RoomPanel'

interface PropertiesPanelProps {
  /** The room being edited: sets the slider ranges and the Room panel title. */
  room: RoomId
  item: FurnitureItem | null
  finishes: RoomFinishes
  /** Other pieces the selected item currently overlaps. */
  overlapping: FurnitureItem[]
  /** Apply a change and record an undo step. */
  onUpdate: (changes: ItemChanges) => void
  /** Apply a change live (while sliding); `onCommit` records it when you let go. */
  onPreview: (changes: ItemChanges) => void
  onUpdateFinishes: (changes: FinishChanges) => void
  onPreviewFinishes: (changes: FinishChanges) => void
  onCommit: () => void
  onDeselect: () => void
}

/** Props that make a slider record ONE undo step when you let go. */
function commitHandlers(onCommit: () => void) {
  return { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit }
}

/** Right-hand panel: edits the selected furniture, or the room when nothing is selected. */
export function PropertiesPanel(props: PropertiesPanelProps) {
  const { room, item, overlapping, onUpdate, onPreview, onCommit, onDeselect } = props
  if (!item) return <RoomPanel {...props} />
  const { width, depth } = ROOMS[room]

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
        {overlapping.length > 0 && (
          <p className="warning" role="status">
            Overlaps {overlapping.map((other) => FURNITURE_INFO[other.type].label.toLowerCase()).join(' and ')}. Move or rotate it to
            make space.
          </p>
        )}
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
          swatches={info.swatches}
          value={item.color}
          onPick={(color) => onUpdate({ color })}
          onPreview={(color) => onPreview({ color })}
          onCommit={onCommit}
        />
        <p className="muted small">
          Current: {info.swatches.find((s) => s.color.toLowerCase() === item.color.toLowerCase())?.name ?? item.color.toUpperCase()}
        </p>
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
          min={-width / 2}
          max={width / 2}
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
          min={-depth / 2}
          max={depth / 2}
          step={0.05}
          value={z}
          onChange={(e) => onPreview({ position: [x, Number(e.target.value)] })}
          aria-label="Back to front position"
          {...commitHandlers(onCommit)}
        />
        <p className="muted small">Tip: drag it in the 3D view, or use the arrow keys.</p>
      </section>
    </aside>
  )
}
