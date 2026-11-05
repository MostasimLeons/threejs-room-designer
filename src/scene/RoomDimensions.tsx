import { useEffect, useState } from 'react'
import { Html, Line } from '@react-three/drei'
import { WALL_SIDES, type Opening, type WallSide } from './house'
import { wallLength, type OpeningRef } from './layout'
import { useRoomInfo } from './roomContext'
import { formatLength, useUnit } from '../utils/units'

type Vec3 = [number, number, number]

const LINE = '#24221f'
const ACCENT = '#2f6fed'
const Y = 0.02 // just above the floor

/** A dimension line with end ticks and a label in the middle. */
function Dimension({ from, to, label, color = LINE, tick = 0.12 }: { from: Vec3; to: Vec3; label: string; color?: string; tick?: number }) {
  // Ticks across the line, on the floor.
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]
  const length = Math.hypot(dx, dz) || 1
  const nx = (-dz / length) * (tick / 2)
  const nz = (dx / length) * (tick / 2)
  const tickAt = (p: Vec3): [Vec3, Vec3] => [
    [p[0] - nx, p[1], p[2] - nz],
    [p[0] + nx, p[1], p[2] + nz],
  ]
  const mid: Vec3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
  return (
    <group userData={{ noExport: true }}>
      <Line points={[from, to]} color={color} lineWidth={1.5} />
      <Line points={tickAt(from)} color={color} lineWidth={1.5} />
      <Line points={tickAt(to)} color={color} lineWidth={1.5} />
      <Html position={mid} center zIndexRange={[2, 0]} className="dimension-anchor">
        <span className={`dimension-label ${color === ACCENT ? 'size' : 'room'}`}>{label}</span>
      </Html>
    </group>
  )
}

/** A point on the inside face of a wall: `along` in room coordinates, `inset` metres into the room. */
function onWall(side: WallSide, size: { width: number; depth: number }, along: number, inset: number): Vec3 {
  const hw = size.width / 2
  const hd = size.depth / 2
  switch (side) {
    case 'back':
      return [along, Y, -hd + inset]
    case 'front':
      return [along, Y, hd - inset]
    case 'left':
      return [-hw + inset, Y, along]
    case 'right':
      return [hw - inset, Y, along]
  }
}

/**
 * The room's measurements in the 3D view and the plan (Phase 14): inside width and
 * depth as dimension lines outside the walls nearest the camera, the ceiling height
 * in a back corner, each window's and door's width, and for a selected window or
 * door its distance to both corners of its wall. All in the chosen unit.
 */
export function RoomDimensions({ selected }: { selected: OpeningRef | null }) {
  const info = useRoomInfo()
  const unit = useUnit()
  const { width: W, depth: D, height: H, wallThickness: T } = info
  const out = T + 0.4 // outside the wall
  const side = Math.sign(info.camera.position[0]) || 1 // the side the overview looks from
  const openings = WALL_SIDES.flatMap((wall) => (info.openings[wall] ?? []).map((o, index) => ({ wall, o, index })))
  // drei's Html re-creates its DOM root once the canvas's event target connects; a
  // label mounted before that is left empty. Mount the labels one frame later.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  if (!ready) return null

  return (
    <group userData={{ noExport: true }}>
      {/* Width along the front, depth along the side the camera is on */}
      <Dimension from={[-W / 2, Y, D / 2 + out]} to={[W / 2, Y, D / 2 + out]} label={formatLength(W, unit)} />
      <Dimension from={[side * (W / 2 + out), Y, -D / 2]} to={[side * (W / 2 + out), Y, D / 2]} label={formatLength(D, unit)} />
      {/* Ceiling height, up the far back corner */}
      <Dimension
        from={[-side * (W / 2 - 0.05), 0, -D / 2 + 0.05]}
        to={[-side * (W / 2 - 0.05), H, -D / 2 + 0.05]}
        label={formatLength(H, unit)}
        tick={0.2}
      />

      {openings.map(({ wall, o, index }) => (
        <OpeningLabels
          key={`${wall}-${index}`}
          wall={wall}
          o={o}
          size={info}
          unit={unit}
          selected={selected?.side === wall && selected.index === index}
        />
      ))}
    </group>
  )
}

function OpeningLabels({
  wall,
  o,
  size,
  unit,
  selected,
}: {
  wall: WallSide
  o: Opening
  size: { width: number; depth: number }
  unit: ReturnType<typeof useUnit>
  selected: boolean
}) {
  const length = wallLength(wall, size)
  const inset = 0.22
  // Along-wall positions (room coordinates) of the opening's two edges and the wall's two corners.
  const a = o.at - o.width / 2
  const b = o.at + o.width / 2
  const half = length / 2
  return (
    <>
      <Dimension
        from={onWall(wall, size, a, inset)}
        to={onWall(wall, size, b, inset)}
        label={formatLength(o.width, unit)}
        color={selected ? ACCENT : LINE}
        tick={0.1}
      />
      {/* Selected: from each corner of the wall to the opening's nearer edge (with the width, they make up the wall's length). */}
      {selected && a + half > 0.01 && (
        <Dimension
          from={onWall(wall, size, -half, inset + 0.3)}
          to={onWall(wall, size, a, inset + 0.3)}
          label={formatLength(a + half, unit)}
          color={ACCENT}
          tick={0.1}
        />
      )}
      {selected && half - b > 0.01 && (
        <Dimension
          from={onWall(wall, size, b, inset + 0.3)}
          to={onWall(wall, size, half, inset + 0.3)}
          label={formatLength(half - b, unit)}
          color={ACCENT}
          tick={0.1}
        />
      )}
    </>
  )
}
