import type { Swatch } from '../scene/furniture/catalog'

interface ColorPickerProps {
  swatches: Swatch[]
  value: string
  /** A preset was clicked: apply it and record an undo step. */
  onPick: (color: string) => void
  /** The custom picker is moving: apply live, `onCommit` records it when it closes. */
  onPreview: (color: string) => void
  onCommit: () => void
}

/** A grid of preset swatches plus a "+" button that opens the browser's colour picker. */
export function ColorPicker({ swatches, value, onPick, onPreview, onCommit }: ColorPickerProps) {
  return (
    <div className="swatch-grid">
      {swatches.map((swatch) => {
        const active = swatch.color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={swatch.color}
            className={`swatch-button ${active ? 'active' : ''}`}
            style={{ background: swatch.color }}
            onClick={() => onPick(swatch.color)}
            aria-label={swatch.name}
            aria-pressed={active}
            title={swatch.name}
          />
        )
      })}
      <label className="swatch-button custom" title="Custom colour">
        <input type="color" value={value} onChange={(e) => onPreview(e.target.value)} onBlur={onCommit} aria-label="Custom colour" />+
      </label>
    </div>
  )
}
