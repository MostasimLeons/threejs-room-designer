import * as THREE from 'three'
import type { FloorId } from './finishes'

// Small deterministic random generator so the floor looks the same on every reload.
function createRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

type RGB = [number, number, number]
const SIZE = 1024

/** Wooden planks: staggered boards with grain lines and dark seams. */
function drawPlanks(ctx: CanvasRenderingContext2D, rand: () => number, base: RGB, grain: RGB) {
  const rows = 8
  const rowHeight = SIZE / rows

  for (let row = 0; row < rows; row++) {
    const y = row * rowHeight
    // Start each row at a different offset so plank ends are staggered.
    let x = -rand() * SIZE * 0.5

    while (x < SIZE) {
      const length = SIZE * (0.35 + rand() * 0.4)
      const shade = 0.86 + rand() * 0.22
      ctx.fillStyle = `rgb(${base[0] * shade}, ${base[1] * shade}, ${base[2] * shade})`
      ctx.fillRect(x, y, length, rowHeight)

      // Wood grain: faint wavy lines running along the plank.
      for (let i = 0; i < 22; i++) {
        const gy = y + rand() * rowHeight
        ctx.strokeStyle = `rgba(${grain.join(',')}, ${0.04 + rand() * 0.08})`
        ctx.lineWidth = 0.6 + rand() * 1.6
        ctx.beginPath()
        ctx.moveTo(x, gy)
        ctx.quadraticCurveTo(x + length / 2, gy + (rand() - 0.5) * 10, x + length, gy + (rand() - 0.5) * 6)
        ctx.stroke()
      }

      // Seam at the end of each plank.
      ctx.fillStyle = `rgba(${grain.join(',')}, 0.5)`
      ctx.fillRect(x, y, 2, rowHeight)
      x += length
    }

    // Seam between rows.
    ctx.fillStyle = `rgba(${grain.join(',')}, 0.55)`
    ctx.fillRect(0, y, SIZE, 2)
  }
}

/** Polished concrete: a flat grey with soft blotches and tiny specks. */
function drawConcrete(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = 'rgb(178, 175, 169)'
  ctx.fillRect(0, 0, SIZE, SIZE)
  for (let i = 0; i < 120; i++) {
    const x = rand() * SIZE
    const y = rand() * SIZE
    const r = 40 + rand() * 140
    const light = rand() > 0.5
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, light ? 'rgba(255,255,255,0.035)' : 'rgba(60,55,50,0.035)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(70, 65, 60, ${rand() * 0.25})`
    ctx.fillRect(rand() * SIZE, rand() * SIZE, 1.5, 1.5)
  }
}

/** Large stone tiles (4 × 4 per texture) with grout lines and gentle veining. */
function drawTiles(ctx: CanvasRenderingContext2D, rand: () => number) {
  const count = 4
  const tile = SIZE / count
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const shade = 0.95 + rand() * 0.06
      ctx.fillStyle = `rgb(${228 * shade}, ${223 * shade}, ${214 * shade})`
      ctx.fillRect(col * tile, row * tile, tile, tile)
      // Veins
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(150, 140, 128, ${0.08 + rand() * 0.1})`
        ctx.lineWidth = 0.8 + rand()
        ctx.beginPath()
        ctx.moveTo(col * tile + rand() * tile, row * tile)
        ctx.bezierCurveTo(
          col * tile + rand() * tile,
          row * tile + tile * 0.3,
          col * tile + rand() * tile,
          row * tile + tile * 0.7,
          col * tile + rand() * tile,
          row * tile + tile,
        )
        ctx.stroke()
      }
    }
  }
  // Grout lines
  ctx.fillStyle = 'rgba(150, 142, 130, 0.9)'
  for (let i = 0; i < count; i++) {
    ctx.fillRect(i * tile, 0, 3, SIZE)
    ctx.fillRect(0, i * tile, SIZE, 3)
  }
}

/** White marble: 2 × 2 large slabs with soft grey veins that wander across each slab. */
function drawMarble(ctx: CanvasRenderingContext2D, rand: () => number) {
  const count = 2
  const slab = SIZE / count
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const x0 = col * slab
      const y0 = row * slab
      const shade = 0.97 + rand() * 0.03
      ctx.fillStyle = `rgb(${238 * shade}, ${236 * shade}, ${232 * shade})`
      ctx.fillRect(x0, y0, slab, slab)
      // Soft cloudy patches
      for (let i = 0; i < 18; i++) {
        const cx = x0 + rand() * slab
        const cy = y0 + rand() * slab
        const r = 30 + rand() * 120
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        gradient.addColorStop(0, 'rgba(170, 168, 165, 0.06)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(x0, y0, slab, slab)
      }
      // Veins: a few long wandering lines, thin and faint, each with a fainter halo
      ctx.save()
      ctx.beginPath()
      ctx.rect(x0, y0, slab, slab)
      ctx.clip()
      for (let v = 0; v < 5; v++) {
        let x = x0 + rand() * slab
        let y = y0
        const drift = (rand() - 0.5) * 2.5
        ctx.beginPath()
        ctx.moveTo(x, y)
        while (y < y0 + slab) {
          x += drift * 6 + (rand() - 0.5) * 14
          y += 6 + rand() * 10
          ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(120, 120, 124, ${0.18 + rand() * 0.2})`
        ctx.lineWidth = 0.8 + rand() * 1.4
        ctx.stroke()
        ctx.strokeStyle = 'rgba(140, 140, 145, 0.05)'
        ctx.lineWidth = 6
        ctx.stroke()
      }
      ctx.restore()
    }
  }
  // Fine joints between slabs
  ctx.fillStyle = 'rgba(175, 172, 168, 0.8)'
  for (let i = 0; i < count; i++) {
    ctx.fillRect(i * slab, 0, 2, SIZE)
    ctx.fillRect(0, i * slab, SIZE, 2)
  }
}

