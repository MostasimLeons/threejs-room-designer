import { DOOR_OPENING, ROOM, WINDOW_OPENING } from '../scene/roomConfig'
import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import { getFloorOption, wallColorName, type RoomFinishes } from '../scene/finishes'

const cm = (metres: number) => Math.round(metres * 100)

// Fixtures are built into the walls, so they can't be selected or moved.
// Their sizes come from roomConfig, so this list can't go out of date.
const FIXTURES = [
  { name: 'Window', detail: `${cm(WINDOW_OPENING.width)} × ${cm(WINDOW_OPENING.top - WINDOW_OPENING.bottom)} cm`, color: '#cfe4ef' },
  { name: 'Door', detail: `${cm(DOOR_OPENING.width)} × ${cm(DOOR_OPENING.top - DOOR_OPENING.bottom)} cm`, color: '#f4f1ea' },
]

interface SidebarProps {
  items: FurnitureItem[]
  finishes: RoomFinishes
  selectedId: string | null
  /** Items that overlap another item (see findOverlaps). */
  overlaps: Map<string, string[]>
  onSelect: (id: string) => void
  /** Deselect everything so the right panel shows the room finishes. */
  onShowRoom: () => void
}

export function Sidebar({ items, finishes, selectedId, overlaps, onSelect, onShowRoom }: SidebarProps) {
  const floor = getFloorOption(finishes.floor)
  const finishRows = [
    { name: 'Floor', detail: floor.label, color: floor.swatch },
    { name: 'Walls', detail: wallColorName(finishes.wallColor), color: finishes.wallColor },
  ]

  return (
    <aside className="sidebar">
      <section className="card">
        <h2>Room</h2>
        <div className="stats">
          <div>
            <span className="stat-value">{ROOM.width.toFixed(1)} × {ROOM.depth.toFixed(1)} m</span>
            <span className="stat-label">Size</span>
          </div>
          <div>
            <span className="stat-value">{ROOM.width * ROOM.depth} m²</span>
            <span className="stat-label">Area</span>
          </div>
          <div>
            <span className="stat-value">{ROOM.height.toFixed(1)} m</span>
            <span className="stat-label">Ceiling</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Finishes</h2>
        <ul className="list">
          {finishRows.map((f) => (
            <li key={f.name}>
              <button className={`list-button ${selectedId === null ? 'selected-soft' : ''}`} onClick={onShowRoom} title="Edit room finishes">
                <span className="swatch" style={{ background: f.color }} />
                <span className="item-name">{f.name}</span>
                <span className="item-detail">{f.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card grow">
        <h2>
          Objects <span className="count">{items.length + FIXTURES.length}</span>
        </h2>
        <ul className="list">
          {items.map((item) => (
            <li key={item.id}>
              <button className={`list-button ${item.id === selectedId ? 'selected' : ''}`} onClick={() => onSelect(item.id)}>
                <span className="swatch" style={{ background: item.color }} />
                <span className="item-name">
                  {FURNITURE_INFO[item.type].label}
                  {overlaps.has(item.id) && (
                    <span className="overlap-badge" title="Overlaps another piece">
                      {' '}⚠
                    </span>
                  )}
                </span>
                <span className="item-detail">{getVariant(item.type, item.variant).label}</span>
              </button>
            </li>
          ))}
          {FIXTURES.map((f) => (
            <li key={f.name}>
              <span className="swatch" style={{ background: f.color }} />
              <span className="item-name">{f.name}</span>
              <span className="item-detail">{f.detail} · fixed</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
