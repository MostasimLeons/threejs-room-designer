import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { getVariant, type FurnitureItem } from './furniture/catalog'
import { FurnitureModel } from './furniture/FurnitureModel'

const SELECT_COLOR = '#2f6fed'
const SNAP = 0.05 // metres: positions snap to 5 cm steps while dragging
const FLOOR_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // the floor, y = 0

interface FurnitureLayerProps {
  items: FurnitureItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** Called repeatedly while dragging with the new floor position. */
  onMove: (id: string, position: [number, number]) => void
  /** Called when a drag starts and ends, so the drag becomes one undo step. */
  onDragBoundary: () => void
}

/** Floor outline drawn around the selected (solid) or hovered (faint) object. */
function SelectionOutline({ footprint, hovered }: { footprint: [number, number]; hovered: boolean }) {
  const w = footprint[0] / 2 + 0.08
  const d = footprint[1] / 2 + 0.08
  return (
    <group position={[0, 0.02, 0]}>
      <Line
        points={[[-w, 0, -d], [w, 0, -d], [w, 0, d], [-w, 0, d], [-w, 0, -d]]}
        color={SELECT_COLOR}
        lineWidth={hovered ? 1.5 : 2.5}
        transparent
        opacity={hovered ? 0.45 : 1}
      />
      {!hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w * 2, d * 2]} />
          <meshBasicMaterial color={SELECT_COLOR} transparent opacity={0.1} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** Renders all furniture and handles clicking (select) and dragging (move). */
export function FurnitureLayer({ items, selectedId, onSelect, onMove, onDragBoundary }: FurnitureLayerProps) {
  const gl = useThree((state) => state.gl)
  const get = useThree((state) => state.get)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  // Information about the drag in progress (a ref, because it changes on every mouse move).
  const drag = useRef<{ id: string; offsetX: number; offsetZ: number } | null>(null)
  // Always-current callbacks for the window listeners below.
  const callbacks = useRef({ onMove, onDragBoundary })
  callbacks.current = { onMove, onDragBoundary }

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
      const x = Math.round((hit.x + current.offsetX) / SNAP) * SNAP
      const z = Math.round((hit.z + current.offsetZ) / SNAP) * SNAP
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
    drag.current = { id: item.id, offsetX: item.position[0] - hit.x, offsetZ: item.position[1] - hit.z }
    setDragging(true)
    setCameraControlsEnabled(false)
    onDragBoundary()
  }

  return (
    <group>
      {items.map((item) => {
        const isSelected = item.id === selectedId
        const isHovered = !isSelected && item.id === hoveredId && !dragging
        return (
          <group
            key={item.id}
            position={[item.position[0], 0, item.position[1]]}
            rotation={[0, (item.rotation * Math.PI) / 180, 0]}
            onPointerDown={handlePointerDown(item)}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHoveredId(item.id)
            }}
            onPointerOut={() => setHoveredId((id) => (id === item.id ? null : id))}
          >
            <FurnitureModel type={item.type} variant={item.variant} color={item.color} />
            {(isSelected || isHovered) && <SelectionOutline footprint={getVariant(item.type, item.variant).footprint} hovered={isHovered} />}
          </group>
        )
      })}
    </group>
  )
}
