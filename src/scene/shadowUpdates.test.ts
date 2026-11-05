import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { shadowSignature } from './shadowUpdates'

function makeScene() {
  const scene = new THREE.Scene()
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 0.9))
  sofa.castShadow = true
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2, 3)) // receives, doesn't cast
  const sun = new THREE.DirectionalLight()
  sun.castShadow = true
  sun.position.set(5, 8, 2)
  const camera = new THREE.PerspectiveCamera()
  scene.add(sofa, rug, sun, sun.target, camera)
  scene.updateMatrixWorld()
  return { scene, sofa, rug, sun, camera }
}

const signature = (scene: THREE.Scene) => {
  scene.updateMatrixWorld()
  return shadowSignature(scene)
}

describe('shadowSignature', () => {
  it('ignores the camera, so orbiting reuses the shadows', () => {
    const { scene, camera } = makeScene()
    const before = signature(scene)
    camera.position.set(3, 4, 5)
    camera.lookAt(0, 0, 0)
    expect(signature(scene)).toBe(before)
  })

  it('changes when a shadow-casting piece moves or turns', () => {
    const { scene, sofa } = makeScene()
    const before = signature(scene)
    sofa.position.x = 0.05
    const moved = signature(scene)
    expect(moved).not.toBe(before)
    sofa.rotation.y = 0.3
    expect(signature(scene)).not.toBe(moved)
  })

  it('changes when a piece is added, removed, hidden or swapped for a new shape', () => {
    const { scene, sofa } = makeScene()
    const before = signature(scene)
    sofa.visible = false
    expect(signature(scene)).not.toBe(before)
    sofa.visible = true
    expect(signature(scene)).toBe(before)
    sofa.geometry = new THREE.BoxGeometry(1.6, 0.8, 0.9)
    const swapped = signature(scene)
    expect(swapped).not.toBe(before)
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8))
    chair.castShadow = true
    scene.add(chair)
    expect(signature(scene)).not.toBe(swapped)
  })

  it('changes when a wall moves between layers (hidden walls, see Cutaway)', () => {
    const { scene, sofa } = makeScene()
    const before = signature(scene)
    sofa.layers.disable(0)
    sofa.layers.enable(1)
    expect(signature(scene)).not.toBe(before)
  })

  it('changes when the sun moves, but not for things that cast no shadow', () => {
    const { scene, sun, rug } = makeScene()
    const before = signature(scene)
    rug.position.y = 0.5
    expect(signature(scene)).toBe(before)
    sun.position.set(-5, 8, 2)
    expect(signature(scene)).not.toBe(before)
  })
})
