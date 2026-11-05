import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, type RootState, type ThreeEvent } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { canGoOnSurface, getVariant, isSurfaceHost, itemFootprint, isWallMounted, type FurnitureItem } from './furniture/catalog'
import { elevationOf, onTopOf, surfaceHeight } from './furniture/surfaces'
import { Cutaway } from './Cutaway'
import { itemObjectName } from './ArSource'
import { isCameraBehindWall } from './walls'
import type { WallSide } from './house'
import { FurnitureModel } from './furniture/FurnitureModel'
import { halfExtents, snapToWalls, wallGaps } from './furniture/placement'
import { formatLength, useUnit } from '../utils/units'

const SELECT_COLOR = '#2f6fed'
/** Which wall a wall-mounted piece is on, from its rotation (see mountOnWall in catalog.ts). */
const WALL_OF_ROTATION: Record<number, WallSide> = { 0: 'back', 90: 'left', 180: 'front', 270: 'right' }
const WARNING_COLOR = '#d92d20' // outline colour when a piece overlaps another
const SNAP = 0.05 // metres: positions snap to 5 cm steps while dragging
const ROTATE_SNAP = 15 // degrees per step when turning with the ring (hold Shift for 1°)
const FLOOR_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // the floor, y = 0

interface FurnitureLayerProps {
  items: FurnitureItem[]
  /** World position [x, z] of the room's centre. Item positions are measured from here. */
  origin: [number, number]
  /** Inside size of the room, for snapping to walls and the distance guides. */
  room: { width: number; depth: number }
  /** Only the selected room's furniture can be clicked and dragged; the other room is just shown. */
  interactive: boolean
  selectedId: string | null
  /** Items that overlap another item: their outline turns red. */
  overlaps: Map<string, string[]>
  onSelect: (id: string) => void
  /**
   * Called repeatedly while dragging with the new position, and for pieces that can
   * stand on a desk, the desk or table now under them (`on`, undefined = the floor).
   */
  onMove: (id: string, changes: { position: [number, number]; on?: string }) => void
  /** Called repeatedly while turning a piece with the rotate ring, in degrees. */
  onRotate: (id: string, rotation: number) => void
  /** Called when a drag starts and ends, so the drag becomes one undo step. */
  onDragBoundary: () => void
}

interface OutlineProps {
  footprint: [number, number]
  /** Round piece: draw a circle instead of a rectangle. */
  round?: boolean
  /** Faint outline (hover / overlap hint) instead of the solid selection outline. */
  faint: boolean
  color: string
}

