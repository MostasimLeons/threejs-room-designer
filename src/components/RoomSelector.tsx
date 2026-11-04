import { ROOM_IDS, ROOMS, type RoomId } from '../scene/house'

interface RoomSelectorProps {
  room: RoomId
  onChange: (room: RoomId) => void
}

/** Segmented control that picks which room you're viewing and editing. Same style as the view switch. */
export function RoomSelector({ room, onChange }: RoomSelectorProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Room">
      {ROOM_IDS.map((id) => (
        <button key={id} className={room === id ? 'active' : ''} aria-pressed={room === id} onClick={() => onChange(id)}>
          {ROOMS[id].label}
        </button>
      ))}
    </div>
  )
}
