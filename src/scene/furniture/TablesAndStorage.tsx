import { materials } from '../materials'
import { Block, Cylinder } from '../parts'
import { getVariant } from './catalog'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Tables and storage added in Phase 10: side table, desk, bookshelf, chest of
 * drawers and bathroom cabinet. Each faces +z (its front). Where a real model
 * exists for an option (see models.ts), the one here is shown while it loads.
 */

/** "round": round top on a black pedestal. "wood": open wooden cube. Colour = the wood. */
export function SideTable({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  if (variant === 'wood') {
    const [w, d] = getVariant('sideTable', 'wood').footprint
    const h = 0.5
    return (
      <group>
        <Block size={[w, 0.03, d]} position={[0, h - 0.015, 0]} material={wood} />
        <Block size={[w, 0.03, d]} position={[0, 0.015, 0]} material={wood} />
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.03, h, d]} position={[s * (w / 2 - 0.015), h / 2, 0]} material={wood} />
        ))}
        <Block size={[w - 0.06, h - 0.06, 0.015]} position={[0, h / 2, -d / 2 + 0.008]} material={wood} />
        {/* A couple of books on the shelf */}
        <Block size={[0.24, 0.04, 0.17]} position={[0, 0.05, 0]} material={materials.bookA} />
        <Block size={[0.22, 0.035, 0.16]} position={[0.01, 0.087, 0]} rotation={[0, 0.15, 0]} material={materials.bookB} />
      </group>
    )
  }
  return (
    <group>
      <Cylinder radiusTop={0.225} height={0.025} segments={40} position={[0, 0.54, 0]} material={wood} />
      <Cylinder radiusTop={0.018} height={0.5} position={[0, 0.27, 0]} material={materials.metalBlack} />
      <Cylinder radiusTop={0.15} radiusBottom={0.16} height={0.02} segments={32} position={[0, 0.01, 0]} material={materials.metalBlack} />
      <Cylinder radiusTop={0.03} radiusBottom={0.05} height={0.16} position={[0.06, 0.635, -0.04]} material={materials.ceramic} />
    </group>
  )
}

const DESK_H = 0.74

/** Writing desk on slim black legs, with a drawer, a closed laptop and a cup. Colour = the wood. */
export function Desk({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const [w, d] = getVariant('desk', variant).footprint
  return (
    <group>
      <Block size={[w, 0.03, d]} radius={0.008} position={[0, DESK_H - 0.015, 0]} material={wood} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Block
          key={i}
          size={[0.03, DESK_H - 0.03, 0.03]}
          position={[sx * (w / 2 - 0.04), (DESK_H - 0.03) / 2, sz * (d / 2 - 0.04)]}
          material={materials.metalBlack}
        />
      ))}
      {/* Shallow drawer under the right side */}
      <Block size={[0.4, 0.09, d - 0.1]} position={[w / 2 - 0.27, DESK_H - 0.075, 0]} material={wood} />
      <Block size={[0.12, 0.012, 0.015]} position={[w / 2 - 0.27, DESK_H - 0.075, d / 2 - 0.04]} material={materials.brass} />
      {/* Laptop and a cup */}
      <Block
        size={[0.33, 0.02, 0.23]}
        radius={0.006}
        position={[-0.1, DESK_H + 0.01, 0.02]}
        rotation={[0, 0.08, 0]}
        material={materials.steel}
      />
      <Cylinder
        radiusTop={0.04}
        radiusBottom={0.035}
        height={0.09}
        position={[w / 2 - 0.2, DESK_H + 0.045, -0.1]}
        material={materials.ceramic}
      />
    </group>
  )
}

const BOOK_COLOURS = [materials.bookA, materials.bookB, materials.terracotta, materials.fabricSage, materials.ceramic]

/** A row of books, deterministic (same every time), filling about `fill` of the width. */
function Books({ width, y, z, seed, fill = 0.7 }: { width: number; y: number; z: number; seed: number; fill?: number }) {
  const books: { x: number; w: number; h: number; m: number }[] = []
  let x = -width / 2 + 0.03
  let i = seed
  while (x < -width / 2 + width * fill) {
    const w = 0.025 + ((i * 7) % 5) * 0.006
    const h = 0.19 + ((i * 3) % 4) * 0.025
    books.push({ x: x + w / 2, w, h, m: i % BOOK_COLOURS.length })
    x += w + 0.003
    i += 1
  }
  return (
    <>
      {books.map((b, k) => (
        <Block key={k} size={[b.w, b.h, 0.2]} position={[b.x, y + b.h / 2, z]} material={BOOK_COLOURS[b.m]} />
      ))}
    </>
  )
}

