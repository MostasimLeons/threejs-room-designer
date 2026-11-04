import { ROOM } from '../scene/roomConfig'
import { ROOMS, WALL_SIDES, type RoomId } from '../scene/house'
import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import { getFloorOption, wallColorName, type RoomFinishes } from '../scene/finishes'
import { compassName, formatTime, type RoomLighting } from '../scene/sun'

const cm = (metres: number) => Math.round(metres * 100)

/**
 * Fixtures are built into the room, so they can't be selected or moved: its
 * windows and doors, plus decor such as the Bedroom's slat wall. All of it comes
 * from the room's entry in house.ts, so this list can't go out of date.
 */
function fixturesOf(room: RoomId) {
  const info = ROOMS[room]
  const openings = WALL_SIDES.flatMap((side) => info.openings[side] ?? []).map((o) => ({
    name: o.label,
    detail: `${cm(o.width)} × ${cm(o.top - o.bottom)} cm`,
    color: o.kind === 'window' ? '#cfe4ef' : '#f4f1ea',
  }))
  return [...openings, ...info.features]
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
  lighting: RoomLighting
  /** Open the time-of-day panel. */
  onShowLighting: () => void
}

export function Sidebar({ room, items, finishes, selectedId, overlaps, onSelect, onShowRoom, lighting, onShowLighting }: SidebarProps) {
  const { label, width, depth } = ROOMS[room]
  const fixtures = fixturesOf(room)
  const floor = getFloorOption(finishes.floor)
  const finishRows = [
    { name: 'Floor', detail: floor.label, color: floor.swatch },
    {
      name: 'Walls',
      detail: `${finishes.walls === 'tiles' ? 'Tiles' : 'Paint'} · ${wallColorName(finishes.wallColor)}`,
      color: finishes.wallColor,
    },
  ]

  return (
    <aside className="sidebar">
      <section className="card">
        <h2>{label}</h2>
        <div className="stats">
          <div>
            <span className="stat-value">
              {width.toFixed(1)} × {depth.toFixed(1)} m
            </span>
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
              <button
                className={`list-button ${selectedId === null ? 'selected-soft' : ''}`}
                onClick={onShowRoom}
                title="Edit room finishes"
              >
                <span className="swatch" style={{ background: f.color }} />
                <span className="item-name">{f.name}</span>
                <span className="item-detail">{f.detail}</span>
              </button>
            </li>
          ))}
          <li>
            <button className="list-button" onClick={onShowLighting} title="Change the time of day">
              <span className="swatch" style={{ background: 'linear-gradient(135deg, #f4b38c, #e4f0f7)' }} />
              <span className="item-name">Light</span>
              <span className="item-detail">
                {formatTime(lighting.time)} · faces {compassName(lighting.orientation)}
              </span>
            </button>
          </li>
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
                      {' '}
                      ⚠
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
