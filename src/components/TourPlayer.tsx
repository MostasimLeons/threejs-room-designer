import { ROOMS, type RoomInfo } from '../scene/house'
import type { TourShot } from '../scene/tour'

const SHOT_NAMES: Record<string, string> = {
  overview: 'Overview',
  corner: 'From the corner',
  eye: 'At eye level',
}

interface TourPlayerProps {
  shot: TourShot
  /** Position in the tour (0-based) and how many shots it has. */
  index: number
  count: number
  /** The room of this shot as laid out, for the caption. */
  info: RoomInfo
  /** How many pieces of furniture the room has. */
  pieces: number
  paused: boolean
  onTogglePause: () => void
  onPrevious: () => void
  onNext: () => void
  onStop: () => void
  /** A video is recording this tour: the controls are locked and "End" cancels it. */
  recording?: boolean
}

/** Caption and controls for the guided tour: room name and size, play/pause, previous/next, stop. */
export function TourPlayer({
  shot,
  index,
  count,
  info,
  pieces,
  paused,
  onTogglePause,
  onPrevious,
  onNext,
  onStop,
  recording,
}: TourPlayerProps) {
  const area = Math.round(info.width * info.depth * 10) / 10
  return (
    <div className="tour-player" role="region" aria-label="Guided tour">
      <div className="tour-caption" aria-live="polite">
        <strong>
          {recording && <span className="rec-dot" aria-label="Recording" />}
          {ROOMS[shot.room].label}
        </strong>
        <span>
          {info.width} × {info.depth} m · {area} m² · {pieces} pieces · {SHOT_NAMES[shot.kind] ?? shot.kind}
        </span>
      </div>
      <div className="tour-progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / count) * 100}%` }} />
      </div>
      <div className="tour-controls">
        <button className="icon-button" onClick={onPrevious} disabled={index === 0 || recording} aria-label="Previous shot">
          ‹
        </button>
        <button className="primary-button" onClick={onTogglePause} disabled={recording} aria-label={paused ? 'Play tour' : 'Pause tour'}>
          {paused ? 'Play' : 'Pause'}
        </button>
        <button className="icon-button" onClick={onNext} disabled={recording} aria-label="Next shot">
          ›
        </button>
        <span className="tour-count">
          {index + 1} / {count}
        </span>
        <button className="ghost-button" onClick={onStop}>
          {recording ? 'Cancel recording' : 'End tour'}
        </button>
      </div>
    </div>
  )
}
