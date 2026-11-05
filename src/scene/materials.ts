import * as THREE from 'three'
import {
  createFabricNormalMap,
  createPanellingMaps,
  createWallpaperMaps,
  createWallTileMaps,
  PANELLING_REPEAT,
  WALL_TILE_REPEAT,
  WALLPAPER_REPEAT,
} from './textures'

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

  // Unlit material for the bright "sky" seen through the window. Brighter than white
  // (values above 1), so the window reads as daylight and gets a soft glow from Bloom.
  sky: new THREE.MeshBasicMaterial({ color: new THREE.Color('#e4f0f7').multiplyScalar(1.6) }),

  // ---- Dining Room, Kitchen, Bathroom ----
  // Quartz-style worktop and counter: pale, slightly glossy stone.
  stone: new THREE.MeshStandardMaterial({ color: '#eeebe5', roughness: 0.22 }),
  // Brushed stainless steel (fridge, sink, extractor). Tinted per piece for coloured appliances.
  steel: new THREE.MeshStandardMaterial({ color: '#c9ccce', roughness: 0.32, metalness: 0.75 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#e6e8ea', roughness: 0.08, metalness: 1 }),
  // Glossy white enamel / ceramic for baths, basins and the toilet.
  enamel: new THREE.MeshStandardMaterial({ color: '#f7f6f3', roughness: 0.12 }),
  // Glossy kitchen splashback.
  splashback: new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.1 }),
  // Tiled walls: the wall colour tints near-white tiles (textures are added below, in the browser).
  wallTiles: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 }),
  // Wallpaper (matte paper) and painted wooden panelling (satin); textures added below.
  wallpaper: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
  panelling: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 }),

  // ---- Ceiling (see Ceiling.tsx) ----
  // Nothing lights a ceiling's underside directly (the lights are above it, and real
  // rooms light it with light bouncing off the floor), so a faint self-glow stands in
  // for that bounce. Otherwise it renders a muddy brown.
  ceiling: new THREE.MeshStandardMaterial({ color: '#f7f5f1', roughness: 0.95, emissive: '#f3ece2', emissiveIntensity: 0.55 }),
  // Warm-white glow for the cove line and downlights; above 1 so Bloom picks it up.
  coveLight: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1dc').multiplyScalar(3) }),
  downlightTrim: new THREE.MeshStandardMaterial({ color: '#e9e6e1', roughness: 0.4, metalness: 0.5 }),

  // ---- Bedroom (modern luxury: cream, natural oak, brass) ----
  linen: new THREE.MeshStandardMaterial({ color: '#f4eee3', roughness: 0.97 }),
  creamUpholstery: new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 0.95 }),
  creamLacquer: new THREE.MeshStandardMaterial({ color: '#f1ebdf', roughness: 0.35 }),
  curtain: new THREE.MeshStandardMaterial({ color: '#efe7d8', roughness: 1, side: THREE.DoubleSide }),
  slatBacking: new THREE.MeshStandardMaterial({ color: '#2f2b27', roughness: 0.95 }),
  carpet: new THREE.MeshStandardMaterial({ color: '#ece3d2', roughness: 1 }),
  carpetBorder: new THREE.MeshStandardMaterial({ color: '#d9ccb4', roughness: 1 }),
  // A fully metallic mirror would reflect the (mostly dark) surroundings and look black,
  // so it's a pale, glossy silver instead.
  mirror: new THREE.MeshStandardMaterial({ color: '#dbe4ea', roughness: 0.08, metalness: 0.35 }),

  // ---- Phase 10 ----
  // Brown leather, for the leather options' code-built stand-ins (their real models keep their own leather).
  leather: new THREE.MeshStandardMaterial({ color: '#5a3a29', roughness: 0.45 }),
}

/**
 * Soft furnishings get a fabric "weave" normal map so light catches their surface.
 * Pieces made from these materials (and recoloured copies of them) inherit it.
 * Canvas textures need a browser, so this is skipped when there is no document (tests).
 */
if (typeof document !== 'undefined') {
  const fabric = createFabricNormalMap()
  fabric.repeat.set(2, 2)
  // Rugs and carpets are big flat boxes, so the same texture is tiled more often there.
  const rug = fabric.clone()
  rug.repeat.set(10, 10)

  const soft: [THREE.MeshStandardMaterial, THREE.Texture, number][] = [
    [materials.fabricWhite, fabric, 0.35],
    [materials.fabricSage, fabric, 0.35],
    [materials.fabricSand, fabric, 0.35],
    [materials.linen, fabric, 0.25],
    [materials.creamUpholstery, fabric, 0.35],
    [materials.curtain, fabric, 0.2],
    [materials.rug, rug, 0.6],
    [materials.rugBorder, rug, 0.6],
    [materials.carpet, rug, 0.7],
    [materials.carpetBorder, rug, 0.7],
  ]
  for (const [material, map, strength] of soft) {
    material.normalMap = map
    material.normalScale.set(strength, strength)
  }

  // Wall tiles: wall pieces have UVs measured in metres (see RoomShell), so one texture
  // repeat covers WALL_TILE_REPEAT metres and the grout lines up across every piece.
  const tiles = createWallTileMaps()
  for (const texture of Object.values(tiles)) texture.repeat.set(1 / WALL_TILE_REPEAT, 1 / WALL_TILE_REPEAT)
  Object.assign(materials.wallTiles, tiles)
  materials.wallTiles.normalScale.set(0.8, 0.8)

  // Wallpaper and panelling line up across wall pieces the same way.
  const paper = createWallpaperMaps()
  for (const texture of Object.values(paper)) texture.repeat.set(1 / WALLPAPER_REPEAT, 1 / WALLPAPER_REPEAT)
  Object.assign(materials.wallpaper, paper)
  const boards = createPanellingMaps()
  for (const texture of Object.values(boards)) texture.repeat.set(1 / PANELLING_REPEAT, 1 / PANELLING_REPEAT)
  Object.assign(materials.panelling, boards)
  materials.panelling.normalScale.set(0.9, 0.9)
}