/** Floor outline drawn around the selected (solid) or hovered/overlapping (faint) object. */
function SelectionOutline({ footprint, round, faint, color }: OutlineProps) {
  const w = footprint[0] / 2 + 0.08
  const d = footprint[1] / 2 + 0.08
  const points: [number, number, number][] = round
    ? Array.from({ length: 49 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2
        return [Math.cos(a) * w, 0, Math.sin(a) * w]
      })
    : [
        [-w, 0, -d],
        [w, 0, -d],
        [w, 0, d],
        [-w, 0, d],
        [-w, 0, -d],
      ]
  return (
    <group position={[0, 0.02, 0]}>
      <Line points={points} color={color} lineWidth={faint ? 1.5 : 2.5} transparent opacity={faint ? 0.55 : 1} />
      {!faint && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          {round ? <circleGeometry args={[w, 48]} /> : <planeGeometry args={[w * 2, d * 2]} />}
          <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/**
 * The desk or table top the pointer's ray meets first, and where (room coordinates),
 * for dragging a piece onto it. Not the piece itself, nor anything standing on it.
 */
function topUnderPointer(
  ray: THREE.Ray,
  items: FurnitureItem[],
  moving: FurnitureItem,
  origin: [number, number],
): { host: FurnitureItem; point: [number, number] } | null {
  let best: { host: FurnitureItem; point: [number, number]; distance: number } | null = null
  const hit = new THREE.Vector3()
  for (const host of items) {
    if (!isSurfaceHost(host.type) || host.id === moving.id || host.on === moving.id) continue
    const top = new THREE.Plane(new THREE.Vector3(0, 1, 0), -surfaceHeight(host))
    if (!ray.intersectPlane(top, hit)) continue
    const point: [number, number] = [hit.x - origin[0], hit.z - origin[1]]
    if (!onTopOf(point, host)) continue
    const distance = ray.origin.distanceTo(hit)
    if (!best || distance < best.distance) best = { host, point, distance }
  }
  return best && { host: best.host, point: best.point }
}

/** Pause/resume the orbit controls so the camera doesn't move while dragging furniture. */
function setCameraControlsEnabled(get: RootState['get'], enabled: boolean) {
  const controls = get().controls as unknown as { enabled: boolean } | null
  if (controls) controls.enabled = enabled
}

/** Renders all furniture and handles clicking (select) and dragging (move). */
export function FurnitureLayer({
  items,
  origin,
  room,
  interactive,
  selectedId,
  overlaps,
  onSelect,
  onMove,
  onRotate,
  onDragBoundary,
}: FurnitureLayerProps) {
  const gl = useThree((state) => state.gl)
  const get = useThree((state) => state.get)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  // Information about the drag in progress (a ref, because it changes on every mouse move).
  const drag = useRef<{ id: string; offsetX: number; offsetZ: number } | null>(null)
  // A turn in progress with the rotate ring: which piece, its centre (world) and the height it stands at.
  const turn = useRef<{ id: string; cx: number; cz: number; y: number } | null>(null)
  // Always-current callbacks for the window listeners below.
  const callbacks = useRef({ onMove, onRotate, onDragBoundary, origin, items, room })
  callbacks.current = { onMove, onRotate, onDragBoundary, origin, items, room }

  // Mouse cursor: open hand over furniture, closed hand while dragging.
  useEffect(() => {
    gl.domElement.style.cursor = dragging ? 'grabbing' : hoveredId ? 'grab' : ''
  }, [gl, hoveredId, dragging])

  // While dragging, follow the pointer anywhere on the page (even off the object).
  useEffect(() => {
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const hit = new THREE.Vector3()

    function handleMove(event: PointerEvent) {
      const current = drag.current
      if (!current && !turn.current) return
      // Convert the mouse position into -1…+1 "normalised device coordinates".
      const rect = gl.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      // Shoot a ray from the camera through the mouse and see where it hits the floor
      // (or, while turning, the level the piece stands at).
      raycaster.setFromCamera(pointer, get().camera)
      const level = turn.current ? new THREE.Plane(new THREE.Vector3(0, 1, 0), -turn.current.y) : FLOOR_PLANE
      if (!raycaster.ray.intersectPlane(level, hit)) return

      if (turn.current) {
        // Angle from the piece's centre to the pointer. Models face +z, so rotation 0 = +z.
        const { id, cx, cz } = turn.current
        const degrees = (Math.atan2(hit.x - cx, hit.z - cz) * 180) / Math.PI
        const step = event.shiftKey ? 1 : ROTATE_SNAP
        callbacks.current.onRotate(id, Math.round(degrees / step) * step)
        return
      }
      if (!current) return

      // The floor hit is in world space; furniture positions are relative to the room centre.
      const [ox, oz] = callbacks.current.origin
      const x = Math.round((hit.x - ox + current.offsetX) / SNAP) * SNAP
      const z = Math.round((hit.z - oz + current.offsetZ) / SNAP) * SNAP
      const item = callbacks.current.items.find((i) => i.id === current.id)
      // A monitor, lamp or PC goes onto the desk or table top under the pointer, if there is one.
      if (item && canGoOnSurface(item.type)) {
        const top = topUnderPointer(raycaster.ray, callbacks.current.items, item, callbacks.current.origin)
        if (top) {
          const snap = (v: number) => Math.round(v / SNAP) * SNAP
          callbacks.current.onMove(current.id, {
            position: [snap(top.point[0] + current.offsetX), snap(top.point[1] + current.offsetZ)],
            on: top.host.id,
          })
          return
        }
      }
      // Close to a wall, the piece goes flush against it. Alt places it freely.
      const position: [number, number] = item && !event.altKey ? snapToWalls({ ...item, position: [x, z] }, callbacks.current.room) : [x, z]
      callbacks.current.onMove(current.id, item && canGoOnSurface(item.type) ? { position, on: undefined } : { position })
    }

    function handleUp() {
      if (!drag.current && !turn.current) return
      drag.current = null
      turn.current = null
      setDragging(false)
      setCameraControlsEnabled(get, true)
      callbacks.current.onDragBoundary()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [gl, get])

  const startTurn = (item: FurnitureItem) => (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return
    event.stopPropagation()
    turn.current = { id: item.id, cx: origin[0] + item.position[0], cz: origin[1] + item.position[1], y: elevationOf(item, items) }
    setDragging(true)
    setCameraControlsEnabled(get, false)
    onDragBoundary()
  }

  const handlePointerDown = (item: FurnitureItem) => (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return // only the left mouse button (or a finger) selects/drags
    // The rotate handle is drawn on top of everything, so it wins even when a piece in front
    // of it is nearer: step aside and let the event reach the handle.
    if (event.intersections.some((hit) => hit.object.userData.rotateHandle)) return
    event.stopPropagation() // don't also select objects hidden behind this one
    onSelect(item.id)

    // Where it was grabbed, at the level it stands at (the floor, or a desk top).
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -elevationOf(item, items))
    const hit = event.ray.intersectPlane(plane, new THREE.Vector3())
    if (!hit) return
    // Remember where on the object you grabbed it, so it doesn't jump to the cursor.
    drag.current = { id: item.id, offsetX: item.position[0] - (hit.x - origin[0]), offsetZ: item.position[1] - (hit.z - origin[1]) }
    setDragging(true)
    setCameraControlsEnabled(get, false)
    onDragBoundary()
  }

  // Desks and tables with something on them hide their own decoration (a laptop, vases).
  const occupied = new Set(items.flatMap((item) => (item.on ? [item.on] : [])))
  return (
    <group position={[origin[0], 0, origin[1]]}>
      {items.map((item) => {
        // On a desk or table: at the height of its top.
        const y = elevationOf(item, items)
        const isSelected = interactive && item.id === selectedId
        const isHovered = interactive && !isSelected && item.id === hoveredId && !dragging
        const isOverlapping = interactive && overlaps.has(item.id)
        // The selected piece gets a 3D outline (PostEffects) and the rotate ring; the floor
        // rectangle is for hover (faint blue) and overlaps (red).
        const showOutline = isHovered || isOverlapping
        const { round } = getVariant(item.type, item.variant)
        const footprint = itemFootprint(item)
        const onWall = isWallMounted(item.type)
        const piece = (
          <group key={item.id}>
            <group
              name={itemObjectName(item.id)}
              position={[item.position[0], y, item.position[1]]}
              rotation={[0, (item.rotation * Math.PI) / 180, 0]}
              onPointerDown={interactive ? handlePointerDown(item) : undefined}
              onPointerOver={
                interactive
                  ? (e) => {
                      e.stopPropagation()
                      setHoveredId(item.id)
                    }
                  : undefined
              }
              onPointerOut={interactive ? () => setHoveredId((id) => (id === item.id ? null : id)) : undefined}
              // The piece is the nearest thing clicked, so the wall or floor behind it isn't picked too.
              onClick={interactive ? (e) => e.stopPropagation() : undefined}
            >
              <Select enabled={isSelected}>
                <FurnitureModel
                  type={item.type}
                  variant={item.variant}
                  color={item.color}
                  frame={item.frame}
                  size={item.size}
                  bare={isSurfaceHost(item.type) && occupied.has(item.id)}
                />
              </Select>
              {showOutline && (
                <SelectionOutline
                  footprint={footprint}
                  round={round}
                  faint={!isOverlapping}
                  color={isOverlapping ? WARNING_COLOR : SELECT_COLOR}
                />
              )}
            </group>
            {isSelected && <DimensionGuides item={item} room={room} elevation={y} />}
            {/* Pieces on a wall face the way their wall decides, so they have no rotate ring. */}
            {isSelected && !onWall && (
              <RotateRing
                position={[item.position[0], y, item.position[1]]}
                rotation={item.rotation}
                radius={Math.hypot(footprint[0], footprint[1]) / 2 + 0.15}
                onGrab={startTurn(item)}
              />
            )}
          </group>
        )
        if (!onWall) return piece
        // Hung on a wall: hidden together with that wall when it's cut away for the view.
        const side = WALL_OF_ROTATION[item.rotation] ?? 'back'
        return (
          <Cutaway key={item.id} isBehind={(camera) => isCameraBehindWall(side, room, camera.position)}>
            {piece}
          </Cutaway>
        )
      })}
    </group>
  )
}

/**
 * Measurements for the selected piece: its size (W × D) in front of it, and lines
 * with the distance to the nearest wall left/right and back/front.
 */
function DimensionGuides({ item, room, elevation }: { item: FurnitureItem; room: { width: number; depth: number }; elevation: number }) {
  const [x, z] = item.position
  const [hx, hz] = halfExtents(item)
  const gaps = wallGaps(item, room)
  const unit = useUnit()
  const [w, d] = itemFootprint(item)
  const y = elevation + 0.03
  const guides: { from: [number, number, number]; to: [number, number, number]; length: number }[] = []
  // Along x: to whichever side wall is nearer (none when it's flush).
  if (Math.min(gaps.left, gaps.right) > 0.015) {
    const toLeft = gaps.left <= gaps.right
    const edge = toLeft ? x - hx : x + hx
    const wall = toLeft ? -room.width / 2 : room.width / 2
    guides.push({ from: [edge, y, z], to: [wall, y, z], length: toLeft ? gaps.left : gaps.right })
  }
  // Along z: to the back or front wall.
  if (Math.min(gaps.back, gaps.front) > 0.015) {
    const toBack = gaps.back <= gaps.front
    const edge = toBack ? z - hz : z + hz
    const wall = toBack ? -room.depth / 2 : room.depth / 2
    guides.push({ from: [x, y, edge], to: [x, y, wall], length: toBack ? gaps.back : gaps.front })
  }
  return (
    <group userData={{ noExport: true }}>
      {guides.map((guide, i) => (
        <group key={i}>
          <Line points={[guide.from, guide.to]} color={SELECT_COLOR} lineWidth={1.5} dashed dashSize={0.06} gapSize={0.04} />
          <Html
            position={[(guide.from[0] + guide.to[0]) / 2, y, (guide.from[2] + guide.to[2]) / 2]}
            center
            zIndexRange={[2, 0]}
            className="dimension-anchor"
          >
            <span className="dimension-label">{formatLength(guide.length, unit)}</span>
          </Html>
        </group>
      ))}
      <Html position={[x, y, z + hz + 0.18]} center zIndexRange={[2, 0]} className="dimension-anchor">
        <span className="dimension-label size">
          {formatLength(w, unit)} × {formatLength(d, unit)}
        </span>
      </Html>
    </group>
  )
}

interface RotateRingProps {
  position: [number, number, number]
  rotation: number
  radius: number
  onGrab: (event: ThreeEvent<PointerEvent>) => void
}

/**
 * A thin blue ring on the floor around the selected piece, with a round handle in
 * front of it (the way it faces). Drag the handle around the ring to turn the piece:
 * 15° steps, or hold Shift for 1°. It sits outside the piece's own group so grabbing
 * it never starts a move.
 */
function RotateRing({ position, rotation, radius, onGrab }: RotateRingProps) {
  const [hovered, setHovered] = useState(false)
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    if (!hovered) return
    gl.domElement.style.cursor = 'grab'
    return () => {
      gl.domElement.style.cursor = ''
    }
  }, [gl, hovered])

  const angle = (rotation * Math.PI) / 180
  return (
    <group position={position} userData={{ noExport: true }}>
      {/* Drawn on top of everything (depthTest off), so furniture in the way can't hide it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} renderOrder={10}>
        <ringGeometry args={[radius - 0.025, radius + 0.025, 96]} />
        <meshBasicMaterial color={SELECT_COLOR} transparent opacity={0.8} depthWrite={false} depthTest={false} toneMapped={false} />
      </mesh>
      <mesh
        position={[Math.sin(angle) * radius, 0.05, Math.cos(angle) * radius]}
        userData={{ rotateHandle: true }}
        onPointerDown={onGrab}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => e.stopPropagation()}
        renderOrder={11}
      >
        <sphereGeometry args={[hovered ? 0.1 : 0.08, 24, 16]} />
        <meshBasicMaterial color={hovered ? '#5a8cff' : SELECT_COLOR} depthTest={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
