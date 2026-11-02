import type { ViewMode } from '../scene/roomConfig'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 0v9m0 0 8-4.5M12 12l-8-4.5" />
    </svg>
  )
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v16H4zM4 11h7V4M11 20v-5h9" />
    </svg>
  )
}

/** Segmented control that switches between the 3D and top-down view. */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Camera view">
      <button className={view === 'perspective' ? 'active' : ''} aria-pressed={view === 'perspective'} onClick={() => onChange('perspective')}>
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
