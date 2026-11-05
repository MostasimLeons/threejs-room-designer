import { LENGTH_UNITS, type LengthUnit } from '../utils/units'

const SHORT: Record<LengthUnit, string> = { m: 'm', cm: 'cm', ft: 'ft & in' }

/**
 * Units for every length the app shows and accepts (sizes, measurements, the
 * layout editor). Designs are always stored in metres, so switching changes
 * nothing in the design. Kept in this browser.
 */
export function UnitControl({ unit, onChange }: { unit: LengthUnit; onChange: (unit: LengthUnit) => void }) {
  return (
    <section className="card quality-card">
      <h2>Units</h2>
      <div className="segmented" role="group" aria-label="Units">
        {LENGTH_UNITS.map((u) => (
          <button
            key={u.id}
            className={u.id === unit ? 'active' : ''}
            aria-pressed={u.id === unit}
            title={u.label}
            onClick={() => onChange(u.id)}
          >
            {SHORT[u.id]}
          </button>
        ))}
      </div>
      <p className="muted small">You can type lengths in any unit, e.g. 3.5 m, 350 cm or 11′ 6″.</p>
    </section>
  )
}
