import { WALL_SIDES, type RoomLayout, type WallSide } from '../scene/house'
import {
  addOpening,
  LAYOUT_LIMITS,
  OPENING_LIMITS,
  removeOpening,
  updateOpening,
  wallLength,
  type OpeningChanges,
  type OpeningRef,
} from '../scene/layout'
import { wallLabel } from '../scene/selection'

/**
 * The room layout editor (Phase 12): the Room size card (width, depth, ceiling
 * height, and the list of windows and doors) and the panel for one selected
 * window or door. Every change goes through layout.ts, which keeps the room valid.
 */

/** Props that make a slider record ONE undo step when you let go. */
function commitHandlers(onCommit: () => void) {
  return { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit }
}

const cm = (metres: number) => Math.round(metres * 100)

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onPreview: (value: number) => void
  onCommit: () => void
  /** Shown value; metres by default. */
  format?: (value: number) => string
  step?: number
}

/** A labelled slider showing its value; dragging previews, letting go records one undo step. */
function LayoutSlider({ label, value, min, max, onPreview, onCommit, format = (v) => `${v.toFixed(2)} m`, step = 0.05 }: SliderProps) {
  return (
    <>
      <label className="field">
        <span>{label}</span>
        <output>{format(value)}</output>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onPreview(Number(e.target.value))}
        aria-label={label}
        {...commitHandlers(onCommit)}
      />
    </>
  )
}

interface LayoutCardProps {
  layout: RoomLayout
  /** True when the room has its standard layout (nothing to reset). */
  standard: boolean
  onUpdate: (layout: RoomLayout) => void
  onPreview: (layout: RoomLayout) => void
  onCommit: () => void
  onReset: () => void
  onSelectOpening: (ref: OpeningRef) => void
  /** Says why something couldn't be done (e.g. no wall has room for another door). */
  onMessage: (text: string) => void
}

