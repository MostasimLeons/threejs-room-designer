import { useEffect, useRef } from 'react'
import { ROOMS, type RoomId } from '../scene/house'
import { SHOT_SECONDS, TURNTABLE_SECONDS } from '../scene/tour'
import { chooseVideoFormat, videoExtension } from '../utils/video'

export type VideoMode = 'turntable' | 'room' | 'house'

interface RecordDialogProps {
  open: boolean
  room: RoomId
  roomCount: number
  onRecord: (mode: VideoMode) => void
  onClose: () => void
}

/** Pick what to record: a turntable of this room, a tour of this room, or a tour of every room. */
export function RecordDialog({ open, room, roomCount, onRecord, onClose }: RecordDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const type = typeof MediaRecorder === 'undefined' ? null : chooseVideoFormat((t) => MediaRecorder.isTypeSupported(t))
  const label = ROOMS[room].label
  const options: { mode: VideoMode; title: string; detail: string }[] = [
    { mode: 'turntable', title: 'Turntable', detail: `One slow circle around the ${label}, ${TURNTABLE_SECONDS} seconds` },
    { mode: 'room', title: `Tour of the ${label}`, detail: `Three camera moves, ${3 * SHOT_SECONDS} seconds` },
    {
      mode: 'house',
      title: 'Tour of every room',
      detail: `All ${roomCount} rooms, about ${Math.round(((roomCount * 3 * SHOT_SECONDS + roomCount) / 60) * 10) / 10} minutes`,
    },
  ]

  return (
    <dialog ref={dialogRef} className="designs-dialog record-dialog" onClose={onClose} aria-labelledby="record-title">
      <div className="dialog-header">
        <h2 id="record-title">Record a video</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {type ? (
        <>
          <div className="option-list">
            {options.map((o) => (
              <button key={o.mode} className="option-button" onClick={() => onRecord(o.mode)}>
                {o.title}
                <span className="item-detail">{o.detail}</span>
              </button>
            ))}
          </div>
          <p className="muted small">
            The 3D view is recorded as it plays (with sound, if it's on) and saved as a {videoExtension(type).toUpperCase()} file. Keep this
            tab in front while it records: browsers pause drawing in background tabs.
          </p>
        </>
      ) : (
        <p className="muted">This browser can't record video. Try a recent Chrome, Edge, Firefox or Safari.</p>
      )}
    </dialog>
  )
}