/** Terrazzo: a warm cement base scattered with chips of marble and coloured stone. */
function drawTerrazzo(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = 'rgb(230, 222, 210)'
  ctx.fillRect(0, 0, SIZE, SIZE)
  const chips: RGB[] = [
    [250, 248, 244],
    [196, 186, 172],
    [120, 112, 104],
    [192, 140, 112],
    [150, 160, 146],
    [70, 66, 64],
  ]
  for (let i = 0; i < 2600; i++) {
    const [r, g, b] = chips[Math.floor(rand() * chips.length)]
    const x = rand() * SIZE
    const y = rand() * SIZE
    const size = 2 + rand() * rand() * 16
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.beginPath()
    // An irregular polygon, so chips look broken rather than round
    const sides = 4 + Math.floor(rand() * 3)
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2 + rand() * 0.6
      const d = size * (0.6 + rand() * 0.5)
      const px = x + Math.cos(a) * d
      const py = y + Math.sin(a) * d
      if (k === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }
}

function drawFloor(floor: FloorId): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const rand = createRandom(7)

  switch (floor) {
    case 'oak':
      drawPlanks(ctx, rand, [190, 140, 96], [95, 60, 30])
      break
    case 'walnut':
      drawPlanks(ctx, rand, [118, 80, 54], [50, 30, 18])
      break
    case 'ash':
      drawPlanks(ctx, rand, [226, 208, 182], [150, 125, 95])
      break
    case 'concrete':
      drawConcrete(ctx, rand)
      break
    case 'tiles':
      drawTiles(ctx, rand)
      break
    case 'marble':
      drawMarble(ctx, rand)
      break
    case 'terrazzo':
      drawTerrazzo(ctx, rand)
      break
  }
  return canvas
}

/** Brightness of every pixel, 0…1. Used as a "height": dark seams and grout read as grooves. */
function luminance(canvas: HTMLCanvasElement): Float32Array {
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
  const out = new Float32Array(canvas.width * canvas.height)
  for (let i = 0; i < out.length; i++) {
    out[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
  }
  return out
}

function canvasFromPixels(size: number, fill: (pixels: Uint8ClampedArray) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)
  fill(image.data)
  ctx.putImageData(image, 0, 0)
  return canvas
}

/**
 * Turns a height field into a tangent-space normal map: the purple-blue image
 * that tells the renderer which way each pixel's surface tilts, so light catches
 * seams, grain and weave without any extra geometry. Edges wrap, so it tiles.
 */
function normalMapFromHeight(height: Float32Array, size: number, strength: number): HTMLCanvasElement {
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)]
  return canvasFromPixels(size, (px) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Slope left→right, and bottom→top (canvas rows run downwards, texture v runs upwards).
        const dx = (at(x + 1, y) - at(x - 1, y)) * strength
        const dy = (at(x, y - 1) - at(x, y + 1)) * strength
        const len = Math.hypot(dx, dy, 1)
        const i = (y * size + x) * 4
        px[i] = (-dx / len) * 127.5 + 127.5
        px[i + 1] = (-dy / len) * 127.5 + 127.5
        px[i + 2] = (1 / len) * 127.5 + 127.5
        px[i + 3] = 255
      }
    }
  })
}

/**
 * Roughness map: 1 = fully matte. The material's own `roughness` is multiplied by
 * this, so darker seams/grout come out a little rougher than the polished surface.
 */
