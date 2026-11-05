import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { resolveRoom, ROOM_IDS, ROOMS } from './house'
import { defaultLayout } from './layout'
import { ease, roomShots, shotPose, SHOT_SECONDS, tourShots, turntableShot, TURNTABLE_SECONDS } from './tour'
import { isHelper, prepareForExport, ROOM_MODEL_SCALE } from './arExport'
import { exportUsdz } from './arFiles'
import { ambienceMix } from '../audio/ambience'
import { chooseVideoFormat, VIDEO_FORMATS, videoExtension } from '../utils/video'

/** Phase 13: presentation (tour, video, sound, AR). */

const inside = (info: { width: number; depth: number; height: number }, [x, y, z]: number[]) =>
  Math.abs(x) < info.width / 2 && Math.abs(z) < info.depth / 2 && y > 0 && y < info.height

describe('guided tour', () => {
  it.each(ROOM_IDS)('%s: three shots; the corner and eye-level shots stay inside the room', (room) => {
    const info = ROOMS[room]
    const shots = roomShots(room, info)
    expect(shots.map((s) => s.kind)).toEqual(['overview', 'corner', 'eye'])
    for (const shot of shots.filter((s) => s.kind !== 'overview')) {
      for (const t of [0, 0.5, 1]) expect(inside(info, shotPose(shot, t * shot.duration).position)).toBe(true)
    }
  })

  it('the overview orbits the room and ends at the usual overview', () => {
    const [overview] = roomShots('living', ROOMS.living)
    const end = shotPose(overview, overview.duration)
    expect(end.position).toEqual(overview.to.position)
    expect(shotPose(overview, 0).position).not.toEqual(end.position)
    const distance = (p: number[]) => Math.hypot(p[0] - overview.to.target[0], p[2] - overview.to.target[2])
    expect(distance(shotPose(overview, 0).position)).toBeCloseTo(distance(end.position)) // same distance all the way round
  })

  it('shots start and stop gently, and hold their end', () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(0.5)).toBe(0.5)
    const shot = roomShots('kitchen', ROOMS.kitchen)[1]
    expect(shotPose(shot, 99)).toEqual(shotPose(shot, shot.duration))
  })

  it('a tour of every room visits each room once, in order, three shots each', () => {
    const shots = tourShots(ROOM_IDS.map((room) => ({ room, info: ROOMS[room] })))
    expect(shots).toHaveLength(ROOM_IDS.length * 3)
    expect([...new Set(shots.map((s) => s.room))]).toEqual(ROOM_IDS)
    expect(shots.every((s) => s.duration === SHOT_SECONDS)).toBe(true)
  })

  it('follows a resized room', () => {
    const big = resolveRoom('living', { ...defaultLayout('living'), width: 10, depth: 9 })
    const eye = roomShots('living', big)[2]
    expect(inside(big, eye.from.position)).toBe(true)
    expect(Math.abs(eye.to.target[0])).toBeGreaterThan(Math.abs(roomShots('living', ROOMS.living)[2].to.target[0]))
  })

  it('the turntable circles the room once at a steady speed', () => {
    const shot = turntableShot('bedroom', ROOMS.bedroom)
    expect(shot.duration).toBe(TURNTABLE_SECONDS)
    const start = shotPose(shot, 0).position
    const end = shotPose(shot, shot.duration).position
    start.forEach((v, i) => expect(end[i]).toBeCloseTo(v))
    // Halfway round, the camera is on the opposite side of the room.
    const half = shotPose(shot, shot.duration / 2).position
    const [tx, , tz] = shot.from.target
    expect((half[0] - tx) * (start[0] - tx) + (half[2] - tz) * (start[2] - tz)).toBeLessThan(0)
  })
})

describe('video recording format', () => {
  it('prefers MP4, falls back to WebM, and reports when the browser can do neither', () => {
    expect(chooseVideoFormat(() => true)).toBe(VIDEO_FORMATS[0])
    expect(chooseVideoFormat((t) => t.startsWith('video/webm'))).toBe('video/webm;codecs=vp9')
    expect(chooseVideoFormat(() => false)).toBeNull()
    expect(videoExtension('video/mp4;codecs=avc1')).toBe('mp4')
    expect(videoExtension('video/webm')).toBe('webm')
  })
})

describe('ambient sound', () => {
  it('has birds and outdoor air by day, crickets at night, room tone always', () => {
    const noon = ambienceMix(12.5)
    const night = ambienceMix(23)
    expect(noon.birds).toBeGreaterThan(0.3)
    expect(noon.crickets).toBe(0)
    expect(night.crickets).toBeGreaterThan(0.9)
    expect(night.birds).toBe(0)
    expect(noon.air).toBeGreaterThan(night.air)
    expect(noon.room).toBe(night.room)
  })

  it('birds sing more around sunrise and sunset than at midday', () => {
    expect(ambienceMix(7.5).birds).toBeGreaterThan(ambienceMix(13).birds)
  })
})

/** A box of the given size at a position. */
const box = (w: number, h: number, d: number, at: [number, number, number]) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial())
  mesh.position.set(...at)
  return mesh
}

describe('AR models', () => {
  it('stand on the floor, centred, with helpers and lights left out', () => {
    const piece = new THREE.Group()
    piece.position.set(2, 0, -1)
    piece.rotation.y = 1
    piece.add(box(1, 0.8, 0.5, [0, 0.4, 0]))
    const helper = new THREE.Group()
    helper.userData.noExport = true
    helper.add(box(3, 0.01, 3, [0, 0, 0]))
    piece.add(helper, new THREE.PointLight())
    const model = prepareForExport(piece)
    const bounds = new THREE.Box3().setFromObject(model)
    expect(bounds.min.y).toBeCloseTo(0)
    expect((bounds.min.x + bounds.max.x) / 2).toBeCloseTo(0)
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(1) // the helper's 3 m plane is gone
    let lights = 0
    model.traverse((o) => (lights += (o as THREE.Light).isLight ? 1 : 0))
    expect(lights).toBe(0)
    expect(isHelper(helper)).toBe(true)
  })

  it('the room model is 1:20 and the original is left untouched', () => {
    const room = new THREE.Group()
    room.add(box(7, 2.8, 6, [0, 1.4, 0]))
    const model = prepareForExport(room, ROOM_MODEL_SCALE)
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
    expect(size.x).toBeCloseTo(0.35)
    expect(size.y).toBeCloseTo(0.14)
    expect(room.scale.x).toBe(1)
  })

  it('exports a USDZ file (a zip) for iPhone and iPad, including instanced meshes', async () => {
    const group = new THREE.Group()
    group.add(box(1, 1, 1, [0, 0.5, 0]))
    const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 2, 0.03), new THREE.MeshStandardMaterial(), 3)
    for (let i = 0; i < 3; i++) slats.setMatrixAt(i, new THREE.Matrix4().makeTranslation(i * 0.1, 1, 0))
    group.add(slats)
    const blob = await exportUsdz(prepareForExport(group))
    const head = new Uint8Array(await blob.arrayBuffer()).slice(0, 2)
    expect(String.fromCharCode(...head)).toBe('PK')
    expect(blob.size).toBeGreaterThan(1000)
  })
})
