import { useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'
import { canQuickLook, canWebXrAr } from '../scene/arExport'

/** The exporters, loaded the first time a file is needed. */
const files = () => import('../scene/arFiles')
import { startWebXrAr } from '../ar/webxrViewer'
import { downloadBlob } from '../utils/download'

interface ArDialogProps {
  /** The model to show (from ArSource), or null while it's being prepared. */
  model: THREE.Group | null
  /** "Sofa", or "Living Room (1:20 model)". */
  title: string
  /** File name without extension. */
  fileName: string
  onClose: () => void
  onCopyShareLink: () => void
}

/**
 * View in AR: on an iPhone or iPad it opens AR Quick Look; on an Android phone with
 * AR support, a WebXR view where you tap to place it. Anywhere, the model can be
 * downloaded (.glb for most 3D apps, .usdz for Apple devices).
 * Phones only allow AR on a secure (https) site.
 */
export function ArDialog({ model, title, fileName, onClose, onCopyShareLink }: ArDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [webXr, setWebXr] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [inAr, setInAr] = useState(false)
  const session = useRef<XRSession | null>(null)
  const quickLook = canQuickLook()

  useEffect(() => {
    dialogRef.current?.showModal()
    let alive = true
    void canWebXrAr().then((ok) => alive && setWebXr(ok))
    return () => {
      alive = false
    }
  }, [])

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label)
    try {
      await task()
    } finally {
      setBusy(null)
    }
  }

  async function quickLookOpen() {
    if (!model) return
    const url = URL.createObjectURL(await (await files()).exportUsdz(model.clone(true)))
    // AR Quick Look opens from a link marked rel="ar" that contains an image.
    const link = document.createElement('a')
    link.rel = 'ar'
    link.href = url
    link.appendChild(document.createElement('img'))
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function webXrOpen() {
    if (!model || !overlayRef.current) return
    setInAr(true)
    try {
      session.current = await startWebXrAr(model.clone(true), overlayRef.current, () => {
        session.current = null
        setInAr(false)
      })
    } catch {
      setInAr(false)
    }
  }

  const ready = Boolean(model)
  const canAr = quickLook || webXr
  return (
    <dialog ref={dialogRef} className="designs-dialog ar-dialog" onClose={onClose} aria-labelledby="ar-title">
      <div className="dialog-header">
        <h2 id="ar-title">View in AR · {title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {!ready && <p className="muted">Preparing the model…</p>}
      {ready && canAr && (
        <button
          className="primary-button ar-open"
          disabled={busy !== null}
          onClick={() => void run('Opening…', quickLook ? quickLookOpen : webXrOpen)}
        >
          {busy ?? 'View in your room'}
        </button>
      )}
      {ready && !canAr && (
        <p className="muted small">
          AR works on an iPhone or iPad (Safari) and on Android phones with AR support (Chrome), on a secure (https) website. To try it,
          open this design on your phone:{' '}
          <button className="text-button" onClick={onCopyShareLink}>
            copy a share link
          </button>
          .
        </p>
      )}
      <h3>Download the model</h3>
      <div className="file-row">
        <button
          className="ghost-button"
          disabled={!ready || busy !== null}
          onClick={() => void run('Exporting…', async () => downloadBlob(await (await files()).exportGlb(model!), `${fileName}.glb`))}
        >
          .glb (most 3D apps)
        </button>
        <button
          className="ghost-button"
          disabled={!ready || busy !== null}
          onClick={() =>
            void run('Exporting…', async () => downloadBlob(await (await files()).exportUsdz(model!.clone(true)), `${fileName}.usdz`))
          }
        >
          .usdz (Apple)
        </button>
      </div>
      {busy && <p className="muted small">{busy}</p>}
      {/* Shown over the camera view during an Android AR session (WebXR "DOM overlay"). */}
      <div ref={overlayRef} className="ar-overlay" hidden={!inAr}>
        <p>Point at the floor, then tap to place it. Tap again to move it.</p>
        <button className="primary-button" onClick={() => void session.current?.end()}>
          Close AR
        </button>
      </div>
    </dialog>
  )
}
