import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'

/**
 * The 3D files for AR (Phase 13): GLB for Android and most 3D apps, USDZ for
 * iPhone and iPad (AR Quick Look). A separate file, loaded only when View in AR
 * is opened, so the exporters don't add to every page load.
 */

/**
 * Exports as a binary glTF (.glb) that plain glTF 2.0 viewers can open, such as
 * Windows 3D Viewer (see portableForGlb). The model passed in is not changed.
 */
export async function exportGlb(object: THREE.Object3D): Promise<Blob> {
  const result = await new GLTFExporter().parseAsync(portableForGlb(object), { binary: true, onlyVisible: true, maxTextureSize: 512 })
  return new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
}

/**
 * A copy of `object` that exports without any glTF extension a viewer is required
 * to support. The real 3D furniture models are stored compactly (WebP textures,
 * quantized vertices) and the slat wall is instanced; exported as they are, the
 * file would *require* EXT_texture_webp, KHR_mesh_quantization and
 * EXT_mesh_gpu_instancing, and viewers without them (Windows 3D Viewer) refuse to
 * open it. So the copy has:
 * - textures that were WebP written as PNG,
 * - quantized vertex data as plain numbers,
 * - instances as separate meshes,
 * - colours capped at 1 (glTF allows 0–1; the window sky is brighter for the glow).
 * Geometry, materials and textures are copied only where they change, so the 3D
 * view is never affected.
 */
export function portableForGlb(object: THREE.Object3D): THREE.Object3D {
  const copy = expandInstances(object.clone(true))
  const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>()
  const materials = new Map<THREE.Material, THREE.Material>()
  const textures = new Map<THREE.Texture, THREE.Texture>()
  copy.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry = cached(geometries, mesh.geometry, floatGeometry)
    const portable = (material: THREE.Material) => cached(materials, material, (m) => portableMaterial(m, textures))
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(portable) : portable(mesh.material)
  })
  copy.updateMatrixWorld(true)
  return copy
}

function cached<T>(cache: Map<T, T>, key: T, make: (value: T) => T): T {
  let value = cache.get(key)
  if (value === undefined) {
    value = make(key)
    cache.set(key, value)
  }
  return value
}

/** The geometry with every quantized (integer) vertex attribute turned into plain floats. */
function floatGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const names = Object.keys(geometry.attributes).filter((name) => !(geometry.attributes[name].array instanceof Float32Array))
  if (names.length === 0) return geometry
  const copy = geometry.clone()
  for (const name of names) {
    const source = geometry.attributes[name]
    const { count, itemSize } = source
    const values = new Float32Array(count * itemSize)
    // getComponent reads interleaved data too, and undoes "normalized" storage.
    for (let i = 0; i < count; i++) for (let c = 0; c < itemSize; c++) values[i * itemSize + c] = source.getComponent(i, c)
    copy.setAttribute(name, new THREE.BufferAttribute(values, itemSize))
  }
  return copy
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'] as const

/** The material with WebP textures marked for PNG export and its colour within 0–1. */
function portableMaterial(material: THREE.Material, textures: Map<THREE.Texture, THREE.Texture>): THREE.Material {
  const slots = material as unknown as Partial<Record<(typeof TEXTURE_SLOTS)[number], THREE.Texture | null>>
  const color = (material as THREE.MeshStandardMaterial).color as THREE.Color | undefined
  const webp = TEXTURE_SLOTS.filter((slot) => slots[slot]?.userData.mimeType === 'image/webp')
  const bright = color !== undefined && Math.max(color.r, color.g, color.b) > 1
  if (webp.length === 0 && !bright) return material
  const copy = material.clone()
  const copySlots = copy as unknown as Record<string, THREE.Texture | null>
  for (const slot of webp) {
    copySlots[slot] = cached(textures, slots[slot]!, (texture) => {
      const png = texture.clone()
      png.userData = { ...texture.userData, mimeType: 'image/png' }
      return png
    })
  }
  if (bright) {
    const c = (copy as THREE.MeshStandardMaterial).color
    c.setRGB(Math.min(c.r, 1), Math.min(c.g, 1), Math.min(c.b, 1))
  }
  return copy
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
