import { DOOR_OPENING, ROOM, WINDOW_OPENING } from '../scene/roomConfig'
import { BEDROOM_WINDOW, CONNECTING_DOOR, ROOMS, type RoomId } from '../scene/house'
import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import { getFloorOption, wallColorName, type RoomFinishes } from '../scene/finishes'

const cm = (metres: number) => Math.round(metres * 100)

const size = (opening: { width: number; top: number; bottom: number }) =>
  `${cm(opening.width)} × ${cm(opening.top - opening.bottom)} cm`

// Fixtures are built into the walls, so they can't be selected or moved.
// Their sizes come from roomConfig / house, so this list can't go out of date.
const FIXTURES: Record<RoomId, { name: string; detail: string; color: string }[]> = {
  living: [
    { name: 'Window', detail: size(WINDOW_OPENING), color: '#cfe4ef' },
    { name: 'Door', detail: size(DOOR_OPENING), color: '#f4f1ea' },
    { name: 'Door to bedroom', detail: size(CONNECTING_DOOR), color: '#f4f1ea' },
  ],
  bedroom: [
    { name: 'Window + curtains', detail: size(BEDROOM_WINDOW), color: '#cfe4ef' },
    { name: 'Door to living room', detail: size(CONNECTING_DOOR), color: '#f4f1ea' },
    { name: 'Oak slat wall', detail: 'behind bed', color: '#c49a6c' },
    { name: 'Cream carpet', detail: '320 × 250 cm', color: '#ece3d2' },
  ],
}

interface SidebarProps {
  /** The room being viewed; everything in the sidebar is about this room. */
  room: RoomId
  items: FurnitureItem[]
  finishes: RoomFinishes
  selectedId: string | null
  /** Items that overlap another item (see findOverlaps). */
  overlaps: Map<string, string[]>
  onSelect: (id: string) => void
  /** Deselect everything so the right panel shows the room finishes. */
  onShowRoom: () => void
}

export function Sidebar({ room, items, finishes, selectedId, overlaps, onSelect, onShowRoom }: SidebarProps) {
  const { label, width, depth } = ROOMS[room]
  const fixtures = FIXTURES[room]
  const floor = getFloorOption(finishes.floor)
  const finishRows = [
    { name: 'Floor', detail: floor.label, color: floor.swatch },
    { name: 'Walls', detail: wallColorName(finishes.wallColor), color: finishes.wallColor },
  ]

  return (
    <aside className="sidebar">
      <section className="card">
        <h2>{label}</h2>
        <div className="stats">
          <div>
            <span className="stat-value">{width.toFixed(1)} × {depth.toFixed(1)} m</span>
            <span className="stat-label">Size</span>
          </div>
          <div>
            <span className="stat-value">{width * depth} m²</span>
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
          Objects <span className="count">{items.length + fixtures.length}</span>
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
          {fixtures.map((f) => (
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
