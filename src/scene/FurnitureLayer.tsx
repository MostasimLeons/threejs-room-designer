import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { getVariant, type FurnitureItem } from './furniture/catalog'
import { FurnitureModel } from './furniture/FurnitureModel'

const SELECT_COLOR = '#2f6fed'
const WARNING_COLOR = '#d92d20' // outline colour when a piece overlaps another
const SNAP = 0.05 // metres: positions snap to 5 cm steps while dragging
const FLOOR_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // the floor, y = 0

interface FurnitureLayerProps {
  items: FurnitureItem[]
  /** World position [x, z] of the room's centre. Item positions are measured from here. */
  origin: [number, number]
  /** Only the selected room's furniture can be clicked and dragged; the other room is just shown. */
  interactive: boolean
  selectedId: string | null
  /** Items that overlap another item: their outline turns red. */
  overlaps: Map<string, string[]>
  onSelect: (id: string) => void
  /** Called repeatedly while dragging with the new floor position. */
  onMove: (id: string, position: [number, number]) => void
  /** Called when a drag starts and ends, so the drag becomes one undo step. */
  onDragBoundary: () => void
}

interface OutlineProps {
  footprint: [number, number]
  /** Faint outline (hover / overlap hint) instead of the solid selection outline. */
  faint: boolean
  color: string
}

/** Floor outline drawn around the selected (solid) or hovered/overlapping (faint) object. */
function SelectionOutline({ footprint, faint, color }: OutlineProps) {
  const w = footprint[0] / 2 + 0.08
  const d = footprint[1] / 2 + 0.08
  return (
    <group position={[0, 0.02, 0]}>
      <Line
        points={[[-w, 0, -d], [w, 0, -d], [w, 0, d], [-w, 0, d], [-w, 0, -d]]}
        color={color}
        lineWidth={faint ? 1.5 : 2.5}
        transparent
        opacity={faint ? 0.55 : 1}
      />
      {!faint && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w * 2, d * 2]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** Renders all furniture and handles clicking (select) and dragging (move). */
export function FurnitureLayer({ items, origin, interactive, selectedId, overlaps, onSelect, onMove, onDragBoundary }: FurnitureLayerProps) {
  const gl = useThree((state) => state.gl)
  const get = useThree((state) => state.get)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  // Information about the drag in progress (a ref, because it changes on every mouse move).
  const drag = useRef<{ id: string; offsetX: number; offsetZ: number } | null>(null)
  // Always-current callbacks for the window listeners below.
  const callbacks = useRef({ onMove, onDragBoundary, origin })
  callbacks.current = { onMove, onDragBoundary, origin }

  // Pause/resume the orbit controls so the camera doesn't move while dragging furniture.
  const setCameraControlsEnabled = (enabled: boolean) => {
    const controls = get().controls as unknown as { enabled: boolean } | null
    if (controls) controls.enabled = enabled
  }

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
      if (!current) return
      // Convert the mouse position into -1…+1 "normalised device coordinates".
      const rect = gl.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      // Shoot a ray from the camera through the mouse and see where it hits the floor.
      raycaster.setFromCamera(pointer, get().camera)
      if (!raycaster.ray.intersectPlane(FLOOR_PLANE, hit)) return
      // The floor hit is in world space; furniture positions are relative to the room centre.
      const [ox, oz] = callbacks.current.origin
      const x = Math.round((hit.x - ox + current.offsetX) / SNAP) * SNAP
      const z = Math.round((hit.z - oz + current.offsetZ) / SNAP) * SNAP
      callbacks.current.onMove(current.id, [x, z])
    }

    function handleUp() {
      if (!drag.current) return
      drag.current = null
      setDragging(false)
      setCameraControlsEnabled(true)
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

  const handlePointerDown = (item: FurnitureItem) => (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return // only the left mouse button (or a finger) selects/drags
    event.stopPropagation() // don't also select objects hidden behind this one
    onSelect(item.id)

    const hit = event.ray.intersectPlane(FLOOR_PLANE, new THREE.Vector3())
    if (!hit) return
    // Remember where on the object you grabbed it, so it doesn't jump to the cursor.
    drag.current = { id: item.id, offsetX: item.position[0] - (hit.x - origin[0]), offsetZ: item.position[1] - (hit.z - origin[1]) }
    setDragging(true)
    setCameraControlsEnabled(false)
    onDragBoundary()
  }

  return (
    <group position={[origin[0], 0, origin[1]]}>
      {items.map((item) => {
        const isSelected = interactive && item.id === selectedId
        const isHovered = interactive && !isSelected && item.id === hoveredId && !dragging
        const isOverlapping = interactive && overlaps.has(item.id)
        const showOutline = isSelected || isHovered || isOverlapping
        return (
          <group
            key={item.id}
            position={[item.position[0], 0, item.position[1]]}
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
          >
            <FurnitureModel type={item.type} variant={item.variant} color={item.color} />
            {showOutline && (
              <SelectionOutline
                footprint={getVariant(item.type, item.variant).footprint}
                faint={!isSelected}
                color={isOverlapping ? WARNING_COLOR : SELECT_COLOR}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}
