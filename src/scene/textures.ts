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

/**
 * Draws a floor finish onto a 2D canvas and turns it into a Three.js texture.
 * This avoids downloading any image files.
 */
export function createFloorTexture(floor: FloorId): THREE.CanvasTexture {
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
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}
