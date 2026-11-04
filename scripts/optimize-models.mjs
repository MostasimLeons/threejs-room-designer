// Turns the original downloaded models (assets-src/models/<id>/<id>_1k.gltf) into
// small web-ready GLB files (public/models/<name>.glb).
//
//   npm run models            optimise every model listed in MODELS below
//   npm run models -- --inspect   just list each source model's meshes and materials
//
// What it does to each model:
// - dedup / prune / weld: remove duplicate and unused data, merge identical vertices
// - simplify (meshoptimizer): fewer triangles where a model is heavier than needed
// - textures: resized to at most 512 px and re-encoded as WebP (much smaller than JPEG)
// - "tint" materials: their colour texture becomes a light greyscale version, so the
//   app can colour them with the swatch you pick (colour × texture keeps the grain)
// - meshopt compression of the geometry (the app decodes it with MeshoptDecoder)
//
// The originals are CC0 models from Poly Haven (https://polyhaven.com), free for any use.

import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const SOURCE = 'assets-src/models'
const OUTPUT = 'public/models'

/**
 * Which source model becomes which app file.
 * - ratio: target fraction of triangles to keep (1 = don't simplify)
 * - error: how far (as a fraction of the model's size) simplifying may move the surface;
 *   leaves tolerate much more than furniture edges (default 0.002)
 * - tint: material names whose colour the app lets you change
 */
const MODELS = [
  { id: 'potted_plant_01', out: 'plant-large', ratio: 0.12, error: 0.02, tint: ['potted_plant_01_pot'] },
  { id: 'potted_plant_02', out: 'plant-small', ratio: 0.25, error: 0.02, tint: ['potted_plant_02_pot'] },
  { id: 'modern_coffee_table_01', out: 'coffee-table-rectangle', ratio: 1, tint: [] },
  { id: 'coffee_table_round_01', out: 'coffee-table-round', ratio: 1, tint: [] },
  { id: 'modern_wooden_cabinet', out: 'sideboard', ratio: 0.5, tint: ['modern_wooden_cabinet'] },
  { id: 'modern_arm_chair_01', out: 'armchair-lounge', ratio: 0.6, tint: ['modern_arm_chair_01_pillow'] },
  { id: 'mid_century_lounge_chair', out: 'accent-chair-lounge', ratio: 0.7, tint: [] },
]

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptEncoder,
})

function triangles(doc) {
  let count = 0
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) count += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3
  }
  return Math.round(count)
}

async function inspect() {
  for (const { id } of MODELS) {
    const doc = await io.read(join(SOURCE, id, `${id}_1k.gltf`))
    const root = doc.getRoot()
    const materials = root.listMaterials().map((m) => {
      const tex = m.getBaseColorTexture()
      return `${m.getName()} (${
        tex
          ? 'texture'
          : 'colour ' +
            m
              .getBaseColorFactor()
              .map((v) => v.toFixed(2))
              .join(',')
      }${m.getAlphaMode() !== 'OPAQUE' ? ', ' + m.getAlphaMode() : ''})`
    })
    console.log(`${id}: ${triangles(doc)} triangles, ${root.listMeshes().length} meshes\n  materials: ${materials.join('; ')}`)
  }
}

/**
 * Light, neutral version of a colour texture: greyscale, contrast stretched, then
 * squeezed into the bright range (sRGB 175–252). Textures are decoded from sRGB, so
 * anything darker would dim the colour you pick: 115 in sRGB is only 17% brightness.
 */
async function toTintable(texture) {
  const input = Buffer.from(texture.getImage())
  // Two passes: sharp applies its operations in a fixed internal order, so in one chain
  // the contrast stretch would run after (and undo) the brightening.
  const stretched = await sharp(input).greyscale().normalise({ lower: 2, upper: 99 }).toFormat('png').toBuffer()
  const output = await sharp(stretched).linear(0.3, 175).toFormat('png').toBuffer()
  texture.setImage(new Uint8Array(output)).setMimeType('image/png')
}

async function optimise({ id, out, ratio, error = 0.002, tint }) {
  const doc = await io.read(join(SOURCE, id, `${id}_1k.gltf`))
  const before = triangles(doc)

  for (const material of doc.getRoot().listMaterials()) {
    if (!tint.includes(material.getName())) continue
    const texture = material.getBaseColorTexture()
    if (texture) await toTintable(texture)
    material.setBaseColorFactor([1, 1, 1, 1])
  }

  await MeshoptEncoder.ready
  await MeshoptSimplifier.ready
  const steps = [dedup(), prune(), weld()]
  if (ratio < 1) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio, error }))
  steps.push(
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 82 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await doc.transform(...steps)

  const file = join(OUTPUT, `${out}.glb`)
  await io.write(file, doc)
  const { size } = await stat(file)
  console.log(`${out}.glb  ${(size / 1024).toFixed(0)} KB  ${before} → ${triangles(doc)} triangles`)
  return size
}

if (process.argv.includes('--inspect')) {
  await inspect()
} else {
  await mkdir(OUTPUT, { recursive: true })
  let total = 0
  for (const model of MODELS) total += await optimise(model)
  console.log(`total ${(total / 1024 / 1024).toFixed(2)} MB`)
}
