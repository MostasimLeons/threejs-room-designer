import { cameraViews, type CameraViewId } from '../scene/cameraViews'
import type { RoomId } from '../scene/house'

interface CameraViewPickerProps {
  room: RoomId
  value: CameraViewId
  onChange: (id: CameraViewId) => void
}

/** Overview | Eye level | Corner: the camera glides to the chosen view (Perspective only). */
export function CameraViewPicker({ room, value, onChange }: CameraViewPickerProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Camera view">
      {cameraViews(room).map((view) => (
        <button
          key={view.id}
          className={view.id === value ? 'active' : ''}
          aria-pressed={view.id === value}
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
