import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { prepareForExport } from './arExport'
import { exportGlb, portableForGlb } from './arFiles'

/**
 * The downloaded .glb must open in plain glTF 2.0 viewers (Windows 3D Viewer):
 * no extension may be *required*, and colours must be within 0–1.
 */

/** A piece like the real (optimised) furniture models: quantized vertices, a WebP texture. */
function optimisedPiece() {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const positions = geometry.attributes.position
  const quantized = new Int16Array(positions.count * 3)
  for (let i = 0; i < quantized.length; i++) quantized[i] = Math.round((positions.array[i] / 0.5) * 32767)
  geometry.setAttribute('position', new THREE.BufferAttribute(quantized, 3, true))
  const texture = new THREE.Texture()
  texture.userData.mimeType = 'image/webp'
  const material = new THREE.MeshStandardMaterial({ normalMap: texture })
  return { mesh: new THREE.Mesh(geometry, material), geometry, material, texture }
}

/** The window sky: an unlit colour brighter than 1, so it glows. */
const sky = () => new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.24, 1.39, 1.49) }))

function slatWall() {
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 2, 0.03), new THREE.MeshStandardMaterial(), 3)
  for (let i = 0; i < 3; i++) slats.setMatrixAt(i, new THREE.Matrix4().makeTranslation(i * 0.1, 1, 0))
  return slats
}

/** Width (x) of the box around a position attribute. */
const size = (attribute: THREE.BufferAttribute) => new THREE.Box3().setFromBufferAttribute(attribute).getSize(new THREE.Vector3()).x

const meshesOf = (object: THREE.Object3D) => {
  const meshes: THREE.Mesh[] = []
  object.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh))
  return meshes
}

describe('a portable copy for .glb export', () => {
  it('turns quantized vertices into plain numbers in the same place', () => {
    const { mesh, geometry } = optimisedPiece()
    const [copy] = meshesOf(portableForGlb(mesh))
    const position = copy.geometry.attributes.position
    expect(position.array).toBeInstanceOf(Float32Array)
    expect(position.normalized).toBe(false)
    expect(position.getX(0)).toBeCloseTo(geometry.attributes.position.getX(0), 4)
    expect(size(position as THREE.BufferAttribute)).toBeCloseTo(size(geometry.attributes.position as THREE.BufferAttribute), 4)
    // The 3D view keeps its compact geometry.
    expect(geometry.attributes.position.array).toBeInstanceOf(Int16Array)
  })

  it('writes WebP textures as PNG, without touching the original texture', () => {
    const { mesh, texture } = optimisedPiece()
    const [copy] = meshesOf(portableForGlb(mesh))
    const normalMap = (copy.material as THREE.MeshStandardMaterial).normalMap!
    expect(normalMap.userData.mimeType).toBe('image/png')
    expect(normalMap.image).toBe(texture.image)
    expect(texture.userData.mimeType).toBe('image/webp')
  })

  it('caps colours at 1 (the glowing window sky) in the copy only', () => {
    const mesh = sky()
    const [copy] = meshesOf(portableForGlb(mesh))
    expect((copy.material as THREE.MeshBasicMaterial).color.toArray()).toEqual([1, 1, 1])
    expect((mesh.material as THREE.MeshBasicMaterial).color.r).toBeCloseTo(1.24)
  })

  it('expands instanced meshes (the slat wall) into separate meshes', () => {
    const group = new THREE.Group()
    group.add(slatWall())
    const copy = portableForGlb(group)
    expect(meshesOf(copy).filter((m) => (m as THREE.InstancedMesh).isInstancedMesh)).toHaveLength(0)
    expect(meshesOf(copy)).toHaveLength(3)
    expect((group.children[0] as THREE.InstancedMesh).isInstancedMesh).toBe(true)
  })

  it('shares geometry and materials that need no change', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: '#808080' }))
    const [copy] = meshesOf(portableForGlb(mesh))
    expect(copy.geometry).toBe(mesh.geometry)
    expect(copy.material).toBe(mesh.material)
  })
})

describe('the exported .glb', () => {
  // The exporter reads its result with FileReader, which Node doesn't have.
  if (typeof globalThis.FileReader === 'undefined') {
    class NodeFileReader {
      result: ArrayBuffer | null = null
      onloadend: (() => void) | null = null
      readAsArrayBuffer(blob: Blob) {
        void blob.arrayBuffer().then((buffer) => {
          this.result = buffer
          this.onloadend?.()
        })
      }
    }
    globalThis.FileReader = NodeFileReader as unknown as typeof FileReader
  }

  it('requires no glTF extensions and keeps colours within 0–1', async () => {
    const group = new THREE.Group()
    const { mesh } = optimisedPiece()
    mesh.material = new THREE.MeshStandardMaterial() // no image to encode in a test (no canvas here)
    group.add(mesh, sky(), slatWall())
    const blob = await exportGlb(prepareForExport(group))
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const view = new DataView(bytes.buffer)
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('glTF')
    const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + view.getUint32(12, true))))
    expect(json.extensionsRequired ?? []).toEqual([])
    for (const material of json.materials)
      for (const v of material.pbrMetallicRoughness?.baseColorFactor ?? []) expect(v).toBeLessThanOrEqual(1)
    expect(json.meshes.length).toBeGreaterThanOrEqual(3)
  })
})
