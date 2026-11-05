import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'

/**
 * The 3D files for AR (Phase 13): GLB for Android and most 3D apps, USDZ for
 * iPhone and iPad (AR Quick Look). A separate file, loaded only when View in AR
 * is opened, so the exporters don't add to every page load.
 */

/** Exports as a binary glTF (.glb). */
export async function exportGlb(object: THREE.Object3D): Promise<Blob> {
  const result = await new GLTFExporter().parseAsync(object, { binary: true, onlyVisible: true, maxTextureSize: 512 })
  return new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
}

/** Exports as USDZ for AR Quick Look. Instanced meshes (the slat wall) are expanded to plain meshes first. */
export async function exportUsdz(object: THREE.Object3D): Promise<Blob> {
  const flat = expandInstances(object)
  standardMaterialsOnly(flat)
  const data = await new USDZExporter().parseAsync(flat, { quickLookCompatible: true, maxTextureSize: 512 })
  return new Blob([data], { type: 'model/vnd.usdz+zip' })
}

/**
 * AR Quick Look only understands the standard material: glowing "basic" materials
 * (the sky in the windows, the cove light) become standard ones that glow in the same colour.
 */
/** A standard material that looks like `material` (a glowing basic one becomes emissive). */
function toStandard(material: THREE.Material): THREE.Material {
  if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) return material
  const basic = material as THREE.MeshBasicMaterial
  const color = basic.color ?? new THREE.Color('#ffffff')
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1,
    map: basic.map ?? null,
    transparent: basic.transparent,
    opacity: basic.opacity,
  })
}

function standardMaterialsOnly(object: THREE.Object3D) {
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toStandard) : toStandard(mesh.material)
  })
}

/** USDZ has no instancing: each instance of an InstancedMesh becomes its own mesh. */
function expandInstances(object: THREE.Object3D): THREE.Object3D {
  const instanced: THREE.InstancedMesh[] = []
  object.traverse((o) => {
    if ((o as THREE.InstancedMesh).isInstancedMesh) instanced.push(o as THREE.InstancedMesh)
  })
  if (instanced.length === 0) return object
  for (const mesh of instanced) {
    const group = new THREE.Group()
    group.position.copy(mesh.position)
    group.quaternion.copy(mesh.quaternion)
    group.scale.copy(mesh.scale)
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix)
      const single = new THREE.Mesh(mesh.geometry, mesh.material)
      single.applyMatrix4(matrix)
      group.add(single)
    }
    mesh.parent?.add(group)
    mesh.removeFromParent()
  }
  object.updateMatrixWorld(true)
  return object
}
