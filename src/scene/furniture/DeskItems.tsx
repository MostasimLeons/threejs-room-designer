import { useContext } from 'react'
import * as THREE from 'three'
import { materials } from '../materials'
import { InteriorLightContext } from '../interiorLight'
import { useQuality } from '../quality'
import { frameMaterial } from './frames'
import { Block, Cylinder } from '../parts'
import { useTintedMaterial, type ModelProps } from './useTintedMaterial'

/**
 * Desk-top pieces and office accessories (Phase 17): monitor, laptop, keyboard and
 * mouse, desk lamp, desk accessories, wall clock and filing cabinet. Desk-top pieces
 * are drawn from their own base (y = 0); FurnitureLayer lifts them onto the desk or
 * table they stand on. Everything faces +z (towards where you sit).
 */

/** A switched-on screen: a calm blue desktop that glows a little. */
const SCREEN = new THREE.MeshStandardMaterial({ color: '#16202c', emissive: '#3a5b80', emissiveIntensity: 0.55, roughness: 0.2 })

/** Screen widths and heights (metres) per monitor size. */
const SCREENS: Record<string, { w: number; h: number; count: number; curved?: boolean }> = {
  '24': { w: 0.54, h: 0.32, count: 1 },
  '27': { w: 0.61, h: 0.36, count: 1 },
  ultrawide: { w: 0.81, h: 0.34, count: 1, curved: true },
  dual: { w: 0.54, h: 0.32, count: 2 },
}

/** Monitor (or two) on a stand: a thin bezel, a glowing screen, a neck and a flat foot. Colour = the frame. */
export function Monitor({ color, variant }: ModelProps) {
  const body = useTintedMaterial(materials.metalBlack, color)
  const { w, h, count, curved } = SCREENS[variant] ?? SCREENS['24']
  const screenY = 0.42 - h / 2 - 0.01
  const one = (x: number, turn: number) => (
    <group key={x} position={[x, 0, 0]} rotation={[0, turn, 0]}>
      {/* Foot and neck, at the back */}
      <Block size={[0.22, 0.012, 0.16]} radius={0.004} position={[0, 0.006, -0.01]} material={body} />
      <Block size={[0.05, screenY - 0.04, 0.025]} position={[0, (screenY - 0.04) / 2 + 0.012, -0.05]} material={body} />
      {/* Panel: bezel with the screen just in front */}
      <Block size={[w, h, 0.025]} radius={0.004} position={[0, screenY, -0.03]} material={body} />
      <Block size={[w - 0.016, h - 0.03, 0.002]} position={[0, screenY + 0.007, -0.0165]} material={SCREEN} />
    </group>
  )
  if (count === 2) return <group>{[one(-(w / 2 + 0.005), 0.12), one(w / 2 + 0.005, -0.12)]}</group>
  if (curved) {
    // Three slightly angled panels read as a curved ultrawide.
    const part = w / 3
    return (
      <group>
        <Block size={[0.3, 0.012, 0.18]} radius={0.004} position={[0, 0.006, -0.01]} material={body} />
        <Block size={[0.06, screenY - 0.04, 0.025]} position={[0, (screenY - 0.04) / 2 + 0.012, -0.06]} material={body} />
        {[-1, 0, 1].map((s) => (
          <group key={s} position={[s * part * 0.98, 0, Math.abs(s) * 0.03]} rotation={[0, -s * 0.18, 0]}>
            <Block size={[part + 0.004, h, 0.025]} position={[0, screenY, -0.045]} material={body} />
            <Block size={[part - 0.004, h - 0.03, 0.002]} position={[0, screenY + 0.007, -0.0315]} material={SCREEN} />
          </group>
        ))}
      </group>
    )
  }
  return <group>{one(0, 0)}</group>
}

