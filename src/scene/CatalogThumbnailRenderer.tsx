import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { FURNITURE_INFO, type FurnitureType } from './furniture/catalog'
import { FurnitureModel } from './furniture/FurnitureModel'

const WIDTH = 192
const HEIGHT = 144
/** Frames to wait before copying a picture, so a model already downloaded has time to appear. */
const SETTLE_FRAMES = 12
const VIEW_DIRECTION = new THREE.Vector3(0.75, 0.55, 1).normalize()

/**
 * Draws a small picture of each furniture type for the catalog drawer, one after
 * another, in a tiny hidden canvas of its own. It only exists while pictures are
 * missing, then goes away (and with it, its WebGL context).
 */
export function CatalogThumbnailRenderer({
  types,
  onThumbnail,
}: {
  types: FurnitureType[]
  onThumbnail: (type: FurnitureType, url: string) => void
}) {
  // The parent drops each type from the list once its picture arrives, so this
  // always draws the first one still missing.
  const type = types[0]
  if (!type) return null
  return (
    <div className="thumbnail-renderer" aria-hidden="true">
      <Canvas
        dpr={1}
        flat
        // Keep the pixels after drawing, so they can be copied into a picture.
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        camera={{ fov: 30, near: 0.05, far: 50 }}
        style={{ width: WIDTH, height: HEIGHT }}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} />
        <Suspense fallback={null}>
          <Shot key={type} type={type} onDone={(url) => onThumbnail(type, url)} />
        </Suspense>
      </Canvas>
    </div>
  )
}

/** One picture: frame the model, wait a couple of frames for it to settle, copy the canvas. */
function Shot({ type, onDone }: { type: FurnitureType; onDone: (url: string) => void }) {
  const group = useRef<THREE.Group>(null)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const frames = useRef(0)
  const done = useRef(false)
  const info = FURNITURE_INFO[type]

  // Each frame until the picture is taken: point the camera at the model from the
  // front-right, far enough to fit it. Re-measured every frame, because a real model
  // can replace the code-built stand-in while it loads.
  useFrame(() => {
    if (done.current || !group.current) return
    frames.current += 1
    const box = new THREE.Box3().setFromObject(group.current)
    if (box.isEmpty()) return
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const radius = Math.max(size.length() / 2, 0.2)
    const distance = (radius / Math.sin(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360)) * 0.92
    camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance)
    camera.lookAt(center)
    // The picture is copied on a later frame, after this framing has been drawn.
    if (frames.current < SETTLE_FRAMES) return
    done.current = true
    onDone(gl.domElement.toDataURL('image/webp', 0.82))
  })

  return (
    <group ref={group}>
      <FurnitureModel type={type} variant={info.variants[0].id} color={info.swatches[0].color} />
    </group>
  )
}
