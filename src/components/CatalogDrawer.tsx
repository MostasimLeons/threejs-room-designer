import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, FURNITURE_INFO, type FurnitureCategory, type FurnitureType } from '../scene/furniture/catalog'
import { ROOMS, type RoomId } from '../scene/house'

interface CatalogDrawerProps {
  room: RoomId
  /** Small pictures of each type (drawn on demand; a type without one shows its initial). */
  thumbnails: Partial<Record<FurnitureType, string>>
  onAdd: (type: FurnitureType) => void
  onClose: () => void
}

/** Position of a type's category in the catalog. */
const order = (type: FurnitureType) => CATEGORIES.findIndex((c) => c.id === FURNITURE_INFO[type].category)

/** Every furniture type that belongs in this room (see FURNITURE_INFO.rooms), in catalog order (by category). */
export function catalogFor(room: RoomId): FurnitureType[] {
  return (Object.keys(FURNITURE_INFO) as FurnitureType[])
    .filter((type) => FURNITURE_INFO[type].rooms.includes(room))
    .toSorted((a, b) => order(a) - order(b))
}

/** The categories that have something for this room, each with its pieces. */
export function catalogSections(room: RoomId): { id: FurnitureCategory; label: string; types: FurnitureType[] }[] {
  const types = catalogFor(room)
  return CATEGORIES.map((c) => ({ ...c, types: types.filter((type) => FURNITURE_INFO[type].category === c.id) })).filter(
    (section) => section.types.length > 0,
  )
}

/**
 * Panel for adding furniture: the pieces that belong in this room, grouped by
 * category (Seating, Tables & desks, Storage…), with chips to show one category.
 * Each card has a picture, its options and colours. Clicking a card adds it at a
 * free spot and selects it, ready to drag into place. Esc or ✕ closes it.
 */
export function CatalogDrawer({ room, thumbnails, onAdd, onClose }: CatalogDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [filter, setFilter] = useState<FurnitureCategory | 'all'>('all')
  useEffect(() => closeRef.current?.focus(), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sections = catalogSections(room)
  // A category from another room that has nothing here falls back to everything.
  const active = sections.some((s) => s.id === filter) ? filter : 'all'
  const shown = active === 'all' ? sections : sections.filter((s) => s.id === active)

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

      {sections.length > 1 && (
        <div className="catalog-chips" role="group" aria-label="Category">
          {[{ id: 'all' as const, label: 'All' }, ...sections].map((chip) => (
            <button
              key={chip.id}
              className={`chip ${chip.id === active ? 'active' : ''}`}
              aria-pressed={chip.id === active}
              onClick={() => setFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="catalog-scroll">
        {shown.map((section) => (
          <section key={section.id} className="catalog-section" aria-label={section.label}>
            {active === 'all' && <h3 className="catalog-section-title">{section.label}</h3>}
            <div className="catalog-grid">
              {section.types.map((type) => {
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
          </section>
        ))}
      </div>
    </aside>
  )
}