/** Laptop, open towards you, or raised on a stand with the screen at eye height. Colour = the case. */
export function Laptop({ color, variant }: ModelProps) {
  const body = useTintedMaterial(materials.steel, color)
  const raised = variant === 'stand'
  const lift = raised ? 0.11 : 0
  const tilt = raised ? -0.55 : -0.3
  return (
    <group>
      {raised && (
        <>
          <Block size={[0.26, 0.01, 0.22]} position={[0, 0.005, 0]} material={materials.metalBlack} />
          <Block size={[0.02, 0.11, 0.2]} position={[-0.11, 0.06, 0]} rotation={[0.35, 0, 0]} material={materials.metalBlack} />
          <Block size={[0.02, 0.11, 0.2]} position={[0.11, 0.06, 0]} rotation={[0.35, 0, 0]} material={materials.metalBlack} />
        </>
      )}
      <group position={[0, lift, 0]} rotation={[raised ? 0.35 : 0, 0, 0]}>
        {/* Base with the keyboard */}
        <Block size={[0.31, 0.015, 0.21]} radius={0.005} position={[0, 0.0075, 0.02]} material={body} />
        <Block size={[0.27, 0.002, 0.1]} position={[0, 0.016, 0.0]} material={materials.metalBlack} />
        {/* Lid, opened back, with the screen facing you */}
        <group position={[0, 0.015, -0.085]} rotation={[tilt, 0, 0]}>
          <Block size={[0.31, 0.21, 0.008]} radius={0.004} position={[0, 0.105, 0]} material={body} />
          <Block size={[0.28, 0.18, 0.002]} position={[0, 0.108, 0.005]} material={SCREEN} />
        </group>
      </group>
    </group>
  )
}

/** Keyboard with a mouse to its right. Colour = both. */
export function KeyboardMouse({ color, variant }: ModelProps) {
  const body = useTintedMaterial(materials.ceramic, color)
  const compact = variant === 'compact'
  const kw = compact ? 0.32 : 0.45
  const kd = compact ? 0.12 : 0.15
  const total = compact ? 0.47 : 0.62
  const kx = -total / 2 + kw / 2
  return (
    <group>
      <Block size={[kw, 0.02, kd]} radius={0.004} position={[kx, 0.01, 0]} material={body} />
      {/* Key area, a shade darker */}
      <Block size={[kw - 0.02, 0.003, kd - 0.03]} position={[kx, 0.021, 0.004]} material={materials.metalBlack} />
      {/* Mouse */}
      <mesh position={[total / 2 - 0.04, 0.016, 0.01]} scale={[0.032, 0.016, 0.055]} material={body} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
    </group>
  )
}

