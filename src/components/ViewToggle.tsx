import type { ViewMode } from '../scene/roomConfig'
import { CubeIcon, PlanIcon } from './icons'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

/** Segmented control that switches between the 3D and top-down view. */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Camera view">
      <button
        className={view === 'perspective' ? 'active' : ''}
        aria-pressed={view === 'perspective'}
        onClick={() => onChange('perspective')}
      >
        <CubeIcon />
        Perspective
      </button>
      <button className={view === 'plan' ? 'active' : ''} aria-pressed={view === 'plan'} onClick={() => onChange('plan')}>
        <PlanIcon />
        Plan
      </button>
    </div>
  )
}
