import { Component, Suspense, useEffect, useLayoutEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { allModelUrls, fitModel, type ModelSpec } from './models'

/**
 * A real 3D model (GLB) for one piece of furniture. While it downloads, and if it
 * ever fails, `fallback` (the code-built model) shows instead, so a slow or broken
 * file never leaves a gap in the room.
 */
export function GltfFurniture({
  spec,
  footprint,
  color,
  fallback,
}: {
  spec: ModelSpec
  footprint: [number, number]
  color: string
  fallback: ReactNode
}) {
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedModel spec={spec} footprint={footprint} color={color} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

function LoadedModel({ spec, footprint, color }: { spec: ModelSpec; footprint: [number, number]; color: string }) {
  // `true` = the files are meshopt-compressed (see scripts/optimize-models.mjs).
  const { scene } = useGLTF(spec.url, false, true)

  // Each piece gets its own copy, so moving or recolouring one never affects another.
  // Geometry and textures stay shared; only the colourable materials are copied.
  const { root, tinted } = useMemo(() => {
    const copy = scene.clone(true)
    const ownMaterials: THREE.MeshStandardMaterial[] = []
    copy.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const material = mesh.material as THREE.MeshStandardMaterial
      if (spec.tint.includes(material.name)) {
        const own = material.clone()
        mesh.material = own
        ownMaterials.push(own)
      }
    })
    copy.rotation.y = ((spec.rotation ?? 0) * Math.PI) / 180
    return { root: copy, tinted: ownMaterials }
  }, [scene, spec])

  useEffect(() => () => tinted.forEach((material) => material.dispose()), [tinted])
  useLayoutEffect(() => {
    for (const material of tinted) material.color.set(color)
  }, [tinted, color])

  // Measure the model (after its rotation) and fit it to the footprint.
  const fit = useMemo(() => {
    const holder = new THREE.Group()
    holder.add(root)
    holder.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(root)
    holder.remove(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    return fitModel({ size: size.toArray(), center: center.toArray(), minY: box.min.y }, footprint, spec)
  }, [root, footprint, spec])

  return (
    <group position={fit.position} scale={fit.scale}>
      <primitive object={root} />
    </group>
  )
}

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('A 3D model failed to load; showing the built-in model instead.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Starts downloading every model in the background, so switching rooms finds them ready. */
export function preloadModels() {
  for (const url of allModelUrls()) useGLTF.preload(url, false, true)
}
