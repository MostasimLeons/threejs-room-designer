import { useEffect, useMemo, useRef, useState } from 'react'
import { Scene } from './scene/Scene'
import type { ViewMode } from './scene/roomConfig'
import {
  FURNITURE_INFO,
  findOverlaps,
  getVariant,
  isAllowedIn,
  overlapName,
  type FurnitureItem,
  type FurnitureType,
} from './scene/furniture/catalog'
import { findFreeSpot, placeNew } from './scene/furniture/placement'
import { createId } from './utils/id'
import { downloadBlob } from './utils/download'
import { decodeShare, shareCodeFromHash, shareUrl } from './state/share'
import { CatalogDrawer, catalogFor } from './components/CatalogDrawer'
import { CatalogThumbnailRenderer } from './scene/CatalogThumbnailRenderer'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { ViewToggle } from './components/ViewToggle'
import { RoomBar } from './components/RoomBar'
import { TimeOfDayPanel } from './components/TimeOfDayPanel'
import { FloorPopover, WallPopover } from './components/SurfacePopover'
import { FLOOR_SELECTION, selectedWall, wallLabel, wallSelection } from './scene/selection'
import { setAllWalls, setWallFinish, wallFinishOf } from './scene/finishes'
import { MoonIcon, RulerIcon, SunIcon } from './components/icons'
import { daylightAt, formatTime, sunPosition } from './scene/sun'
import { PropertiesPanel } from './components/PropertiesPanel'
import { preloadModels } from './scene/furniture/GltfModel'
import { CameraViewPicker } from './components/CameraViewPicker'
import { TourPlayer } from './components/TourPlayer'
import { tourShots, turntableShot, type TourShot } from './scene/tour'
import { RecordDialog, type VideoMode } from './components/RecordDialog'
import { SoundControl } from './components/SoundControl'
import { ArDialog } from './components/ArDialog'
import type { ArTarget } from './scene/ArSource'
import type * as THREE from 'three'
import { soundDip, soundStream } from './audio/sound'
import { CompareView, type CompareSource, type CompareState } from './components/CompareView'
import { startRecording, videoExtension, type Recording } from './utils/video'
import { IntroScreen } from './components/IntroScreen'
import type { CameraViewId } from './scene/cameraViews'
import {
  loadShowDimensions,
  loadUnit,
  saveShowDimensions,
  saveUnit,
  loadQualitySetting,
  loadThumbnails,
  saveQualitySetting,
  saveThumbnail,
  introSeen,
  markIntroSeen,
} from './state/viewerPrefs'
import { QualityControl } from './components/QualityControl'
import { UnitControl } from './components/UnitControl'
import { UnitContext, type LengthUnit } from './utils/units'
import type { QualityLevel, QualitySetting } from './scene/quality'
import { DesignsDialog } from './components/DesignsDialog'
import { ShoppingListDialog } from './components/ShoppingListDialog'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useHouseHistory } from './state/useDesignHistory'
import { DEFAULT_HOUSE, type HouseDesign, type RoomDesign } from './state/design'
import { listSaves, loadAutosave, writeAutosave } from './state/storage'
import { resolveRoom, ROOM_IDS, ROOMS, type RoomId, type RoomLayout, type WallSide } from './scene/house'
import { defaultLayout, isDefaultLayout, openingSelection, removeOpening, selectedOpening, type OpeningRef } from './scene/layout'

/** Room switch: the view fades out this fast, the room swaps, then it fades back in (see .scene-layer in index.css). */
const FADE_OUT_MS = 180

/** The name of a piece of furniture, for messages. */
const label = (item: FurnitureItem) => FURNITURE_INFO[item.type].label

const pad = (n: number) => String(n).padStart(2, '0')

