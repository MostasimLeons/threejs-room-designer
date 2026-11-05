import { useMemo } from 'react'
import * as THREE from 'three'
import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { frameMaterial } from './frames'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'
import { useFootprint } from './footprintContext'

/**
 * Pieces that hang on a wall (Phase 11). Like everything else they face +z, with
 * their back on the wall at z = -depth / 2; the catalog keeps them on the nearest
 * wall (mountOnWall). Heights are fixed: art and mirrors at eye level.
 */

const EYE = 1.5 // centre of a picture at eye level

/** A darker or lighter shade of a colour, e.g. for the second tone of a print. */
function shade(color: string, factor: number): string {
  return `#${new THREE.Color(color).multiplyScalar(factor).getHexString()}`
}

/** One framed print: frame, cream mount and a simple picture in the artwork colour. */
function Print({
  width,
  height,
  x = 0,
  y = EYE,
  picture,
  frame,
  colours,
}: {
  width: number
  height: number
  x?: number
  y?: number
  picture: Picture
  frame: THREE.Material
  colours: PrintColours
}) {
  return (
    <group position={[x, y, 0]}>
      <Block size={[width, height, 0.03]} position={[0, 0, -0.005]} material={frame} />
      <Block size={[width - 0.04, height - 0.04, 0.005]} position={[0, 0, 0.012]} material={materials.linen} />
      <PictureContent picture={picture} width={width - 0.12} height={height - 0.12} colours={colours} />
    </group>
  )
}

type Picture = 'abstract' | 'landscape' | 'arch' | 'circle' | 'lines'
/** The three tones of a print: the artwork colour, a darker and a lighter shade. */
interface PrintColours {
  main: THREE.Material
  dark: THREE.Material
  light: THREE.Material
}

/** The picture itself, built from a few flat shapes in the print's three tones. */
function PictureContent({ picture, width, height, colours }: { picture: Picture; width: number; height: number; colours: PrintColours }) {
  const { main, dark, light } = colours
  const z = 0.016
  switch (picture) {
    case 'landscape':
      return (
        <group position={[0, 0, z]}>
          <Block size={[width, height * 0.45, 0.002]} position={[0, height * 0.275, 0]} material={light} />
          <Block size={[width, height * 0.3, 0.002]} position={[0, -height * 0.075, 0.001]} material={main} />
          <Block size={[width, height * 0.25, 0.002]} position={[0, -height * 0.375, 0.002]} material={dark} />
          <Cylinder
            radiusTop={height * 0.09}
            height={0.002}
            rotation={[Math.PI / 2, 0, 0]}
            position={[width * 0.25, height * 0.25, 0.003]}
            material={main}
          />
        </group>
      )
    case 'arch':
      return (
        <group position={[0, 0, z]}>
          <Block size={[width * 0.6, height * 0.5, 0.002]} position={[0, -height * 0.15, 0]} material={main} />
          <Cylinder radiusTop={width * 0.3} height={0.002} rotation={[Math.PI / 2, 0, 0]} position={[0, height * 0.1, 0]} material={main} />
        </group>
      )
    case 'circle':
      return (
        <group position={[0, 0, z]}>
          <Cylinder
            radiusTop={width * 0.32}
            height={0.002}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, height * 0.05, 0]}
            material={dark}
          />
        </group>
      )
    case 'lines':
      return (
        <group position={[0, 0, z]}>
          {[-0.25, 0, 0.25].map((k, i) => (
            <Block key={k} size={[width * 0.8, height * 0.06, 0.002]} position={[0, k * height, 0]} material={[main, light, dark][i]} />
          ))}
        </group>
      )
    default:
      // Abstract: overlapping blocks and a circle
      return (
        <group position={[0, 0, z]}>
          <Block size={[width * 0.6, height * 0.55, 0.002]} position={[-width * 0.12, -height * 0.15, 0]} material={main} />
          <Block size={[width * 0.35, height * 0.3, 0.002]} position={[width * 0.2, height * 0.22, 0.001]} material={light} />
          <Cylinder
            radiusTop={width * 0.17}
            height={0.002}
            rotation={[Math.PI / 2, 0, 0]}
            position={[width * 0.12, -height * 0.05, 0.002]}
            material={dark}
          />
        </group>
      )
  }
}

