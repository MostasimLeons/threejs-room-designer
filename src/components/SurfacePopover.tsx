import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { FLOOR_OPTIONS, WALL_STYLES, WALL_SWATCHES, type FloorId, type WallFinish } from '../scene/finishes'

/**
 * Small glass cards that appear right where you clicked a wall or the floor in
 * the 3D view (pinned there by drei's <Html>). They hold the quick choices; the
 * right-hand panel has the full set, including a custom colour.
 * Pointer events stop here, so clicking a swatch doesn't also click the 3D scene.
 */

/**
 * The card itself. It opens to the bottom-right of the click, and flips left or up
 * if that would run past the edge of the 3D view or under the room bar.
 */
function PopoverCard({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [flip, setFlip] = useState({ x: false, y: false })
  useLayoutEffect(() => {
    const el = ref.current
    const view = el?.closest('.viewport')
    if (!el || !view) return
    const card = el.getBoundingClientRect()
    const bounds = view.getBoundingClientRect()
    const bottomLimit = bounds.bottom - 110 // keep clear of the room bar
    setFlip({ x: card.right > bounds.right - 8, y: card.bottom > bottomLimit })
  }, [])
  return (
    <div
      ref={ref}
      className="surface-popover"
      role="dialog"
      aria-label={label}
      style={{ transform: `translate(${flip.x ? 'calc(-100% - 24px)' : '0'}, ${flip.y ? 'calc(-100% - 24px)' : '0'})` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

interface WallPopoverProps {
  label: string
  finish: WallFinish
  onChange: (finish: WallFinish) => void
  onAllWalls: () => void
  onClose: () => void
}

export function WallPopover({ label, finish, onChange, onAllWalls, onClose }: WallPopoverProps) {
  return (
    <PopoverCard label={`${label} finish`}>
      <div className="surface-popover-head">
        <strong>{label}</strong>
        <button className="surface-popover-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
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
      <div className="surface-swatches">
        {WALL_SWATCHES.map((swatch) => (
          <button
            key={swatch.color}
            className={`surface-swatch ${swatch.color.toLowerCase() === finish.color.toLowerCase() ? 'active' : ''}`}
            style={{ background: swatch.color }}
            title={swatch.name}
            aria-label={swatch.name}
            aria-pressed={swatch.color.toLowerCase() === finish.color.toLowerCase()}
            onClick={() => onChange({ ...finish, color: swatch.color })}
          />
        ))}
      </div>
      <button className="surface-link" onClick={onAllWalls}>
        Use on all walls
      </button>
    </PopoverCard>
  )
}

interface FloorPopoverProps {
  floor: FloorId
  onChange: (floor: FloorId) => void
  onClose: () => void
}

export function FloorPopover({ floor, onChange, onClose }: FloorPopoverProps) {
  const current = FLOOR_OPTIONS.find((option) => option.id === floor)
  return (
    <PopoverCard label="Floor material">
      <div className="surface-popover-head">
        <strong>Floor · {current?.label}</strong>
        <button className="surface-popover-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="surface-swatches">
        {FLOOR_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={`surface-swatch ${option.id === floor ? 'active' : ''}`}
            style={{ background: option.swatch }}
            title={option.label}
            aria-label={option.label}
            aria-pressed={option.id === floor}
            onClick={() => onChange(option.id)}
          />
        ))}
      </div>
    </PopoverCard>
  )
}
