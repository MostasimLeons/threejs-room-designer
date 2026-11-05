import { FURNITURE_INFO, getVariant, isWallMounted, type FurnitureItem } from '../scene/furniture/catalog'
import type { RoomFinishes } from '../scene/finishes'
import { ROOMS, type RoomId, type RoomInfo, type RoomLayout } from '../scene/house'
import type { OpeningRef } from '../scene/layout'
import { LayoutCard, LengthField, OpeningPanel } from './LayoutEditor'
import { itemSize, sizeLimits, type Size3 } from '../scene/furniture/sizes'
import { useUnit } from '../utils/units'
import type { FinishChanges, ItemChanges } from '../state/useDesignHistory'
import { ColorPicker } from './ColorPicker'
import { modelFor } from '../scene/furniture/models'
import { formatPrice, PRODUCTS, productPrice, productSize } from '../scene/furniture/products'
import { FRAME_FINISHES } from '../scene/furniture/frames'
import { RoomPanel } from './RoomPanel'
import { WallPanel } from './WallPanel'
import { setAllWalls, setWallFinish, wallFinishOf } from '../scene/finishes'
import type { WallSide } from '../scene/house'
import { wallLabel } from '../scene/selection'

interface PropertiesPanelProps {
  /** The room being edited: sets the slider ranges and the Room panel title. */
  room: RoomId
  item: FurnitureItem | null
  /** The selected wall, if a wall (not furniture) is selected. */
  wall: WallSide | null
  finishes: RoomFinishes
  /** Names of what the selected item currently overlaps (other pieces, built-in units). */
  overlapping: string[]
  /** Apply a change and record an undo step. */
  onUpdate: (changes: ItemChanges) => void
  /** Apply a change live (while sliding); `onCommit` records it when you let go. */
  onPreview: (changes: ItemChanges) => void
  onUpdateFinishes: (changes: FinishChanges) => void
  onPreviewFinishes: (changes: FinishChanges) => void
  onCommit: () => void
  onDeselect: () => void
  /** Copy the selected piece next to itself. */
  onDuplicate: () => void
  /** Remove the selected piece (undoable). */
  onDelete: () => void
  /** Other rooms this piece may go in (see FURNITURE_INFO.rooms). */
  moveTargets: RoomId[]
  onMoveTo: (room: RoomId) => void
  /** The room with its current layout. */
  info: RoomInfo
  /** The layout the editor changes (the standard one if the room has none of its own). */
  layout: RoomLayout
  /** True when the room has its standard layout. */
  layoutStandard: boolean
  /** The selected window or door, if one is selected. */
  opening: OpeningRef | null
  onUpdateLayout: (layout: RoomLayout, select?: OpeningRef) => void
  onPreviewLayout: (layout: RoomLayout, select?: OpeningRef) => void
  onResetLayout: () => void
  onSelectOpening: (ref: OpeningRef) => void
  onDeleteOpening: () => void
  onMessage: (text: string) => void
  /** View the selected piece (or, with nothing selected, the room) in AR. */
  onViewInAr: () => void
}

/** Props that make a slider record ONE undo step when you let go. */
function commitHandlers(onCommit: () => void) {
  return { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit }
}