/** Framed art: one portrait print, one landscape, or a set of three. Colour = the artwork's main tone. */
export function WallArt({ color, variant, frame }: ModelProps) {
  const main = useTintedMaterial(materials.wall, color)
  const dark = useTintedMaterial(
    materials.wall,
    useMemo(() => shade(color, 0.55), [color]),
  )
  const light = useTintedMaterial(
    materials.wall,
    useMemo(() => shade(color, 1.6), [color]),
  )
  const frameMat = frameMaterial(frame, materials.metalBlack)
  const [w, d] = useFootprint('wallArt', variant)
  const colours = { main, dark, light }

  return (
    <group position={[0, 0, -d / 2 + 0.015]}>
      {variant === 'landscape' && <Print width={w} height={0.8} picture="landscape" frame={frameMat} colours={colours} />}
      {variant === 'gallery' &&
        (['arch', 'circle', 'lines'] as const).map((picture, i) => (
          <Print key={picture} width={0.4} height={0.5} x={(i - 1) * 0.55} picture={picture} frame={frameMat} colours={colours} />
        ))}
      {variant !== 'landscape' && variant !== 'gallery' && (
        <Print width={w} height={0.8} picture="abstract" frame={frameMat} colours={colours} />
      )}
    </group>
  )
}

/** Round or tall mirror. Colour = the frame. */
export function WallMirror({ color, variant }: ModelProps) {
  const frameMat = useTintedMaterial(materials.brass, color)
  const [w, d] = useFootprint('wallMirror', variant)
  const back = -d / 2
  if (variant === 'tall') {
    const h = 1.6
    const y = 0.35 + h / 2
    return (
      <group position={[0, 0, back]}>
        <Block size={[w, h, 0.03]} position={[0, y, 0.015]} material={frameMat} />
        <Block size={[w - 0.06, h - 0.06, 0.005]} position={[0, y, 0.032]} material={materials.mirror} />
      </group>
    )
  }
  const r = w / 2
  return (
    <group position={[0, EYE - 0.05, back + 0.02]}>
      <mesh rotation={[0, 0, 0]} material={frameMat} castShadow receiveShadow>
        <torusGeometry args={[r - 0.02, 0.02, 12, 64]} />
      </mesh>
      <Cylinder
        radiusTop={r - 0.025}
        height={0.005}
        rotation={[Math.PI / 2, 0, 0]}
        segments={48}
        position={[0, 0, 0]}
        material={materials.mirror}
      />
    </group>
  )
}

const BOOKS = [materials.bookA, materials.bookB, materials.terracotta, materials.fabricSage]

/** Floating shelf, or two shelves on brackets, with books, a vase and a small plant. Colour = the wood. */
export function WallShelf({ color, variant, frame }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const brackets = frameMaterial(frame, materials.metalBlack)
  const [w, d] = useFootprint('wallShelf', variant)
  const shelves = variant === 'double' ? [1.3, 1.65] : [1.45]
  return (
    <group>
      {shelves.map((y, s) => (
        <group key={y} position={[0, y, 0]}>
          <Block size={[w, 0.03, d]} position={[0, 0, 0]} material={wood} />
          {variant === 'double' &&
            [-1, 1].map((side) => (
              <group key={side} position={[side * (w / 2 - 0.1), 0, 0]}>
                <Block size={[0.02, 0.12, 0.015]} position={[0, -0.07, -d / 2 + 0.008]} material={brackets} />
                <Block size={[0.02, 0.015, d - 0.02]} position={[0, -0.022, 0]} material={brackets} />
              </group>
            ))}
          {/* Things on the shelf */}
          {s === 0 ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <Block
                  key={i}
                  size={[0.03, 0.2 - (i % 2) * 0.03, 0.15]}
                  position={[-w / 2 + 0.1 + i * 0.034, 0.115 - (i % 2) * 0.015, 0]}
                  material={BOOKS[i]}
                />
              ))}
              <Cylinder
                radiusTop={0.04}
                radiusBottom={0.055}
                height={0.16}
                position={[w / 2 - 0.15, 0.095, 0]}
                material={materials.ceramic}
              />
            </>
          ) : (
            <>
              <Cylinder
                radiusTop={0.06}
                radiusBottom={0.045}
                height={0.09}
                position={[-w / 2 + 0.15, 0.06, 0]}
                material={materials.terracotta}
              />
              <mesh position={[-w / 2 + 0.15, 0.15, 0]} material={materials.leaf} castShadow>
                <sphereGeometry args={[0.08, 10, 8]} />
              </mesh>
              <Block size={[0.18, 0.025, 0.14]} position={[w / 2 - 0.2, 0.028, 0]} material={materials.bookB} />
            </>
          )}
        </group>
      ))}
    </group>
  )
}
