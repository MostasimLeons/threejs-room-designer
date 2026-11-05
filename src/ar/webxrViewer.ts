import * as THREE from 'three'

/**
 * A small AR viewer for Android phones (Chrome with Google Play Services for AR),
 * using WebXR: point the camera at the floor (or a table), a ring shows where the
 * model will go, tap to place it, tap again to move it. Close ends the session.
 * It needs a secure (https) page; iPhone and iPad use AR Quick Look instead.
 */
/** Starts the AR view; returns the session (call `end()` on it to close). */
export async function startWebXrAr(model: THREE.Object3D, overlay: HTMLElement, onEnd: () => void): Promise<XRSession> {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr
  if (!xr) throw new Error('WebXR is not available')

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  renderer.domElement.style.display = 'none'
  document.body.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9a98f', 2.2))
  const sun = new THREE.DirectionalLight('#ffffff', 1.6)
  sun.position.set(1, 3, 2)
  scene.add(sun)
  const camera = new THREE.PerspectiveCamera()

  // The ring that shows where the model will be placed.
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.13, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#2f6fed' }),
  )
  reticle.matrixAutoUpdate = false
  reticle.visible = false
  scene.add(reticle)

  const placed = model
  placed.visible = false
  scene.add(placed)

  const session = await xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: overlay },
  } as XRSessionInit)
  await renderer.xr.setSession(session)
  const viewerSpace = await session.requestReferenceSpace('viewer')
  const hitSource = await session.requestHitTestSource?.({ space: viewerSpace })

  session.addEventListener('select', () => {
    if (!reticle.visible) return
    placed.visible = true
    placed.position.setFromMatrixPosition(reticle.matrix)
  })
  session.addEventListener('end', () => {
    hitSource?.cancel()
    renderer.setAnimationLoop(null)
    renderer.dispose()
    renderer.domElement.remove()
    scene.remove(placed)
    onEnd()
  })

  renderer.setAnimationLoop((_, frame) => {
    if (frame && hitSource) {
      const space = renderer.xr.getReferenceSpace()
      const hit = space ? frame.getHitTestResults(hitSource)[0] : undefined
      const pose = hit && space ? hit.getPose(space) : undefined
      reticle.visible = Boolean(pose)
      if (pose) reticle.matrix.fromArray(pose.transform.matrix)
    }
    renderer.render(scene, camera)
  })
  return session
}
