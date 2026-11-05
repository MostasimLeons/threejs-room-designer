import { useEffect } from 'react'
import type * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { prepareForExport, ROOM_MODEL_SCALE } from './arExport'

export type ArTarget = { kind: 'piece'; itemId: string } | { kind: 'room' }

/** Names given to the 3D objects AR can export (FurnitureLayer and Scene set them). */
export const itemObjectName = (id: string) => `item:${id}`
export const ROOM_OBJECT_NAME = 'room-root'

/**
 * Hands a copy of a piece of furniture, or of the whole room (at 1:20), to the app
 * for AR when asked (`request` changes): helpers removed, standing on the floor,
 * ready to export (arExport.ts). The 3D view itself isn't changed.
 */
export function ArSource({
  request,
  onModel,
}: {
  request: { id: number; target: ArTarget } | null
  onModel: (model: THREE.Group | null) => void
}) {
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    if (!request) return
    const { target } = request
    const source = scene.getObjectByName(target.kind === 'piece' ? itemObjectName(target.itemId) : ROOM_OBJECT_NAME)
    onModel(source ? prepareForExport(source, target.kind === 'room' ? ROOM_MODEL_SCALE : 1) : null)
    // A new request (new id) is what triggers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id])
  return null
}
