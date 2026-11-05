import { useEffect, useRef } from 'react'
import { FURNITURE_INFO, type FurnitureType } from '../scene/furniture/catalog'
import { ROOMS, type RoomId } from '../scene/house'

interface CatalogDrawerProps {
  room: RoomId
  /** Small pictures of each type (drawn on demand; a type without one shows its initial). */
  thumbnails: Partial<Record<FurnitureType, string>>
  onAdd: (type: FurnitureType) => void
  onClose: () => void
}

/** Every furniture type that belongs in this room (see FURNITURE_INFO.rooms). */
export function catalogFor(room: RoomId): FurnitureType[] {
  return (Object.keys(FURNITURE_INFO) as FurnitureType[]).filter((type) => FURNITURE_INFO[type].rooms.includes(room))
}

/**
 * Panel for adding furniture: one card per piece that belongs in this room, with a
 * picture, its options and colours. Clicking a card adds it at a free spot and
 * selects it, ready to drag into place. Esc or ✕ closes it.
 */
export function CatalogDrawer({ room, thumbnails, onAdd, onClose }: CatalogDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside className="catalog-drawer" role="dialog" aria-label={`Add furniture to the ${ROOMS[room].label}`}>
      <div className="catalog-head">
        <div>
          <h2>Add furniture</h2>
          <p className="muted small">For the {ROOMS[room].label}. Pick a piece to add it.</p>
        </div>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="catalog-grid">
        {catalogFor(room).map((type) => {
          const info = FURNITURE_INFO[type]
          return (
            <button key={type} className="catalog-card" onClick={() => onAdd(type)}>
              {thumbnails[type] ? (
                <img src={thumbnails[type]} alt="" className="catalog-thumb" draggable={false} />
              ) : (
                <span className="catalog-thumb placeholder" aria-hidden="true">
                  {info.label[0]}
                </span>
              )}
              <span className="catalog-name">{info.label}</span>
              <span className="catalog-detail">
                {info.variants.length} {info.variantLabel.toLowerCase()} options · {info.swatches.length} colours
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
