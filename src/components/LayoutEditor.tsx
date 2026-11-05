import { useState } from 'react'
import { WALL_SIDES, type RoomLayout, type WallSide } from '../scene/house'
import {
  addOpening,
  atFromLeft,
  distanceFromLeft,
  LAYOUT_LIMITS,
  OPENING_LIMITS,
  removeOpening,
  updateOpening,
  wallLength,
  type OpeningChanges,
  type OpeningRef,
} from '../scene/layout'
import { wallLabel } from '../scene/selection'
import { formatArea, formatLength, parseLength, useUnit } from '../utils/units'

/**
 * The room layout editor (Phases 12 and 14): the Room size card (width, depth,
 * ceiling height, wall thickness, and the list of windows and doors) and the
 * panel for one selected window or door. Every length can be dragged or typed in
 * metres, centimetres or feet and inches. Every change goes through layout.ts,
 * which keeps the room valid.
 */

/** Props that make a slider record ONE undo step when you let go. */
function commitHandlers(onCommit: () => void) {
  return { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit }
}

interface LengthFieldProps {
  label: string
  /** In metres. */
  value: number
  min: number
  max: number
  /** While dragging the slider (recorded as one undo step on release). */
  onPreview: (value: number) => void
  onCommit: () => void
  /** A typed value (one undo step). */
  onSet: (value: number) => void
  step?: number
}

/**
 * A length you can drag (slider) or type exactly, in any unit ("3.5 m", "350 cm",
 * "11'6"). Shown in the unit chosen in the sidebar. Values outside the range are
 * brought within it by the layout rules.
 */
