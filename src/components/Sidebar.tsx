import type { ReactNode } from 'react'
import { WALL_SIDES, type RoomId, type RoomInfo } from '../scene/house'
import { openingSelection, type OpeningRef } from '../scene/layout'
import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import { getFloorOption, hasMixedWalls, wallColorName, wallStyleLabel, type RoomFinishes } from '../scene/finishes'
import { compassName, formatTime, type RoomLighting } from '../scene/sun'

const cm = (metres: number) => Math.round(metres * 100)
/** 7 → "7.0", 7.35 → "7.35": at least one decimal, at most two. */
const metres = (value: number) => (Math.round(value * 100) % 10 === 0 ? value.toFixed(1) : value.toFixed(2))

/**
 * What's built into the room: its windows and doors (which can be selected and
 * changed in the layout editor) and decor such as the Bedroom's slat wall (fixed).
 * It comes from the room as laid out, so this list can't go out of date.
 */
function fixturesOf(info: RoomInfo) {
  const openings = WALL_SIDES.flatMap((side) =>
    (info.openings[side] ?? []).map((o, index) => ({
      name: o.label,
      detail: `${cm(o.width)} × ${cm(o.top - o.bottom)} cm`,
      color: o.kind === 'window' ? '#cfe4ef' : '#f4f1ea',
      // Windows and doors can be selected and changed (layout editor); other fixtures can't.
      ref: { side, index } as OpeningRef | undefined,
    })),
  )
  return [...openings, ...info.features.map((f) => ({ ...f, ref: undefined }))]
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
  /** Open the furniture catalog. */
  onAddFurniture: () => void
  /** Extra cards at the bottom (the 3D quality setting). */
  footer?: ReactNode
  /** The room with its current layout (size, height, windows and doors). */
  info: RoomInfo
  /** Select a window or door (to move or resize it). */
  onSelectOpening: (ref: OpeningRef) => void
}

export function Sidebar({
  items,
  finishes,
  selectedId,
  overlaps,
  onSelect,
  onShowRoom,
  lighting,
  onShowLighting,
  onAddFurniture,
  footer,
  info,
  onSelectOpening,
}: SidebarProps) {
  const { label, width, depth } = info
  const fixtures = fixturesOf(info)
  const floor = getFloorOption(finishes.floor)
  const finishRows = [
    { name: 'Floor', detail: floor.label, color: floor.swatch },
    {
      name: 'Walls',
      detail: hasMixedWalls(finishes)
        ? 'Mixed (one or more walls differ)'
        : `${wallStyleLabel(finishes.walls)} · ${wallColorName(finishes.wallColor)}`,
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
              {metres(width)} × {metres(depth)} m
            </span>
            <span className="stat-label">Size</span>
          </div>
          <div>
            <span className="stat-value">{Math.round(width * depth * 10) / 10} m²</span>
            <span className="stat-label">Area</span>
          </div>
          <div>
            <span className="stat-value">{metres(info.height)} m</span>
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
          <button className="add-button" onClick={onAddFurniture} title="Add furniture">
            + Add
          </button>
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
            <li key={f.name + f.detail}>
              {f.ref ? (
                <button
                  className={`list-button ${selectedId === openingSelection(f.ref) ? 'selected' : ''}`}
                  onClick={() => onSelectOpening(f.ref!)}
                >
                  <span className="swatch" style={{ background: f.color }} />
                  <span className="item-name">{f.name}</span>
                  <span className="item-detail">{f.detail}</span>
                </button>
              ) : (
                <>
                  <span className="swatch" style={{ background: f.color }} />
                  <span className="item-name">{f.name}</span>
                  <span className="item-detail">{f.detail} · fixed</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
      {footer}
    </aside>
  )
}