function roughnessFromHeight(height: Float32Array, size: number, variation: number): HTMLCanvasElement {
  let min = 1
  let max = 0
  for (const h of height) {
    if (h < min) min = h
    if (h > max) max = h
  }
  const range = Math.max(max - min, 1e-6)
  return canvasFromPixels(size, (px) => {
    for (let i = 0; i < height.length; i++) {
      const value = 255 * (1 - variation * ((height[i] - min) / range))
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = value
      px[i * 4 + 3] = 255
    }
  })
}

function toTexture(canvas: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  // Colour images are sRGB; normal and roughness maps hold plain numbers, so they stay linear.
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export interface SurfaceMaps {
  map: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

/** How strongly seams/grout dent the surface, and how much rougher they are. */
const FLOOR_RELIEF: Record<FloorId, { strength: number; roughness: number }> = {
  oak: { strength: 3, roughness: 0.35 },
  walnut: { strength: 4, roughness: 0.35 },
  ash: { strength: 3, roughness: 0.35 },
  concrete: { strength: 1.2, roughness: 0.3 },
  tiles: { strength: 4, roughness: 0.55 },
  marble: { strength: 1.5, roughness: 0.4 },
  terrazzo: { strength: 1.2, roughness: 0.3 },
}

/**
 * Draws a floor finish onto a 2D canvas and turns it into colour, normal and
 * roughness textures. Everything is generated in code, so nothing is downloaded.
 */
export function createFloorMaps(floor: FloorId): SurfaceMaps {
  const colour = drawFloor(floor)
  const height = luminance(colour)
  const { strength, roughness } = FLOOR_RELIEF[floor]
  return {
    map: toTexture(colour, true),
    normalMap: toTexture(normalMapFromHeight(height, SIZE, strength), false),
    roughnessMap: toTexture(roughnessFromHeight(height, SIZE, roughness), false),
  }
}

/** Eases 0…1 so noise blends without visible grid lines. */
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * Smooth random bumps that wrap around the edges (so the texture tiles), made
 * by blending random values on a coarse `cells` × `cells` grid.
 */
function tileableNoise(size: number, cells: number, rand: () => number): Float32Array {
  const grid = Array.from({ length: cells * cells }, rand)
  const value = (cx: number, cy: number) => grid[(cy % cells) * cells + (cx % cells)]
  const out = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells
      const gy = (y / size) * cells
      const x0 = Math.floor(gx)
      const y0 = Math.floor(gy)
      const tx = smoothstep(gx - x0)
      const ty = smoothstep(gy - y0)
      const top = value(x0, y0) * (1 - tx) + value(x0 + 1, y0) * tx
      const bottom = value(x0, y0 + 1) * (1 - tx) + value(x0 + 1, y0 + 1) * tx
      out[y * size + x] = top * (1 - ty) + bottom * ty
    }
  }
  return out
}

/**
 * Fabric surface: a fine criss-cross weave plus soft irregular "slub" bumps.
 * Shared by sofas, chairs, bedding, curtains and rugs; only its tiling changes.
 */
export function createFabricNormalMap(): THREE.CanvasTexture {
  const size = 512
  const rand = createRandom(11)
  const coarse = tileableNoise(size, 8, rand)
  const fine = tileableNoise(size, 64, rand)
  const threads = 128 // weave repeats per texture: must divide evenly so it tiles
  const height = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const weave = Math.sin((2 * Math.PI * x * threads) / size) * Math.sin((2 * Math.PI * y * threads) / size)
      const i = y * size + x
      height[i] = 0.25 * weave + 0.45 * coarse[i] + 0.3 * fine[i]
    }
  }
  return toTexture(normalMapFromHeight(height, size, 1.5), false)
}

/** How many metres of wall one copy of the wall-tile texture covers (2 × 2 tiles of 30 cm). */
export const WALL_TILE_REPEAT = 0.6

/**
 * Square ceramic wall tiles with grout lines, for tiled walls. Nearly white, so
 * the material's colour (the wall colour you pick) tints the tiles. The normal map
 * makes the grout read as recessed, and the roughness map keeps the grout matte
 * while the glaze stays glossy.
 */
export function createWallTileMaps(): SurfaceMaps {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = createRandom(23)
  const count = 2
  const tile = size / count
  const grout = 6
  ctx.fillStyle = 'rgb(206, 204, 200)'
  ctx.fillRect(0, 0, size, size)
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const shade = 0.96 + rand() * 0.04
      ctx.fillStyle = `rgb(${250 * shade}, ${249 * shade}, ${246 * shade})`
      // Grout is split between neighbouring tiles, so the texture tiles seamlessly.
      ctx.fillRect(col * tile + grout / 2, row * tile + grout / 2, tile - grout, tile - grout)
    }
  }
  const height = luminance(canvas)
  return {
    map: toTexture(canvas, true),
    normalMap: toTexture(normalMapFromHeight(height, size, 6), false),
    roughnessMap: toTexture(roughnessFromHeight(height, size, 0.7), false),
  }
}
