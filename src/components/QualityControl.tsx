import { QUALITY_LABELS, type QualityLevel, type QualitySetting } from '../scene/quality'

const SETTINGS: QualitySetting[] = ['auto', 'high', 'medium', 'low']

const DESCRIPTIONS: Record<QualityLevel, string> = {
  high: 'Everything on: soft corner shadows, reflections, glow, sharp shadows.',
  medium: 'Lighter shadows and reflections. Good for tablets and older laptops.',
  low: 'No corner shadows, reflections or glow. Smoothest on phones and slow computers.',
}

/**
 * 3D quality: Auto (picked for this device, steps down if it's slow) or a fixed
 * level. Kept in this browser; not part of a design.
 */
export function QualityControl({
  setting,
  level,
  onChange,
}: {
  setting: QualitySetting
  /** The level in use (for Auto, the one it picked). */
  level: QualityLevel
  onChange: (setting: QualitySetting) => void
}) {
  return (
    <section className="card quality-card">
      <h2>3D quality</h2>
      <div className="segmented" role="group" aria-label="3D quality">
        {SETTINGS.map((option) => (
          <button
            key={option}
            className={option === setting ? 'active' : ''}
            aria-pressed={option === setting}
            onClick={() => onChange(option)}
          >
            {QUALITY_LABELS[option]}
          </button>
        ))}
      </div>
      <p className="muted small">
        {setting === 'auto' && <>Using {QUALITY_LABELS[level]}. </>}
        {DESCRIPTIONS[level]}
      </p>
    </section>
  )
}
