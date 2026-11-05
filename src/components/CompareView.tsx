import { useEffect, useRef, useState } from 'react'
import { downloadBlob } from '../utils/download'

/** Where the "Before" picture comes from. */
export type CompareSource = { kind: 'standard' } | { kind: 'saved'; id: string; name: string } | { kind: 'snapshot' }

export type CompareState =
  { phase: 'choose' } | { phase: 'preparing'; beforeLabel: string } | { phase: 'ready'; before: string; after: string; beforeLabel: string }

interface CompareViewProps {
  state: CompareState
  roomLabel: string
  /** Saved designs to compare with (their version of this room). */
  saves: { id: string; name: string }[]
  /** True when a "Before" picture of this room has been taken with "Use this view as Before". */
  hasSnapshot: boolean
  onChoose: (source: CompareSource) => void
  onTakeSnapshot: () => void
  onClose: () => void
}

/**
 * Before/After comparison over the 3D view (Phase 13): first choose what "Before"
 * is, then drag the divider (or use the arrow keys) to wipe between the two pictures.
 * Both are taken from the same camera position; the 3D view behind is untouched.
 */
export function CompareView({ state, roomLabel, saves, hasSnapshot, onChoose, onTakeSnapshot, onClose }: CompareViewProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [state.phase])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="compare-view" role="dialog" aria-label="Before and after">
      <button ref={closeRef} className="icon-button compare-close" onClick={onClose} aria-label="Close comparison">
        ✕
      </button>
      {state.phase === 'choose' && (
        <div className="compare-choose">
          <h2>Compare with…</h2>
          <p className="muted small">The {roomLabel} as it is now (After) next to:</p>
          <div className="option-list">
            <button className="option-button" onClick={() => onChoose({ kind: 'standard' })}>
              Its starting design
              <span className="item-detail">The furniture, finishes and layout it started with</span>
            </button>
            {saves.map((save) => (
              <button key={save.id} className="option-button" onClick={() => onChoose({ kind: 'saved', ...save })}>
                Saved: {save.name}
                <span className="item-detail">The {roomLabel} in that saved design</span>
              </button>
            ))}
            {hasSnapshot && (
              <button className="option-button" onClick={() => onChoose({ kind: 'snapshot' })}>
                Your Before picture
                <span className="item-detail">Taken earlier; keep the same camera view for a clean wipe</span>
              </button>
            )}
          </div>
          <p className="muted small">
            Or keep how it looks right now to compare with later:{' '}
            <button className="text-button" onClick={onTakeSnapshot}>
              Use this view as Before
            </button>
          </p>
        </div>
      )}
      {state.phase === 'preparing' && (
        <div className="compare-preparing" role="status">
          Preparing the comparison…
        </div>
      )}
      {state.phase === 'ready' && <Wipe before={state.before} after={state.after} beforeLabel={state.beforeLabel} roomLabel={roomLabel} />}
    </div>
  )
}

/** The two pictures on top of each other, with a divider you drag to wipe between them. */
function Wipe({ before, after, beforeLabel, roomLabel }: { before: string; after: string; beforeLabel: string; roomLabel: string }) {
  const [split, setSplit] = useState(50)
  const frame = useRef<HTMLDivElement>(null)
  const dragTo = (clientX: number) => {
    const box = frame.current?.getBoundingClientRect()
    if (box) setSplit(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)))
  }
  return (
    <div className="compare-ready">
      <div
        ref={frame}
        className="compare-frame"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragTo(e.clientX)
        }}
        onPointerMove={(e) => {
          if (e.buttons) dragTo(e.clientX)
        }}
      >
        <img src={after} alt={`${roomLabel} now`} draggable={false} />
        <img src={before} alt={`${roomLabel}: ${beforeLabel}`} draggable={false} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
        <span className="compare-divider" style={{ left: `${split}%` }} aria-hidden="true" />
        <span className="compare-tag before">Before · {beforeLabel}</span>
        <span className="compare-tag after">After · now</span>
      </div>
      <div className="compare-tools">
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Before and after divider"
        />
        <button className="ghost-button" onClick={() => void downloadSideBySide(before, after, beforeLabel, roomLabel)}>
          Download side by side
        </button>
      </div>
    </div>
  )
}

/** Loads a picture (a data URL) so it can be drawn on a canvas. */
function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = src
  })
}

/** Both pictures next to each other with labels, as one PNG. */
async function downloadSideBySide(before: string, after: string, beforeLabel: string, roomLabel: string) {
  const [a, b] = await Promise.all([load(before), load(after)])
  const gap = 24
  const label = 64
  const canvas = document.createElement('canvas')
  canvas.width = a.width + b.width + gap
  canvas.height = Math.max(a.height, b.height) + label
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(a, 0, label)
  ctx.drawImage(b, a.width + gap, label)
  ctx.fillStyle = '#24221f'
  ctx.font = '600 32px Inter, "Segoe UI", system-ui, sans-serif'
  ctx.fillText(`Before · ${beforeLabel}`, 8, 44)
  ctx.fillText('After · now', a.width + gap + 8, 44)
  canvas.toBlob((blob) => blob && downloadBlob(blob, `${roomLabel} before and after.png`), 'image/png')
}
