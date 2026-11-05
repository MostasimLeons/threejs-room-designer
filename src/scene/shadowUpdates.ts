import * as THREE from 'three'

/**
 * A fingerprint of everything that decides what the shadows look like: each
 * visible shadow-casting mesh (which one, its shape, where it is, which layers it's
 * on) and each shadow-casting light (where it is and points, its shadow size).
 *
 * Shadow maps don't depend on the camera, so orbiting the view leaves this
 * unchanged and the shadows can be reused instead of drawn again. Moving a piece,
 * changing the time of day, a model finishing loading or a wall being hidden all
 * change it. Comparing it costs far less than redrawing two shadow maps.
 *
 * Call scene.updateMatrixWorld() first, so positions are current.
 */
export function shadowSignature(scene: THREE.Object3D): number {
  let hash = 0x811c9dc5
  const mix = (value: number) => {
    // FNV-1a style mixing of a rounded number (0.1 mm / tiny-angle precision is plenty).
    hash = Math.imul(hash ^ (Math.round(value * 10000) | 0), 0x01000193)
  }
  const mixMatrix = (matrix: THREE.Matrix4) => {
    for (const e of matrix.elements) mix(e)
  }

  scene.traverseVisible((object) => {
    if ((object as THREE.Light).isLight) {
      const light = object as THREE.DirectionalLight
      if (!light.castShadow) return
      mix(light.id)
      mixMatrix(light.matrixWorld)
      if (light.target) mixMatrix(light.target.matrixWorld)
      mix(light.shadow.mapSize.x)
      // A new light has no shadow map yet: it must be drawn once.
      mix(light.shadow.map ? 1 : 0)
      mix(light.shadow.camera.layers.mask)
      return
    }
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || !mesh.castShadow) return
    mix(mesh.id)
    mix(mesh.geometry.id)
    mix(mesh.layers.mask)
    mixMatrix(mesh.matrixWorld)
    const instanced = object as THREE.InstancedMesh
    if (instanced.isInstancedMesh) {
      mix(instanced.count)
      mix(instanced.instanceMatrix.version)
    }
  })
  return hash
}