/** Local date and time for file names, e.g. "2026-11-04 18.42". */
function fileStamp(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())}`
}

/** The help line under the 3D view, for mouse or touch, per view. */
const HINTS = {
  mouse: {
    perspective: 'Click furniture to select · drag it to move · drag empty space to rotate · right-drag to pan · scroll to zoom',
    plan: 'Click furniture to select · drag it to move · drag empty space to pan · scroll to zoom',
  },
  touch: {
    perspective: 'Tap furniture to select · drag it to move · drag the room to turn · pinch to zoom · two fingers to pan',
    plan: 'Tap furniture to select · drag it to move · drag the room to pan · pinch to zoom',
  },
} as const

/** A touch screen is the main input (phones, tablets). */
const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

/** Width ÷ height of the 3D view (showcase mode makes it the full window). */
function viewAspect() {
  return window.innerWidth / Math.max(window.innerHeight - 56, 1)
}

/** A new number for each tour shot shown (restarts the camera move, even for the same shot). */
let shotSeq = 0
const nextShotId = () => ++shotSeq

/** Waits a little (for the 3D view to draw something new). */
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function App() {
  // App state: which camera view is active, and a counter used to reset the camera.
  const [view, setView] = useState<ViewMode>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [designsOpen, setDesignsOpen] = useState(false)
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  // Where a wall or the floor was clicked, so its quick picker appears right there.
  const [pick, setPick] = useState<{ id: string; point: [number, number, number] } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [touch] = useState(isTouch)
  /** The furniture catalog drawer, and its pictures (drawn the first time it opens; kept for this visit only). */
  const [catalogOpen, setCatalogOpen] = useState(false)
  /** 3D quality: the setting (kept in this browser) and the level in use. */
  const [qualitySetting, setQualitySetting] = useState<QualitySetting>(loadQualitySetting)
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('high')
  /** Units for lengths, and whether the room's measurements show in 3D (kept in this browser). */
  const [unit, setUnit] = useState<LengthUnit>(loadUnit)
  const [showDimensions, setShowDimensions] = useState(loadShowDimensions)
  /** A design from a share link, waiting for you to open it (or not). */
  const [shared, setShared] = useState<HouseDesign | null>(null)
  // Read once when the app starts (the address bar is cleared right after).
  const [shareCode] = useState(() => shareCodeFromHash(window.location.hash))
  /** A high-resolution picture in progress (its request id). */
  const [screenshotRequest, setScreenshotRequest] = useState<number | null>(null)
  const [catalogThumbs, setCatalogThumbs] = useState<Partial<Record<FurnitureType, string>>>({})

  // Camera view (Overview / Eye level / Corner). It stays the same when you switch rooms.
  const [cameraViewId, setCameraViewId] = useState<CameraViewId>('overview')
  // Showcase: the editing panels are hidden and nothing can be changed, just looked at.
  const [showcase, setShowcase] = useState(false)
  /** The guided tour, while it plays: its shots, which one is on screen, paused or not. */
  const [tour, setTour] = useState<{ shots: TourShot[]; index: number; paused: boolean; shotId: number } | null>(null)
  /** A video being recorded (it plays tour shots), and the record dialog. */
  const recording = useRef<{ recording: Recording; name: string } | null>(null)
  const [recordingDpr, setRecordingDpr] = useState<number | null>(null)
  const [recordOpen, setRecordOpen] = useState(false)
  /** Before/after comparison: its state, the design drawn instead for a moment, and pictures kept as "Before". */
  const [compare, setCompare] = useState<CompareState | null>(null)
  const [compareDesign, setCompareDesign] = useState<RoomDesign | null>(null)
  const [compareCapture, setCompareCapture] = useState<{ id: number; onCapture: (image: Blob | null) => void } | null>(null)
  const [beforeSnapshots, setBeforeSnapshots] = useState<Partial<Record<RoomId, string>>>({})
  /** View in AR: what's shown, and the model copy once the 3D view has made it. */
  const [ar, setAr] = useState<{ title: string; fileName: string; model: THREE.Group | null } | null>(null)
  const [arRequest, setArRequest] = useState<{ id: number; target: ArTarget } | null>(null)
  // Welcome screen on the first visit, or with ?intro in the address.
  const [introOpen, setIntroOpen] = useState(() => !introSeen() || new URLSearchParams(window.location.search).has('intro'))
  // Small pictures of each room for the room bar, taken when you leave a room.
  const [thumbnails, setThumbnails] = useState(loadThumbnails)
  const [thumbnailRequest, setThumbnailRequest] = useState<{ room: RoomId; id: number } | null>(null)

  // Which room you're editing. `shownRoom` is the one in the 3D view: during the short
  // fade between rooms it still shows the old room, then catches up.
  const [room, setRoom] = useState<RoomId>('living')
  const [shownRoom, setShownRoom] = useState<RoomId>('living')
  const [fading, setFading] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Every room has its own design (furniture + finishes) and its own undo/redo history.
  // They start from the autosave, so reloading the page keeps your work.
  const { house, forRoom, loadHouse } = useHouseHistory(() => loadAutosave() ?? DEFAULT_HOUSE)

  // Everything below (toolbar, panels, shortcuts) works on the selected room's history.
  const history = forRoom(room)
  const { design } = history
  const selectedItem = design.items.find((item) => item.id === selectedId) ?? null
  const wall = selectedWall(selectedId)
  // The room as laid out now (its own size and openings, or the standard ones).
  const info = resolveRoom(room, design.layout)
  const layout = useMemo(() => design.layout ?? defaultLayout(room), [design.layout, room])
  // A selected window or door, while it exists (undo can take it away).
  const openingRef = selectedOpening(selectedId)
  const opening = openingRef && layout.openings[openingRef.side]?.[openingRef.index] ? openingRef : null

  /**
   * A new room size or openings from the layout editor. The standard layout isn't
   * stored (so the design stays as it was). `select` keeps a moved opening selected.
   */
  function handleLayout(next: RoomLayout, transient: boolean, select?: OpeningRef) {
    const stored = isDefaultLayout(room, next) ? undefined : next
    if (transient) history.previewLayout(stored)
    else history.updateLayout(stored)
    if (select) setSelectedId(openingSelection(select))
  }

  function handleDeleteOpening() {
    if (!opening) return
    const name = layout.openings[opening.side]?.[opening.index]?.label ?? 'opening'
    handleLayout(removeOpening(layout, opening), false)
    setSelectedId(null)
    setToast(`Removed ${name.toLowerCase()}. Undo brings it back.`)
  }

  /** Clicked a wall in 3D: select it and show its quick picker there. */
  function handlePickWall(side: WallSide, point: [number, number, number]) {
    history.commit()
    setSelectedId(wallSelection(side))
    setPick({ id: wallSelection(side), point })
  }

  /**
   * Clicked the floor: if something else is selected, the first click just deselects
   * it (as clicking empty space always did); otherwise it selects the floor.
   */
  function handlePickFloor(point: [number, number, number]) {
    if (selectedId !== null && selectedId !== FLOOR_SELECTION) {
      setSelectedId(null)
      return
    }
    setSelectedId(FLOOR_SELECTION)
    setPick({ id: FLOOR_SELECTION, point })
  }

  const closePick = () => setSelectedId(null)
  const popoverContent =
    pick && pick.id === selectedId ? (
      wall ? (
        <WallPopover
          label={wallLabel(wall)}
          finish={wallFinishOf(design.finishes, wall)}
          onChange={(finish) => history.updateFinishes(setWallFinish(design.finishes, wall, finish))}
          onAllWalls={() => history.updateFinishes(setAllWalls(wallFinishOf(design.finishes, wall)))}
          onClose={closePick}
        />
      ) : selectedId === FLOOR_SELECTION ? (
        <FloorPopover floor={design.finishes.floor} onChange={(floor) => history.updateFinishes({ floor })} onClose={closePick} />
      ) : null
    ) : null

  // Which pieces overlap each other. Recalculated only when the furniture changes.
  // Built-in units (kitchen units, toilet) count too.
  const overlaps = useMemo(() => findOverlaps(design.items, info.fixedZones), [design.items, info])
  const shownItems = house[shownRoom].items
  const shownZones = resolveRoom(shownRoom, house[shownRoom].layout).fixedZones
  const shownOverlaps = useMemo(() => findOverlaps(shownItems, shownZones), [shownItems, shownZones])

  useEffect(() => () => clearTimeout(fadeTimer.current), [])

  // Autosave: write every room to browser storage shortly after every change.
  useEffect(() => {
    const timer = setTimeout(() => writeAutosave(house), 400)
    return () => clearTimeout(timer)
  }, [house])

  // Hide the little notification after a few seconds.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  useKeyboardShortcuts({
    selectedItem,
    undo: history.undo,
    redo: history.redo,
    deselect: () => setSelectedId(null),
    updateItem: history.updateItem,
    previewItem: history.previewItem,
    commit: history.commit,
    removeSelected: handleDelete,
    duplicateSelected: handleDuplicate,
    selectRoom: (index) => {
      const next = ROOM_IDS[index]
      if (next) handleRoomChange(next)
    },
  })

  // Opened from a share link? Unpack it and offer it; your own design stays until you accept.
  useEffect(() => {
    if (!shareCode) return
    // Take the design out of the address bar, so a reload doesn't offer it again.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    let cancelled = false
    decodeShare(shareCode).then((sharedHouse) => {
      if (cancelled) return
      if (sharedHouse) setShared(sharedHouse)
      else setToast("That share link is damaged or out of date, so it couldn't be opened.")
    })
    return () => {
      cancelled = true
    }
  }, [shareCode])

  function handleLoad(loaded: HouseDesign, name: string) {
    loadHouse(loaded)
    setSelectedId(null)
    setDesignsOpen(false)
    setToast(`Loaded "${name}" (all rooms). Undo goes back one room at a time.`)
  }

  function handleReset() {
    history.reset()
    setSelectedId(null)
    setToast(`${ROOMS[room].label} reset to its starting design. Press Undo to go back.`)
  }

  function handleRoomChange(next: RoomId) {
    if (next === room) return
    history.commit() // finish any drag/slide in the room you're leaving
    setSelectedId(null)
    setRoom(next)
    soundDip()
    // Picture of the room you're leaving, for the room bar (taken on the next frame,
    // before the view swaps to the new room).
    setThumbnailRequest({ room: shownRoom, id: Date.now() })

    clearTimeout(fadeTimer.current)
    if (prefersReducedMotion()) {
      // No fade, but still wait a moment so the thumbnail is of the old room.
      fadeTimer.current = setTimeout(() => setShownRoom(next), 60)
      return
    }
    // Fade out, swap the room while the view is hidden, then fade back in.
    setFading(true)
    fadeTimer.current = setTimeout(() => {
      setShownRoom(next)
      setFading(false)
    }, FADE_OUT_MS)
  }

  function handleDelete() {
    if (!selectedItem) return
    history.removeItem(selectedItem.id)
    setSelectedId(null)
    setToast(`Removed ${label(selectedItem).toLowerCase()}. Undo brings it back.`)
  }

  function handleDuplicate() {
    if (!selectedItem) return
    const copy: FurnitureItem = { ...selectedItem, id: createId() }
    const near: [number, number] = [selectedItem.position[0] + 0.3, selectedItem.position[1] + 0.3]
    copy.position = findFreeSpot(copy, design.items, info, info.fixedZones, near)
    history.addItem(copy)
    setSelectedId(copy.id)
  }

  /** Adds a new piece (from the catalog) at a free spot near the middle of the room, and selects it. */
  function handleAdd(type: FurnitureType) {
    const product = FURNITURE_INFO[type]
    const item: FurnitureItem = {
      id: createId(),
      type,
      variant: product.variants[0].id,
      position: [0, 0],
      rotation: 0,
      color: product.swatches[0].color,
    }
    // The default option, or the first that has room (e.g. a round table in a busy kitchen).
    const placed = placeNew(
      item,
      product.variants.map((v) => v.id),
      design.items,
      info,
      info.fixedZones,
    )
    item.variant = placed.variant
    item.position = placed.position
    item.rotation = placed.rotation
    history.addItem(item)
    setSelectedId(item.id)
    const option = item.variant === product.variants[0].id ? '' : ` (${getVariant(type, item.variant).label.toLowerCase()}, to fit)`
    setToast(`Added ${product.label.toLowerCase()}${option}. Drag it into place.`)
  }

  /**
   * Moves the selected piece to another room where it belongs: removed here, added
   * there at a free spot. That's one undo step in each room.
   */
  function handleMoveTo(target: RoomId) {
    if (!selectedItem || !isAllowedIn(selectedItem.type, target)) return
    const targetHistory = forRoom(target)
    const moved: FurnitureItem = { ...selectedItem, id: createId() }
    const targetInfo = resolveRoom(target, targetHistory.design.layout)
    moved.position = findFreeSpot(moved, targetHistory.design.items, targetInfo, targetInfo.fixedZones)
    history.removeItem(selectedItem.id)
    targetHistory.addItem(moved)
    setSelectedId(null)
    setToast(`Moved ${label(selectedItem).toLowerCase()} to the ${ROOMS[target].label}. Undo in each room to reverse.`)
  }

  /** Save image: deselect first (no outline or guides in the picture), then capture. */
  function handleSaveImage() {
    setSelectedId(null)
    setPick(null)
    setScreenshotRequest(Date.now())
  }

  function handleScreenshot(image: Blob | null) {
    setScreenshotRequest(null)
    if (!image) {
      setToast("Couldn't make the picture. Try a smaller window.")
      return
    }
    downloadBlob(image, `${ROOMS[room].label} ${fileStamp(new Date())}.png`)
    setToast(`Saved a picture of the ${ROOMS[room].label}.`)
  }

  function handleThumbnail(thumbRoom: RoomId, url: string) {
    setThumbnails((current) => ({ ...current, [thumbRoom]: url }))
    saveThumbnail(thumbRoom, url)
  }

  // Start downloading the real 3D models in the background (1.6 MB in total), so
  // switching rooms finds them ready. Code-built models show until they arrive.
  useEffect(() => {
    const timer = setTimeout(preloadModels, 1200)
    return () => clearTimeout(timer)
  }, [])

  // A first picture of the room you start in, once it has had a moment to draw.
  useEffect(() => {
    const timer = setTimeout(() => setThumbnailRequest({ room: 'living', id: Date.now() }), 2000)
    return () => clearTimeout(timer)
  }, [])

  function enterShowcase() {
    history.commit()
    setSelectedId(null)
    setTimeOpen(false)
    setView('perspective')
    setShowcase(true)
  }

  /**
   * Starts the guided tour in showcase mode: every room (starting with this one), or
   * just this room. Three slow camera moves per room (tour.ts).
   */
  function startTour(scope: 'house' | 'room', turntable = false) {
    enterShowcase()
    const shots = turntable ? [turntableShot(room, info, viewAspect())] : tourShotsFor(scope)
    setTour({ shots, index: 0, paused: false, shotId: nextShotId() })
  }

  function tourShotsFor(scope: 'house' | 'room') {
    const start = ROOM_IDS.indexOf(room)
    const rooms = scope === 'room' ? [room] : [...ROOM_IDS.slice(start), ...ROOM_IDS.slice(0, start)]
    return tourShots(
      rooms.map((r) => ({ room: r, info: resolveRoom(r, house[r].layout) })),
      viewAspect(),
    )
  }

  /**
   * Records a video: plays a turntable or a tour in showcase mode and records the 3D
   * view (about 1080p, quality fixed) until it ends, then downloads the file.
   */
  function startVideo(mode: VideoMode) {
    setRecordOpen(false)
    startTour(mode === 'house' ? 'house' : 'room', mode === 'turntable')
    // Hold the first shot while the panels close and the view resizes to its recording size.
    setTour((t) => (t ? { ...t, paused: true } : t))
    setRecordingDpr(Math.min(2, Math.max(1, 1920 / window.innerWidth)))
    const name = `${mode === 'house' ? 'Room Designer tour' : ROOMS[room].label + (mode === 'turntable' ? ' turntable' : ' tour')} ${fileStamp(new Date())}`
    setTimeout(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('.viewport canvas')
      const started = canvas ? startRecording(canvas, soundStream()) : null
      if (!started) {
        setRecordingDpr(null)
        setToast("This browser can't record video.")
        return
      }
      recording.current = { recording: started, name }
      setTour((t) => (t ? { ...t, paused: false, shotId: nextShotId() } : t))
    }, 600)
  }

  /** Opens View in AR for the selected piece, or the whole room when nothing is selected. */
  function openAr() {
    const target: ArTarget = selectedItem ? { kind: 'piece', itemId: selectedItem.id } : { kind: 'room' }
    const title = selectedItem ? label(selectedItem) : `${ROOMS[room].label} (1:20 model)`
    setAr({ title, fileName: selectedItem ? label(selectedItem) : `${ROOMS[room].label} model`, model: null })
    setArRequest({ id: nextShotId(), target })
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(await shareUrl(house))
      setToast('Share link copied. Open it on your phone to view in AR.')
    } catch {
      setToast("Couldn't copy the link. Use Save / Load → Copy share link.")
    }
  }

  /** A picture of the 3D view as it is now (for the comparison), as a data URL. */
  function captureView(): Promise<string | null> {
    return new Promise((resolve) => {
      setCompareCapture({
        id: nextShotId(),
        onCapture: (image) => {
          setCompareCapture(null)
          if (!image) return resolve(null)
          const reader = new FileReader()
          reader.addEventListener('load', () => resolve(reader.result as string))
          reader.readAsDataURL(image)
        },
      })
    })
  }

  /**
   * Builds the comparison: a picture of the room now (After), then, for a saved or the
   * starting design, the 3D view briefly draws that design instead (same camera, same
   * time of day) for the Before picture. Your design and its undo history aren't touched.
   */
  async function runCompare(source: CompareSource) {
    const beforeLabel = source.kind === 'standard' ? 'starting design' : source.kind === 'saved' ? source.name : 'your picture'
    setSelectedId(null)
    setPick(null)
    setCompare({ phase: 'preparing', beforeLabel })
    await delay(250) // let the selection outline disappear
    const after = await captureView()
    let before: string | null | undefined
    if (source.kind === 'snapshot') {
      before = beforeSnapshots[room]
    } else {
      const other = source.kind === 'standard' ? DEFAULT_HOUSE[room] : listSaves().find((s) => s.id === source.id)?.design[room]
      if (other) {
        setCompareDesign({ ...other, lighting: design.lighting })
        await delay(1600) // models, textures and shadows of the other design
        before = await captureView()
        setCompareDesign(null)
      }
    }
    if (!after || !before) {
      setCompare(null)
      setToast("Couldn't make the comparison pictures.")
      return
    }
    setCompare({ phase: 'ready', before, after, beforeLabel })
  }

  /** "Use this view as Before": keep a picture of the room as it looks now. */
  async function takeBeforeSnapshot() {
    setSelectedId(null)
    setPick(null)
    setCompare({ phase: 'preparing', beforeLabel: 'your picture' })
    await delay(250)
    const picture = await captureView()
    setCompare(null)
    if (!picture) return setToast("Couldn't take the picture.")
    setBeforeSnapshots((current) => ({ ...current, [room]: picture }))
    setToast(`Kept this view of the ${ROOMS[room].label} as Before. Make your changes, then Compare → Your Before picture.`)
  }

  /** The tour finished: save the video, if one was recording. */
  async function finishVideo() {
    const current = recording.current
    recording.current = null
    setRecordingDpr(null)
    if (!current) return
    const blob = await current.recording.stop()
    downloadBlob(blob, `${current.name}.${videoExtension(current.recording.type)}`)
    setToast(`Saved the video (${(blob.size / 1e6).toFixed(1)} MB).`)
  }

  /** Stopped before the end: throw the recording away. */
  function cancelVideo() {
    if (!recording.current) return
    recording.current.recording.cancel()
    recording.current = null
    setRecordingDpr(null)
    setToast('Recording cancelled.')
  }

  /** Shows shot `index` of the tour (switching room if needed), or ends the tour past the last one. */
  function goToShot(index: number) {
    if (!tour) return
    if (index >= tour.shots.length) {
      setTour(null)
      if (recording.current) void finishVideo()
      else setToast('End of the tour. Esc leaves showcase.')
      return
    }
    const next = Math.max(0, index)
    if (tour.shots[next].room !== room) handleRoomChange(tour.shots[next].room)
    setTour({ ...tour, index: next, shotId: nextShotId() })
  }

  /** Leaves showcase mode (Esc or the button), which also ends the tour. */
  function exitShowcase() {
    setShowcase(false)
    setTour(null)
    cancelVideo()
  }

  // Esc leaves showcase mode.
  useEffect(() => {
    if (!showcase) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitShowcase()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showcase])

  function closeIntro(withTour: boolean) {
    markIntroSeen()
    setIntroOpen(false)
    if (withTour) startTour('house')
  }

  const overlapping = selectedItem ? (overlaps.get(selectedItem.id) ?? []).map((id) => overlapName(id, design.items)) : []

  return (
    <UnitContext.Provider value={unit}>
      <div className={`app ${showcase ? 'showcase' : ''}`}>
        <header className="topbar">
          <div className="brand">
            <span className="logo" aria-hidden="true" />
            <span className="brand-name">Room Designer</span>
            <span className="divider" />
            <span className="project-name">My House</span>
          </div>
          <Toolbar
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={history.undo}
            onRedo={history.redo}
            onReset={handleReset}
            onResetView={() => {
              setCameraViewId('overview')
              setResetKey((k) => k + 1)
            }}
            onOpenDesigns={() => setDesignsOpen(true)}
            onShowcase={enterShowcase}
            onSaveImage={handleSaveImage}
            savingImage={screenshotRequest !== null}
            onShoppingList={() => setShoppingOpen(true)}
            onRecordVideo={() => setRecordOpen(true)}
            onCompare={() => setCompare({ phase: 'choose' })}
          />
        </header>

        <div className="workspace">
          <Sidebar
            room={room}
            items={design.items}
            finishes={design.finishes}
            selectedId={selectedId}
            overlaps={overlaps}
            onSelect={setSelectedId}
            onShowRoom={() => setSelectedId(null)}
            lighting={design.lighting}
            onShowLighting={() => setTimeOpen(true)}
            info={info}
            onSelectOpening={(ref) => setSelectedId(openingSelection(ref))}
            onAddFurniture={() => {
              setCatalogOpen(true)
              // On phones the panels are below the 3D view: bring the view (and the catalog in it) on screen.
              document.querySelector('.viewport')?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
            }}
            footer={
              <>
                <UnitControl
                  unit={unit}
                  onChange={(next) => {
                    setUnit(next)
                    saveUnit(next)
                  }}
                />
                <QualityControl
                  setting={qualitySetting}
                  level={qualityLevel}
                  onChange={(setting) => {
                    setQualitySetting(setting)
                    saveQualitySetting(setting)
                  }}
                />
              </>
            }
          />

          {/* Background follows the time of day, so the room-switch fade dips to the same tone as the 3D backdrop. */}
          <main className="viewport" style={{ background: daylightAt(house[shownRoom].lighting).background }}>
            <div className={`scene-layer ${fading ? 'fading' : ''}`}>
              <ErrorBoundary>
                <Scene
                  view={view}
                  resetKey={resetKey}
                  room={shownRoom}
                  design={compareDesign && shownRoom === room ? compareDesign : house[shownRoom]}
                  selectedId={shownRoom === room ? selectedId : null}
                  overlaps={shownOverlaps}
                  onSelect={setSelectedId}
                  onMove={(id, position) => history.previewItem(id, { position })}
                  onRotate={(id, rotation) => history.previewItem(id, { rotation })}
                  onDragBoundary={history.commit}
                  onPickWall={handlePickWall}
                  onPickFloor={handlePickFloor}
                  onPickOpening={(ref) => {
                    history.commit()
                    setPick(null)
                    setSelectedId(openingSelection(ref))
                  }}
                  popover={
                    !showcase && popoverContent && pick && shownRoom === room ? { point: pick.point, content: popoverContent } : null
                  }
                  cameraViewId={cameraViewId}
                  editable={!showcase}
                  thumbnailRequest={thumbnailRequest}
                  onThumbnail={handleThumbnail}
                  screenshotRequest={screenshotRequest}
                  onScreenshot={handleScreenshot}
                  compareCapture={compareCapture}
                  arRequest={arRequest}
                  onArModel={(model) => setAr((current) => (current ? { ...current, model } : current))}
                  qualitySetting={qualitySetting}
                  onQualityLevel={setQualityLevel}
                  recordingDpr={recordingDpr}
                  unit={unit}
                  showDimensions={showDimensions}
                  tour={
                    tour
                      ? {
                          shot: tour.shots[tour.index],
                          shotId: tour.shotId,
                          paused: tour.paused,
                          onEnd: () => goToShot(tour.index + 1),
                        }
                      : null
                  }
                />
              </ErrorBoundary>
            </div>

            <div className="overlay-top">
              {!showcase && <ViewToggle view={view} onChange={setView} />}
              {view === 'perspective' && !tour && <CameraViewPicker room={room} value={cameraViewId} onChange={setCameraViewId} />}
              <button
                className={`time-toggle ${timeOpen ? 'active' : ''}`}
                aria-pressed={timeOpen}
                aria-label={`Time of day: ${formatTime(design.lighting.time)}`}
                onClick={() => setTimeOpen((open) => !open)}
              >
                {sunPosition(design.lighting.time).elevation < 0 ? <MoonIcon /> : <SunIcon />}
                {formatTime(design.lighting.time)}
              </button>
              <SoundControl time={house[shownRoom].lighting.time} />
              {!showcase && (
                <button
                  className={`time-toggle ${showDimensions ? 'active' : ''}`}
                  aria-pressed={showDimensions}
                  title={showDimensions ? 'Hide the room measurements' : 'Show the room measurements'}
                  aria-label="Room measurements"
                  onClick={() => {
                    setShowDimensions(!showDimensions)
                    saveShowDimensions(!showDimensions)
                  }}
                >
                  <RulerIcon />
                </button>
              )}
              {showcase && !tour && (
                <>
                  <button className="showcase-exit" onClick={() => setCompare({ phase: 'choose' })}>
                    Compare
                  </button>
                  <button className="showcase-exit" onClick={() => startTour('house')}>
                    Tour all rooms
                  </button>
                  <button className="showcase-exit" onClick={() => startTour('room')}>
                    Tour this room
                  </button>
                </>
              )}
              {showcase && (
                <button className="showcase-exit" onClick={exitShowcase}>
                  Exit showcase <kbd>Esc</kbd>
                </button>
              )}
            </div>

            {timeOpen && (
              <TimeOfDayPanel
                roomLabel={ROOMS[room].label}
                lighting={design.lighting}
                onUpdate={history.updateLighting}
                onPreview={history.previewLighting}
                onCommit={history.commit}
                onClose={() => setTimeOpen(false)}
              />
            )}

            <p className="hint" hidden={timeOpen || showcase}>
              {HINTS[touch ? 'touch' : 'mouse'][view]}
            </p>

            {catalogOpen && !showcase && (
              <CatalogDrawer
                room={room}
                thumbnails={catalogThumbs}
                onAdd={(type) => {
                  handleAdd(type)
                  setCatalogOpen(false)
                }}
                onClose={() => setCatalogOpen(false)}
              />
            )}

            {shared && (
              <div className="share-banner" role="dialog" aria-label="Shared design">
                <span>Someone shared a design with you.</span>
                <button
                  className="primary-button"
                  onClick={() => {
                    handleLoad(shared, 'shared design')
                    setShared(null)
                  }}
                >
                  Open it
                </button>
                <button className="ghost-button" onClick={() => setShared(null)}>
                  Keep mine
                </button>
              </div>
            )}

            {compare && (
              <CompareView
                state={compare}
                roomLabel={ROOMS[room].label}
                saves={compare.phase === 'choose' ? listSaves().map(({ id, name }) => ({ id, name })) : []}
                hasSnapshot={Boolean(beforeSnapshots[room])}
                onChoose={(source) => void runCompare(source)}
                onTakeSnapshot={() => void takeBeforeSnapshot()}
                onClose={() => {
                  if (compare.phase !== 'preparing') setCompare(null)
                }}
              />
            )}

            {tour && (
              <TourPlayer
                shot={tour.shots[tour.index]}
                index={tour.index}
                count={tour.shots.length}
                info={resolveRoom(tour.shots[tour.index].room, house[tour.shots[tour.index].room].layout)}
                pieces={house[tour.shots[tour.index].room].items.length}
                paused={tour.paused}
                onTogglePause={() => setTour((t) => (t ? { ...t, paused: !t.paused } : t))}
                onPrevious={() => goToShot(tour.index - 1)}
                onNext={() => goToShot(tour.index + 1)}
                onStop={() => {
                  setTour(null)
                  cancelVideo()
                }}
                recording={recordingDpr !== null}
              />
            )}

            {toast && (
              <div className="toast" role="status">
                {toast}
              </div>
            )}

            <RoomBar room={room} onChange={handleRoomChange} thumbnails={thumbnails} />
          </main>

          <PropertiesPanel
            room={room}
            item={selectedItem}
            wall={wall}
            finishes={design.finishes}
            overlapping={overlapping}
            onUpdate={(changes) => selectedItem && history.updateItem(selectedItem.id, changes)}
            onPreview={(changes) => selectedItem && history.previewItem(selectedItem.id, changes)}
            onUpdateFinishes={history.updateFinishes}
            onPreviewFinishes={history.previewFinishes}
            onCommit={history.commit}
            onDeselect={() => setSelectedId(null)}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            moveTargets={selectedItem ? ROOM_IDS.filter((id) => id !== room && isAllowedIn(selectedItem.type, id)) : []}
            onMoveTo={handleMoveTo}
            info={info}
            layout={layout}
            layoutStandard={!design.layout}
            opening={opening}
            onUpdateLayout={(next, select) => handleLayout(next, false, select)}
            onPreviewLayout={(next, select) => handleLayout(next, true, select)}
            onResetLayout={() => {
              history.updateLayout(undefined)
              setToast(`${ROOMS[room].label} is back to its standard size, windows and doors. Undo to go back.`)
            }}
            onSelectOpening={(ref) => setSelectedId(openingSelection(ref))}
            onDeleteOpening={handleDeleteOpening}
            onMessage={setToast}
            onViewInAr={openAr}
          />
        </div>

        {catalogOpen && (
          <CatalogThumbnailRenderer
            types={catalogFor(room).filter((type) => !catalogThumbs[type])}
            onThumbnail={(type, url) => setCatalogThumbs((current) => ({ ...current, [type]: url }))}
          />
        )}

        {introOpen && <IntroScreen onStart={() => closeIntro(false)} onTour={() => closeIntro(true)} />}

        {ar && (
          <ArDialog
            model={ar.model}
            title={ar.title}
            fileName={ar.fileName}
            onClose={() => setAr(null)}
            onCopyShareLink={() => void copyShareLink()}
          />
        )}
        <RecordDialog
          open={recordOpen}
          room={room}
          roomCount={ROOM_IDS.length}
          onRecord={startVideo}
          onClose={() => setRecordOpen(false)}
        />
        <ShoppingListDialog open={shoppingOpen} house={house} room={room} onClose={() => setShoppingOpen(false)} />
        <DesignsDialog open={designsOpen} design={house} onClose={() => setDesignsOpen(false)} onLoad={handleLoad} />
      </div>
    </UnitContext.Provider>
  )
}
