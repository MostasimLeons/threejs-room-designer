import * as THREE from 'three'

// Shared materials. Creating each one once and reusing it is faster than
// making a new material for every mesh.
// `roughness` (0 = mirror, 1 = matte) and `metalness` drive the realistic look.
export const materials = {
  wall: new THREE.MeshStandardMaterial({ color: '#e8dcc8', roughness: 0.95 }),
  trim: new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.55 }),

  fabricWhite: new THREE.MeshStandardMaterial({ color: '#f1eee8', roughness: 0.96 }),
  fabricSage: new THREE.MeshStandardMaterial({ color: '#8e9c80', roughness: 0.95 }),
  fabricSand: new THREE.MeshStandardMaterial({ color: '#c9b393', roughness: 0.95 }),

  woodLight: new THREE.MeshStandardMaterial({ color: '#c49a6c', roughness: 0.55 }),
  woodDark: new THREE.MeshStandardMaterial({ color: '#6e4b33', roughness: 0.6 }),
  door: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.5 }),

  metalBlack: new THREE.MeshStandardMaterial({ color: '#1f1f22', roughness: 0.35, metalness: 0.6 }),
  brass: new THREE.MeshStandardMaterial({ color: '#b8925a', roughness: 0.3, metalness: 0.9 }),
  screen: new THREE.MeshStandardMaterial({ color: '#0a0b0d', roughness: 0.12, metalness: 0.4 }),
  glass: new THREE.MeshStandardMaterial({
    color: '#cfe4ef',
    roughness: 0.05,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  }),

  ceramic: new THREE.MeshStandardMaterial({ color: '#ecebe6', roughness: 0.35 }),
  terracotta: new THREE.MeshStandardMaterial({ color: '#b86f50', roughness: 0.7 }),
  soil: new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#4f7a45', roughness: 0.65, side: THREE.DoubleSide }),
  leafDark: new THREE.MeshStandardMaterial({ color: '#3a6234', roughness: 0.65, side: THREE.DoubleSide }),

  lampShade: new THREE.MeshStandardMaterial({
    color: '#f6eedd',
    emissive: '#ffd9a0',
    emissiveIntensity: 0.55,
    roughness: 0.9,
    side: THREE.DoubleSide,
  }),
  bulb: new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffe2b0', emissiveIntensity: 3 }),

  rug: new THREE.MeshStandardMaterial({ color: '#d6cab7', roughness: 1 }),
  rugBorder: new THREE.MeshStandardMaterial({ color: '#a89878', roughness: 1 }),
  bookA: new THREE.MeshStandardMaterial({ color: '#30475e', roughness: 0.8 }),
  bookB: new THREE.MeshStandardMaterial({ color: '#d9c7a7', roughness: 0.8 }),

  // Unlit material for the bright "sky" seen through the window.
  sky: new THREE.MeshBasicMaterial({ color: '#e4f0f7', toneMapped: false }),
}