/** Room size (width, depth, ceiling height) and the room's windows and doors. */
export function LayoutCard({ layout, standard, onUpdate, onPreview, onCommit, onReset, onSelectOpening, onMessage }: LayoutCardProps) {
  const openings = WALL_SIDES.flatMap((side) => (layout.openings[side] ?? []).map((o, index) => ({ o, ref: { side, index } })))
  const add = (kind: 'window' | 'door') => {
    const result = addOpening(layout, kind)
    if (!result) return onMessage(`No wall has room for another ${kind}. Make the room bigger or remove one first.`)
    onUpdate(result.layout)
    onSelectOpening(result.ref)
  }
  return (
    <section className="card layout-card">
      <h2>Room size</h2>
      <LayoutSlider
        label="Width"
        value={layout.width}
        min={LAYOUT_LIMITS.width[0]}
        max={LAYOUT_LIMITS.width[1]}
        onPreview={(width) => onPreview({ ...layout, width })}
        onCommit={onCommit}
      />
      <LayoutSlider
        label="Depth"
        value={layout.depth}
        min={LAYOUT_LIMITS.depth[0]}
        max={LAYOUT_LIMITS.depth[1]}
        onPreview={(depth) => onPreview({ ...layout, depth })}
        onCommit={onCommit}
      />
      <LayoutSlider
        label="Ceiling height"
        value={layout.height}
        min={LAYOUT_LIMITS.height[0]}
        max={LAYOUT_LIMITS.height[1]}
        onPreview={(height) => onPreview({ ...layout, height })}
        onCommit={onCommit}
      />
      <p className="muted small">
        {(layout.width * layout.depth).toFixed(1)} m² · furniture is moved back inside if the room gets smaller.
        {!standard && (
          <>
            {' '}
            <button className="text-button" onClick={onReset}>
              Back to the standard size and openings
            </button>
          </>
        )}
      </p>

      <h2 className="layout-subtitle">Windows &amp; doors</h2>
      <ul className="list">
        {openings.map(({ o, ref }) => (
          <li key={`${ref.side}-${ref.index}`}>
            <button className="list-button" onClick={() => onSelectOpening(ref)}>
              <span className="swatch" style={{ background: o.kind === 'window' ? '#cfe4ef' : '#f4f1ea' }} />
              <span className="item-name">{o.label}</span>
              <span className="item-detail">
                {wallLabel(ref.side)} · {cm(o.width)} cm
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="action-row">
        <button className="ghost-button" onClick={() => add('window')}>
          + Window
        </button>
        <button className="ghost-button" onClick={() => add('door')}>
          + Door
        </button>
      </div>
    </section>
  )
}

interface OpeningPanelProps {
  layout: RoomLayout
  opening: OpeningRef
  onUpdate: (layout: RoomLayout, ref: OpeningRef) => void
  onPreview: (layout: RoomLayout, ref: OpeningRef) => void
  onCommit: () => void
  onDeselect: () => void
  onDelete: () => void
}

/** Right-hand panel for a selected window or door: which wall, where, how big. */
export function OpeningPanel({ layout, opening, onUpdate, onPreview, onCommit, onDeselect, onDelete }: OpeningPanelProps) {
  const o = layout.openings[opening.side]?.[opening.index]
  if (!o) return null
  const length = wallLength(opening.side, layout)
  const window = o.kind === 'window'
  const preview = (changes: OpeningChanges) => {
    const next = updateOpening(layout, opening, changes)
    onPreview(next.layout, next.ref)
  }
  const limits = window ? OPENING_LIMITS.window : OPENING_LIMITS.door
  return (
    <aside className="properties" aria-label={`${o.label} settings`}>
      <section className="card">
        <div className="panel-header">
          <div>
            <h2>{window ? 'Window' : 'Door'}</h2>
            <p className="item-title">{o.label}</p>
            <p className="muted">
              {wallLabel(opening.side)} · {cm(o.width)} × {cm(o.top - o.bottom)} cm
            </p>
          </div>
          <button className="icon-button" onClick={onDeselect} aria-label="Deselect">
            ✕
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Wall</h2>
        <div className="segmented" role="group" aria-label="Wall">
          {(['back', 'left', 'right', 'front'] as WallSide[]).map((side) => (
            <button
              key={side}
              className={side === opening.side ? 'active' : ''}
              aria-pressed={side === opening.side}
              onClick={() => {
                const next = updateOpening(layout, opening, { side })
                onUpdate(next.layout, next.ref)
              }}
            >
              {side[0].toUpperCase() + side.slice(1)}
            </button>
          ))}
        </div>
        <LayoutSlider
          label="Position along the wall"
          value={o.at}
          min={-length / 2}
          max={length / 2}
          onPreview={(at) => preview({ at })}
          onCommit={onCommit}
        />
        <p className="muted small">It stays inside the wall and 15 cm from other windows and doors, pushing them aside if needed.</p>
      </section>

      <section className="card">
        <h2>Size</h2>
        <LayoutSlider
          label="Width"
          value={o.width}
          min={limits.width[0]}
          max={limits.width[1]}
          onPreview={(width) => preview({ width })}
          onCommit={onCommit}
          format={(v) => `${cm(v)} cm`}
        />
        {window ? (
          <>
            <LayoutSlider
              label="Sill height"
              value={o.bottom}
              min={OPENING_LIMITS.window.bottom[0]}
              max={OPENING_LIMITS.window.bottom[1]}
              onPreview={(bottom) => preview({ bottom })}
              onCommit={onCommit}
              format={(v) => `${cm(v)} cm`}
            />
            <LayoutSlider
              label="Top"
              value={o.top}
              min={o.bottom + OPENING_LIMITS.window.minHeight}
              max={layout.height - OPENING_LIMITS.window.belowCeiling}
              onPreview={(top) => preview({ top })}
              onCommit={onCommit}
              format={(v) => `${cm(v)} cm`}
            />
          </>
        ) : (
          <LayoutSlider
            label="Height"
            value={o.top}
            min={OPENING_LIMITS.door.top[0]}
            max={Math.min(OPENING_LIMITS.door.top[1], layout.height - OPENING_LIMITS.door.belowCeiling)}
            onPreview={(top) => preview({ top })}
            onCommit={onCommit}
            format={(v) => `${cm(v)} cm`}
          />
        )}
      </section>

      <section className="card">
        <h2>Actions</h2>
        <button className="ghost-button danger" onClick={onDelete}>
          Remove this {window ? 'window' : 'door'}
        </button>
      </section>
    </aside>
  )
}

/** Removes the selected opening (helper so App doesn't need the layout rules). */
export const withoutOpening = removeOpening
