import { useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'
import { ROOMS, type RoomId } from './house'

type Vec3 = [number, number, number]

/**
 * Where the two shadow-casting lights sit, relative to the room they light.
 * The Living Room uses the original values. The Bedroom's sun is angled to
 * shine in through the Bedroom window instead.
 */
const LIGHT_OFFSETS: Record<RoomId, { ceiling: Vec3; sun: Vec3 }> = {
  living: { ceiling: [3, 7, 4], sun: [-5.7, 5, -9] },
  bedroom: { ceiling: [3, 7, 4], sun: [7.9, 5, -9] },
}

/**
 * Lighting setup:
 * - Hemisphere light: soft sky/ground fill so nothing is pitch black.
 * - "Ceiling" directional light: main light that gives furniture soft shadows.
 * - Sun: shines from outside through the window opening onto the floor.
 * - Environment: a tiny procedural studio (no downloads) for subtle reflections.
 * The floor lamp has its own warm point light (see FloorLamp.tsx).
 */
export function Lighting({ room }: { room: RoomId }) {
  // The directional lights aim at the room you're viewing, so its shadows stay sharp.
  const [cx, cz] = ROOMS[room].center
  const { ceiling, sun } = LIGHT_OFFSETS[room]
  const ceilingTarget = useMemo(() => new THREE.Object3D(), [])
  const sunTarget = useMemo(() => new THREE.Object3D(), [])

  return (
    <>
      <hemisphereLight args={['#fff7ea', '#b89f80', 0.9]} />

      <primitive object={ceilingTarget} position={[cx, 0, cz]} />
      <primitive object={sunTarget} position={[cx, 0, cz]} />

      <directionalLight
        castShadow
        target={ceilingTarget}
        position={[cx + ceiling[0], ceiling[1], cz + ceiling[2]]}
        intensity={1.3}
        color="#fffaf2"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-far={25}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <directionalLight
        castShadow
        target={sunTarget}
        position={[cx + sun[0], sun[1], cz + sun[2]]}
        intensity={2.4}
        color="#ffeccc"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <Environment resolution={128} environmentIntensity={0.45}>
        <Lightformer intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={1.5} color="#dcecff" position={[-2, 2, -8]} scale={[4, 3, 1]} />
        <Lightformer intensity={0.8} color="#fff1dd" position={[8, 2, 4]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
      </Environment>
    </>
  )
}
