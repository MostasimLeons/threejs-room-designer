import { useContext } from 'react'
import { materials } from '../materials'
import { InteriorLightContext } from '../interiorLight'
import { useQuality } from '../quality'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Oak bedside table on slim brass legs, with a ceramic table lamp on top.
 * "drawers" = two cream drawers; "shelf" = one drawer over an open shelf.
 * The lamp glows and, from dusk, casts a soft warm light around the bed (Phase 11).
 * On Low quality it only glows: every extra light makes all materials a bit slower.
 */
export function BedsideTable({ color, variant, frame }: ModelProps) {
  const metal = frameMaterial(frame, materials.brass)
  const wood = useTintedMaterial(materials.woodLight, color)
  const w = 0.5
  const d = 0.4
  const bodyH = 0.42
  const legH = 0.14
  const top = legH + bodyH
  const front = d / 2 + 0.005
  const shelf = variant === 'shelf'
  const interior = useContext(InteriorLightContext) // 0 = daylight, 1 = night
  const { level } = useQuality()

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
          radiusTop={0.012}
          height={legH}
          position={[sx * (w / 2 - 0.04), legH / 2, sz * (d / 2 - 0.04)]}
          material={metal}
        />
      ))}
      <Block size={[w, bodyH, d]} radius={0.015} position={[0, legH + bodyH / 2, 0]} material={wood} />

      {/* Drawer fronts (cream) with small brass pulls */}
      {(shelf ? [0.3] : [0.3, 0.1]).map((y) => (
        <group key={y}>
          <Block size={[w - 0.05, 0.17, 0.012]} position={[0, legH + y, front]} material={materials.creamLacquer} />
          <Block size={[0.1, 0.012, 0.015]} position={[0, legH + y + 0.03, front + 0.012]} material={metal} />
        </group>
      ))}
      {shelf && (
        // Dark recess for the open shelf, with a folded throw on it
        <>
          <Block size={[w - 0.05, 0.17, 0.01]} position={[0, legH + 0.1, d / 2 - 0.02]} material={materials.slatBacking} />
          <Block size={[0.3, 0.06, 0.24]} radius={0.02} position={[0, legH + 0.06, 0]} material={materials.fabricSand} />
        </>
      )}

      {/* Table lamp */}
      <group position={[0.06, top, -0.04]}>
        <Cylinder radiusTop={0.05} radiusBottom={0.075} height={0.22} segments={24} position={[0, 0.11, 0]} material={materials.ceramic} />
        <Cylinder radiusTop={0.008} height={0.08} position={[0, 0.26, 0]} material={metal} />
        <mesh position={[0, 0.36, 0]} material={materials.lampShade}>
          <cylinderGeometry args={[0.1, 0.14, 0.18, 28, 1, true]} />
        </mesh>
        <mesh position={[0, 0.33, 0]} material={materials.bulb}>
          <sphereGeometry args={[0.03, 12, 10]} />
        </mesh>
        {level !== 'low' && (
          // A short reach: it lights the bedside and the pillows, not the whole room.
          <pointLight position={[0, 0.32, 0.02]} color="#ffcf8f" intensity={0.15 + 1.6 * interior} distance={2.6} decay={2} />
        )}
      </group>
    </group>
  )
}