export function LengthField({ label, value, min, max, onPreview, onCommit, onSet, step = 0.01 }: LengthFieldProps) {
  const unit = useUnit()
  const shown = formatLength(value, unit)
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const apply = () => {
    if (draft === null) return
    const parsed = parseLength(draft, unit)
    if (parsed === null) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setDraft(null)
    if (Math.abs(parsed - value) > 1e-6) onSet(parsed)
  }
  return (
    <div className="length-field">
      <label className="field">
        <span>{label}</span>
        <input
          className={`length-input ${invalid ? 'invalid' : ''}`}
          value={draft ?? shown}
          aria-label={`${label}, type a length`}
          aria-invalid={invalid}
          title={'Type a length: 3.5 m, 350 cm or 11\' 6"'}
          onFocus={(e) => {
            setDraft(shown)
            e.target.select()
          }}
          onChange={(e) => {
            setDraft(e.target.value)
            setInvalid(false)
          }}
          onBlur={() => {
            apply()
            setDraft(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              apply()
              e.currentTarget.blur()
            } else if (e.key === 'Escape') {
              setDraft(null)
              setInvalid(false)
              e.currentTarget.blur()
            }
          }}
        />
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
    </div>
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

/** Room size (inside width and depth, ceiling height, wall thickness) and the room's windows and doors. */
export function LayoutCard({ layout, standard, onUpdate, onPreview, onCommit, onReset, onSelectOpening, onMessage }: LayoutCardProps) {
  const unit = useUnit()
  const openings = WALL_SIDES.flatMap((side) => (layout.openings[side] ?? []).map((o, index) => ({ o, ref: { side, index } })))
  const add = (kind: 'window' | 'door') => {
    const result = addOpening(layout, kind)
    if (!result) return onMessage(`No wall has room for another ${kind}. Make the room bigger or remove one first.`)
    onUpdate(result.layout)
    onSelectOpening(result.ref)
  }
  const field = (key: 'width' | 'depth' | 'height' | 'wallThickness', label: string, step?: number) => (
    <LengthField
      label={label}
      value={layout[key]}
      min={LAYOUT_LIMITS[key][0]}
      max={LAYOUT_LIMITS[key][1]}
      step={step}
      onPreview={(v) => onPreview({ ...layout, [key]: v })}
      onCommit={onCommit}
      onSet={(v) => onUpdate({ ...layout, [key]: v })}
    />
  )
  return (
    <section className="card layout-card">
      <h2>Room size</h2>
      {field('width', 'Width (inside)')}
      {field('depth', 'Depth (inside)')}
      {field('height', 'Ceiling height')}
      {field('wallThickness', 'Wall thickness', 0.005)}
      <p className="muted small">
        {formatArea(layout.width * layout.depth, unit)} floor · measured wall to wall inside the room; thicker walls grow outward. Furniture
        is moved back inside if the room gets smaller.
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
                {wallLabel(ref.side)} · {formatLength(o.width, unit)}
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

/** Right-hand panel for a selected window or door: which wall, where (from the left corner), how big. */
export function OpeningPanel({ layout, opening, onUpdate, onPreview, onCommit, onDeselect, onDelete }: OpeningPanelProps) {
  const unit = useUnit()
  const o = layout.openings[opening.side]?.[opening.index]
  if (!o) return null
  const length = wallLength(opening.side, layout)
  const window = o.kind === 'window'
  const change = (changes: OpeningChanges, live: boolean) => {
    const next = updateOpening(layout, opening, changes)
    if (live) onPreview(next.layout, next.ref)
    else onUpdate(next.layout, next.ref)
  }
  const fromLeft = distanceFromLeft(opening.side, layout, o)
  const toAt = (left: number) => atFromLeft(opening.side, layout, o.width, left)
  const limits = window ? OPENING_LIMITS.window : OPENING_LIMITS.door
  const height = o.top - o.bottom
  return (
    <aside className="properties" aria-label={`${o.label} settings`}>
      <section className="card">
        <div className="panel-header">
          <div>
            <h2>{window ? 'Window' : 'Door'}</h2>
            <p className="item-title">{o.label}</p>
            <p className="muted">
              {wallLabel(opening.side)} · {formatLength(o.width, unit)} × {formatLength(height, unit)}
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
        <LengthField
          label="From the left corner"
          value={fromLeft}
          min={0}
          max={Math.max(length - o.width, 0)}
          onPreview={(v) => change({ at: toAt(v) }, true)}
          onCommit={onCommit}
          onSet={(v) => change({ at: toAt(v) }, false)}
        />
        <p className="muted small">
          Measured to its edge, facing the wall from inside the room ({formatLength(Math.max(length - o.width - fromLeft, 0), unit)} to the
          right corner). It stays inside the wall and 15 cm from other windows and doors, pushing them aside if needed.
        </p>
      </section>

      <section className="card">
        <h2>Size</h2>
        <LengthField
          label="Width"
          value={o.width}
          min={limits.width[0]}
          max={limits.width[1]}
          onPreview={(width) => change({ width }, true)}
          onCommit={onCommit}
          onSet={(width) => change({ width }, false)}
        />
        {window ? (
          <>
            <LengthField
              label="Sill height"
              value={o.bottom}
              min={OPENING_LIMITS.window.bottom[0]}
              max={OPENING_LIMITS.window.bottom[1]}
              onPreview={(bottom) => change({ bottom }, true)}
              onCommit={onCommit}
              onSet={(bottom) => change({ bottom }, false)}
            />
            <LengthField
              label="Top"
              value={o.top}
              min={o.bottom + OPENING_LIMITS.window.minHeight}
              max={layout.height - OPENING_LIMITS.window.belowCeiling}
              onPreview={(top) => change({ top }, true)}
              onCommit={onCommit}
              onSet={(top) => change({ top }, false)}
            />
          </>
        ) : (
          <LengthField
            label="Height"
            value={o.top}
            min={OPENING_LIMITS.door.top[0]}
            max={Math.min(OPENING_LIMITS.door.top[1], layout.height - OPENING_LIMITS.door.belowCeiling)}
            onPreview={(top) => change({ top }, true)}
            onCommit={onCommit}
            onSet={(top) => change({ top }, false)}
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