/** Right-hand panel: edits the selected furniture, or the room when nothing is selected. */
export function PropertiesPanel(props: PropertiesPanelProps) {
  const { item, overlapping, onUpdate, onPreview, onCommit, onDeselect } = props
  const unit = useUnit()
  if (props.wall) {
    const { wall, finishes, onUpdateFinishes, onPreviewFinishes } = props
    return (
      <WallPanel
        label={wallLabel(wall)}
        finish={wallFinishOf(finishes, wall)}
        custom={Boolean(finishes.wallFinishes?.[wall])}
        onChange={(finish) => onUpdateFinishes(setWallFinish(finishes, wall, finish))}
        onPreview={(finish) => onPreviewFinishes(setWallFinish(finishes, wall, finish))}
        onCommit={onCommit}
        onAllWalls={() => onUpdateFinishes(setAllWalls(wallFinishOf(finishes, wall)))}
        onMatchRoom={() => onUpdateFinishes(setWallFinish(finishes, wall, { color: finishes.wallColor, style: finishes.walls }))}
        onDeselect={onDeselect}
      />
    )
  }
  if (props.opening) {
    return (
      <OpeningPanel
        layout={props.layout}
        opening={props.opening}
        onUpdate={(layout, ref) => props.onUpdateLayout(layout, ref)}
        onPreview={(layout, ref) => props.onPreviewLayout(layout, ref)}
        onCommit={onCommit}
        onDeselect={onDeselect}
        onDelete={props.onDeleteOpening}
      />
    )
  }
  if (!item) {
    return (
      <RoomPanel {...props}>
        <LayoutCard
          layout={props.layout}
          standard={props.layoutStandard}
          onUpdate={(layout) => props.onUpdateLayout(layout)}
          onPreview={(layout) => props.onPreviewLayout(layout)}
          onCommit={onCommit}
          onReset={props.onResetLayout}
          onSelectOpening={props.onSelectOpening}
          onMessage={props.onMessage}
        />
      </RoomPanel>
    )
  }
  const { width, depth } = props.info

  const info = FURNITURE_INFO[item.type]
  const variant = getVariant(item.type, item.variant)
  // Real models whose texture covers several materials can't be recoloured (see models.ts).
  const model = modelFor(item.type, item.variant)
  const fixedFinish = model !== undefined && model.tint.length === 0
  const [x, z] = item.position

  return (
    // item-properties: on phones this panel slides up over the 3D view as a sheet (index.css).
    <aside className="properties item-properties" aria-label={`${info.label} settings`}>
      <section className="card">
        <div className="panel-header">
          <div>
            <h2>Properties</h2>
            <p className="item-title">{info.label}</p>
            <p className="muted">
              {variant.label} · {item.size ? 'custom size' : variant.detail}
            </p>
          </div>
          <button className="icon-button" onClick={onDeselect} aria-label="Deselect">
            ✕
          </button>
        </div>
        {/* Product card: size, what it's made of, and an example price (products.ts) */}
        <div className="product-card">
          <p className="product-description">{PRODUCTS[item.type].description}</p>
          <dl className="product-facts">
            <dt>Size</dt>
            <dd>{productSize(item, unit)}</dd>
            <dt>Made of</dt>
            <dd>{PRODUCTS[item.type].materials}</dd>
            <dt>Price</dt>
            <dd>
              <strong>{formatPrice(productPrice(item.type, item.variant))}</strong> <span className="muted small">example</span>
            </dd>
          </dl>
        </div>
        {overlapping.length > 0 && (
          <p className="warning" role="status">
            Overlaps {overlapping.join(' and ')}. Move or rotate it to make space.
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

      <SizeCard item={item} round={Boolean(variant.round)} onUpdate={onUpdate} onPreview={onPreview} onCommit={onCommit} />

      {fixedFinish ? (
        <section className="card">
          <h2>Colour</h2>
          <p className="muted small">
            This model keeps its own natural finish ({variant.label.toLowerCase()}). Pick another option to choose a colour.
          </p>
        </section>
      ) : (
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
      )}

      {info.frame && !model && (
        <section className="card">
          <h2>{info.frame.label}</h2>
          <div className="frame-options" role="group" aria-label={info.frame.label}>
            {[undefined, ...info.frame.options].map((id) => {
              const active = item.frame === id
              const name = id ? FRAME_FINISHES[id].name : 'Standard'
              return (
                <button
                  key={id ?? 'standard'}
                  className={`frame-chip ${active ? 'active' : ''}`}
                  aria-pressed={active}
                  // "Standard" removes the choice, so the piece looks as it always did.
                  onClick={() => onUpdate({ frame: id })}
                >
                  <span
                    className={`frame-swatch ${id ? '' : 'standard'}`}
                    style={id ? { background: FRAME_FINISHES[id].swatch } : undefined}
                    aria-hidden="true"
                  />
                  {name}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {isWallMounted(item.type) ? (
        <section className="card">
          <h2>On the wall</h2>
          <p className="muted small">
            Hangs on the nearest wall, facing into the room. Drag it along a wall, or towards another wall to move it there.
          </p>
        </section>
      ) : (
        <section className="card">
          <h2>Rotation</h2>
          <div className="rotate-row">
            <button className="ghost-button" onClick={() => onUpdate({ rotation: item.rotation - 45 })} aria-label="Rotate left 45 degrees">
              ⟲ 45°
            </button>
            <output className="rotation-value">{item.rotation}°</output>
            <button
              className="ghost-button"
              onClick={() => onUpdate({ rotation: item.rotation + 45 })}
              aria-label="Rotate right 45 degrees"
            >
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
      )}

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
        <p className="muted small">Tip: drag it in the 3D view (it snaps to walls; hold Alt to place freely), or use the arrow keys.</p>
      </section>

      <section className="card">
        <h2>Actions</h2>
        <div className="action-row">
          <button className="ghost-button" onClick={props.onDuplicate} title="Duplicate (Ctrl+D)">
            Duplicate
          </button>
          <button className="ghost-button danger" onClick={props.onDelete} title="Delete (Del)">
            Delete
          </button>
        </div>
        <button
          className="ghost-button ar-button"
          onClick={props.onViewInAr}
          title="See it at real size in your own room (phone or tablet)"
        >
          View in AR
        </button>
        {props.moveTargets.length > 0 && (
          <label className="field move-field">
            <span>Move to another room</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) props.onMoveTo(e.target.value as RoomId)
              }}
            >
              <option value="">Choose a room…</option>
              {props.moveTargets.map((target) => (
                <option key={target} value={target}>
                  {ROOMS[target].label}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>
    </aside>
  )
}

interface SizeCardProps {
  item: FurnitureItem
  round: boolean
  onUpdate: (changes: ItemChanges) => void
  onPreview: (changes: ItemChanges) => void
  onCommit: () => void
}

/**
 * Custom width, depth and height (Phase 15), dragged or typed in any unit. Each
 * option has limits (see sizes.ts); "Standard size" goes back to the option's own.
 * A slider drag is one undo step, a typed value is one step.
 */
function SizeCard({ item, round, onUpdate, onPreview, onCommit }: SizeCardProps) {
  const size = itemSize(item)
  const limits = sizeLimits(item.type, item.variant)
  const field = (index: 0 | 1 | 2, label: string, range: [number, number]) => {
    const withValue = (value: number): Size3 => {
      const next: Size3 = [...size]
      next[index] = value
      if (round && index === 0) next[1] = value
      return next
    }
    return (
      <LengthField
        label={label}
        value={size[index]}
        min={range[0]}
        max={range[1]}
        onPreview={(value) => onPreview({ size: withValue(value) })}
        onCommit={onCommit}
        onSet={(value) => onUpdate({ size: withValue(value) })}
      />
    )
  }
  return (
    <section className="card size-card">
      <h2>Size</h2>
      {field(0, round ? 'Diameter' : 'Width', limits.width)}
      {!round && field(1, 'Depth', limits.depth)}
      {field(2, 'Height', limits.height)}
      <p className="muted small">
        {item.size ? 'Custom size. ' : 'The standard size for this option. '}
        Chairs, drawer units and PCs can tuck under desks and tables; a piece too tall for the space under one is flagged.
        {item.size && (
          <>
            {' '}
            <button className="text-button" onClick={() => onUpdate({ size: undefined })}>
              Back to the standard size
            </button>
          </>
        )}
      </p>
    </section>
  )
}