/** "open": wooden shelves with books and a vase. "wide": steel frame with wood shelves (stand-in for its real model). */
export function Bookshelf({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const [w, d] = getVariant('bookshelf', variant).footprint
  const wide = variant === 'wide'
  const h = wide ? 2.0 : 1.8
  const shelves = 5
  const frame = wide ? materials.metalBlack : wood
  const ys = Array.from({ length: shelves }, (_, i) => 0.06 + (i * (h - 0.1)) / (shelves - 1))
  return (
    <group>
      {/* Sides (wood), or four steel posts */}
      {wide
        ? [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sz], i) => (
            <Block key={i} size={[0.03, h, 0.03]} position={[sx * (w / 2 - 0.015), h / 2, sz * (d / 2 - 0.015)]} material={frame} />
          ))
        : [-1, 1].map((s) => <Block key={s} size={[0.025, h, d]} position={[s * (w / 2 - 0.0125), h / 2, 0]} material={frame} />)}
      {!wide && <Block size={[w - 0.05, h - 0.02, 0.012]} position={[0, h / 2, -d / 2 + 0.006]} material={wood} />}
      {ys.map((y, i) => (
        <Block key={i} size={[w - (wide ? 0.01 : 0.05), 0.025, d - 0.01]} position={[0, y, 0]} material={wood} />
      ))}
      {/* Books on most shelves, a vase on one */}
      {ys
        .slice(0, -1)
        .map((y, i) =>
          i === 2 ? (
            <Cylinder
              key={i}
              radiusTop={0.05}
              radiusBottom={0.07}
              height={0.24}
              position={[w * 0.18, y + 0.132, 0]}
              material={materials.ceramic}
            />
          ) : (
            <Books key={i} width={w - 0.06} y={y + 0.0125} z={0} seed={i * 5 + (wide ? 2 : 0)} fill={i % 2 ? 0.55 : 0.75} />
          ),
        )}
    </group>
  )
}

/** "low": three-drawer chest on short legs. "tall": tall drawer cabinet (stand-in for its real model). Colour = the wood. */
export function ChestOfDrawers({ color, variant }: ModelProps) {
  const wood = useTintedMaterial(materials.woodLight, color)
  const [w, d] = getVariant('chestOfDrawers', variant).footprint
  const tall = variant === 'tall'
  const legH = tall ? 0.05 : 0.12
  const bodyH = tall ? 1.8 : 0.66
  const drawers = tall ? 6 : 3
  const gap = 0.012
  const drawerH = (bodyH - 0.06 - gap * (drawers - 1)) / drawers
  return (
    <group>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <Cylinder
          key={i}
          radiusTop={0.018}
          radiusBottom={0.012}
          height={legH}
          position={[sx * (w / 2 - 0.05), legH / 2, sz * (d / 2 - 0.05)]}
          material={materials.woodDark}
        />
      ))}
      <Block size={[w, bodyH, d]} radius={0.01} position={[0, legH + bodyH / 2, 0]} material={wood} />
      {Array.from({ length: drawers }, (_, i) => {
        const y = legH + 0.03 + drawerH / 2 + i * (drawerH + gap)
        return (
          <group key={i}>
            <Block size={[w - 0.05, drawerH, 0.012]} position={[0, y, d / 2 + 0.004]} material={wood} />
            <Block size={[0.14, 0.012, 0.018]} position={[0, y + drawerH * 0.2, d / 2 + 0.014]} material={materials.brass} />
          </group>
        )
      })}
      {/* A lamp-free top: a small plant pot and a tray */}
      {!tall && (
        <>
          <Cylinder
            radiusTop={0.06}
            radiusBottom={0.05}
            height={0.1}
            position={[-w / 2 + 0.16, legH + bodyH + 0.05, 0]}
            material={materials.terracotta}
          />
          <Block
            size={[0.26, 0.015, 0.16]}
            radius={0.005}
            position={[w / 2 - 0.22, legH + bodyH + 0.008, 0.02]}
            material={materials.brass}
          />
        </>
      )}
    </group>
  )
}

/** "tall": tall cupboard with one door. "low": two-door low cupboard. Colour = the cabinet finish. */
export function BathroomCabinet({ color, variant }: ModelProps) {
  const cabinet = useTintedMaterial(materials.creamLacquer, color)
  const [w, d] = getVariant('bathroomCabinet', variant).footprint
  const tall = variant === 'tall'
  const legH = 0.1
  const bodyH = tall ? 1.6 : 0.75
  const doors = tall ? 1 : 2
  const doorW = (w - 0.02) / doors - 0.006
  return (
    <group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Cylinder
            key={`${sx}${sz}`}
            radiusTop={0.012}
            height={legH}
            position={[sx * (w / 2 - 0.04), legH / 2, sz * (d / 2 - 0.04)]}
            material={materials.chrome}
          />
        )),
      )}
      <Block size={[w, bodyH, d]} radius={0.008} position={[0, legH + bodyH / 2, 0]} material={cabinet} />
      {Array.from({ length: doors }, (_, i) => {
        const x = doors === 1 ? 0 : (i - 0.5) * (doorW + 0.006)
        return (
          <group key={i}>
            <Block size={[doorW, bodyH - 0.02, 0.012]} position={[x, legH + bodyH / 2, d / 2 + 0.004]} material={cabinet} />
            <Block
              size={[0.012, 0.16, 0.02]}
              position={[
                doors === 1 ? w / 2 - 0.05 : x + (i === 0 ? 1 : -1) * (doorW / 2 - 0.03),
                legH + bodyH * (tall ? 0.5 : 0.75),
                d / 2 + 0.016,
              ]}
              material={materials.chrome}
            />
          </group>
        )
      })}
      {/* Folded towels on top of the low one */}
      {!tall && <Block size={[0.3, 0.1, 0.22]} radius={0.03} position={[0, legH + bodyH + 0.05, 0]} material={materials.linen} />}
    </group>
  )
}