/** Desk lamp: an adjustable arm, or a dome shade on a stem. Glows and lights the desk in the evening. */
export function DeskLamp({ color, variant }: ModelProps) {
  const metal = useTintedMaterial(materials.metalBlack, color)
  const interior = useContext(InteriorLightContext)
  const { level } = useQuality()
  const dome = variant === 'dome'
  // Where the light comes out (under the shade).
  const bulb: [number, number, number] = dome ? [0, 0.26, 0] : [0, 0.36, 0.17]
  return (
    <group>
      <Cylinder radiusTop={0.075} radiusBottom={0.08} height={0.02} position={[0, 0.01, 0]} segments={28} material={metal} />
      {dome ? (
        <>
          <Cylinder radiusTop={0.008} height={0.26} position={[0, 0.15, 0]} material={metal} />
          <mesh position={[0, 0.3, 0]} material={metal} castShadow>
            <sphereGeometry args={[0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </>
      ) : (
        <>
          {/* Lower arm leaning back, upper arm reaching forward, shade tilted down */}
          <Block size={[0.016, 0.26, 0.016]} position={[0, 0.14, -0.04]} rotation={[-0.3, 0, 0]} material={metal} />
          <Block size={[0.016, 0.016, 0.24]} position={[0, 0.27, 0.06]} rotation={[0.25, 0, 0]} material={metal} />
          <group position={[0, 0.37, 0.17]} rotation={[0.5, 0, 0]}>
            <Cylinder radiusTop={0.025} radiusBottom={0.06} height={0.09} position={[0, 0, 0]} segments={24} material={metal} />
          </group>
        </>
      )}
      <mesh position={bulb} material={materials.bulb}>
        <sphereGeometry args={[0.02, 12, 10]} />
      </mesh>
      {level !== 'low' && (
        // A short, warm reach: the desk top and the wall behind it.
        <pointLight
          position={[bulb[0], bulb[1] - 0.03, bulb[2]]}
          color="#ffd9a8"
          intensity={0.1 + 1.4 * interior}
          distance={2.2}
          decay={2}
        />
      )}
    </group>
  )
}

/** "organiser": a pen pot, a notepad and a phone on a wooden tray. "plant": a small potted plant. Colour = the tray or pot. */
export function DeskAccessories({ color, variant }: ModelProps) {
  const tint = useTintedMaterial(materials.ceramic, color)
  if (variant === 'plant') {
    return (
      <group>
        <Cylinder radiusTop={0.06} radiusBottom={0.045} height={0.09} position={[0, 0.045, 0]} segments={20} material={tint} />
        <mesh position={[0, 0.15, 0]} scale={[1, 0.9, 1]} material={materials.leaf} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
      </group>
    )
  }
  return (
    <group>
      <Block size={[0.3, 0.012, 0.16]} radius={0.004} position={[0, 0.006, 0]} material={tint} />
      {/* Pen pot with three pens */}
      <Cylinder radiusTop={0.035} height={0.1} position={[-0.1, 0.062, -0.02]} segments={18} material={materials.metalBlack} />
      {[-0.012, 0, 0.012].map((x, i) => (
        <Block
          key={i}
          size={[0.006, 0.07, 0.006]}
          position={[-0.1 + x, 0.13, -0.02 + x / 2]}
          rotation={[0, 0, x * 8]}
          material={i === 1 ? materials.terracotta : materials.bookB}
        />
      ))}
      {/* Notepad and phone */}
      <Block size={[0.1, 0.01, 0.14]} position={[0.02, 0.017, 0]} material={materials.linen} />
      <Block size={[0.07, 0.008, 0.14]} radius={0.004} position={[0.11, 0.016, 0]} material={materials.screen} />
    </group>
  )
}

/** One clock hand, pointing at `angle` (radians, clockwise from 12). */
const hand = (length: number, angle: number, width: number) => (
  <Block
    size={[width, length, 0.004]}
    position={[Math.sin(angle) * (length / 2), Math.cos(angle) * (length / 2), 0.028]}
    rotation={[0, 0, -angle]}
    material={materials.metalBlack}
  />
)

/** Round wall clock with hands at ten past ten. Colour = the frame. Hangs high, centred at 1.9 m. */
export function WallClock({ color, variant }: ModelProps) {
  const frame = useTintedMaterial(materials.metalBlack, color)
  const r = (variant === '40' ? 0.4 : 0.3) / 2
  return (
    <group position={[0, 1.9, -0.025 + 0.01]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]} material={frame} castShadow>
        <cylinderGeometry args={[r, r, 0.035, 48]} />
      </mesh>
      <Cylinder
        radiusTop={r - 0.012}
        height={0.004}
        rotation={[Math.PI / 2, 0, 0]}
        segments={48}
        position={[0, 0, 0.03]}
        material={materials.ceramic}
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <Block
            key={i}
            size={[0.006, i % 3 === 0 ? 0.025 : 0.012, 0.003]}
            position={[Math.sin(a) * (r - 0.03), Math.cos(a) * (r - 0.03), 0.033]}
            rotation={[0, 0, -a]}
            material={materials.metalBlack}
          />
        )
      })}
      <group position={[0, 0, 0.004]}>
        {hand(r * 0.5, (-2 * Math.PI) / 12 - 0.1, 0.008)}
        {hand(r * 0.75, (2 * Math.PI) / 12 + 0.05, 0.005)}
      </group>
    </group>
  )
}

/** Steel filing cabinet with two or three deep drawers, a label holder and a handle on each. Colour = the body. */
export function FilingCabinet({ color, variant, frame }: ModelProps) {
  const body = useTintedMaterial(materials.ceramic, color)
  const handles = frameMaterial(frame, materials.chrome)
  const drawers = variant === '3' ? 3 : 2
  const height = variant === '3' ? 1.02 : 0.72
  const w = 0.47
  const d = 0.62
  const gap = 0.008
  const drawerH = (height - 0.03 - gap * (drawers - 1)) / drawers
  return (
    <group>
      <Block size={[w, height, d]} radius={0.006} position={[0, height / 2, 0]} material={body} />
      {Array.from({ length: drawers }, (_, i) => {
        const y = 0.02 + drawerH / 2 + i * (drawerH + gap)
        return (
          <group key={i}>
            <Block size={[w - 0.02, drawerH, 0.01]} radius={0.003} position={[0, y, d / 2 + 0.004]} material={body} />
            <Block size={[0.16, 0.02, 0.025]} radius={0.004} position={[0, y + drawerH * 0.25, d / 2 + 0.018]} material={handles} />
            <Block size={[0.08, 0.035, 0.004]} position={[0, y + drawerH * 0.25 + 0.045, d / 2 + 0.01]} material={materials.linen} />
          </group>
        )
      })}
    </group>
  )
}
