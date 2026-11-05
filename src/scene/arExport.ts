import * as THREE from 'three'

/**
 * Preparing a piece of furniture, or the whole room as a table-top model, for AR
 * (Phase 13), and checking what the device supports. The file exporters themselves
 * are in arFiles.ts, loaded only when View in AR is used.
 */

/** The room as a table-top model: 1:20 (a 7 m room is 35 cm across). */
export const ROOM_MODEL_SCALE = 1 / 20

/** Things in the 3D view that aren't part of the room or furniture, and so aren't exported. */
export function isHelper(object: THREE.Object3D): boolean {
  if (object.userData.noExport) return true
  // Selection outlines, measurement lines and the like are drawn as lines.
  if ((object as THREE.Line).isLine || object.type === 'Line2' || object.type === 'LineSegments2') return true
  // Light sources don't belong in an AR model (the phone lights it).
  if ((object as THREE.Light).isLight) return true
  return false
}

/**
 * A copy of `source` ready to export: helpers removed, standing on the floor
 * (lowest point at y = 0), centred on x/z, at the given scale and with no
 * rotation of its own. Materials and geometry are shared with the original,
 * so nothing in the 3D view changes.
 */
export function prepareForExport(source: THREE.Object3D, scale = 1): THREE.Group {
  const copy = source.clone(true)
  const remove: THREE.Object3D[] = []
  copy.traverse((object) => {
    if (object !== copy && isHelper(object)) remove.push(object)
  })
  for (const object of remove) object.removeFromParent()
  copy.position.set(0, 0, 0)
  copy.rotation.set(0, 0, 0)
  copy.scale.setScalar(1)
  // Hidden walls (cut away for the view) are on another layer: show everything in AR.
  copy.traverse((object) => object.layers.enableAll())
  const root = new THREE.Group()
  root.add(copy)
  root.scale.setScalar(scale)
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  if (!box.isEmpty()) {
    const centre = box.getCenter(new THREE.Vector3())
    copy.position.set(-centre.x / scale, -box.min.y / scale, -centre.z / scale)
  }
  root.updateMatrixWorld(true)
  return root
}

/** Can this browser open AR Quick Look (iPhone, iPad)? */
export function canQuickLook(): boolean {
  if (typeof document === 'undefined') return false
  const a = document.createElement('a')
  return Boolean(a.relList?.supports?.('ar'))
}

/** Can this browser start a WebXR AR session (Android Chrome with ARCore)? */
export async function canWebXrAr(): Promise<boolean> {
  const xr = (navigator as Navigator & { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } }).xr
  if (!xr || !window.isSecureContext) return false
  try {
    return await xr.isSessionSupported('immersive-ar')
  } catch {
    return false
  }
}
