import { useEffect, useRef, type ComponentType, type KeyboardEvent } from 'react'
import { ROOM_IDS, ROOMS, type RoomId } from '../scene/house'
import { BathroomIcon, BedroomIcon, DiningRoomIcon, KitchenIcon, LivingRoomIcon } from './icons'

const ICONS: Record<RoomId, ComponentType> = {
  living: LivingRoomIcon,
  bedroom: BedroomIcon,
  dining: DiningRoomIcon,
  kitchen: KitchenIcon,
  bathroom: BathroomIcon,
}

interface RoomBarProps {
  room: RoomId
  onChange: (room: RoomId) => void
}

/**
 * Frosted-glass bar along the bottom of the 3D view, one button per room.
 * The current room is filled in dark and has a small bar under its name, so it
 * stands out without relying on colour alone. On phones it sticks to the bottom
 * of the screen and uses the short room names.
 *
 * Keyboard: Tab reaches it, ← / → move between rooms, Enter or Space switches.
 * The number keys 1–5 switch rooms from anywhere (see useKeyboardShortcuts).
 */
export function RoomBar({ room, onChange }: RoomBarProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  // If the bar ever has to scroll sideways, keep the current room in view.
  useEffect(() => {
    buttons.current[ROOM_IDS.indexOf(room)]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [room])

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    // Don't let the global shortcuts also nudge a selected piece of furniture.
    event.preventDefault()
    event.stopPropagation()
    const step = event.key === 'ArrowRight' ? 1 : -1
    buttons.current[(index + step + ROOM_IDS.length) % ROOM_IDS.length]?.focus()
  }

  return (
    <nav className="room-bar" aria-label="Rooms">
      {ROOM_IDS.map((id, index) => {
        const Icon = ICONS[id]
        const active = id === room
        const { label, shortLabel } = ROOMS[id]
        return (
          <button
            key={id}
            ref={(el) => {
              buttons.current[index] = el
            }}
            className={`room-tab ${active ? 'active' : ''}`}
            aria-current={active ? 'true' : undefined}
            aria-label={label}
            title={`${label} (${index + 1})`}
            onClick={() => onChange(id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <Icon />
            <span className="room-label" aria-hidden="true">
              <span className="long">{label}</span>
              <span className="short">{shortLabel}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
