import { compassName, DAY_END, DAY_START, formatTime, sunPosition, TIME_PRESETS, type RoomLighting } from '../scene/sun'
import type { LightingChanges } from '../state/useDesignHistory'
import { MoonIcon, SunIcon } from './icons'

interface TimeOfDayPanelProps {
  roomLabel: string
  lighting: RoomLighting
  /** Apply and record one undo step (preset buttons). */
  onUpdate: (changes: LightingChanges) => void
  /** Apply live while a slider moves; `onCommit` records it when you let go. */
  onPreview: (changes: LightingChanges) => void
  onCommit: () => void
  onClose: () => void
}

/** A short plain-language description of the light right now. */
function describe({ time, orientation }: RoomLighting): string {
  const { elevation, azimuth } = sunPosition(time)
  if (elevation < -6) return 'Night · room lights on'
  if (elevation < 0) return 'Twilight · room lights coming on'
  // Is the sun on the window side of the room? (within 90° of where the windows face)
  const offset = Math.abs(((((azimuth - orientation) % 360) + 540) % 360) - 180)
  const where = offset < 80 ? 'shining in through the windows' : 'on the other side of the house'
  if (elevation < 10) return `Low ${compassName(azimuth)} sun, ${where}`
  return `Sun in the ${compassName(azimuth)}, ${Math.round(elevation)}° high, ${where}`
}

/** Makes a slider record ONE undo step when you let go. */
const commitHandlers = (onCommit: () => void) => ({ onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit })

/**
 * Glass panel above the room bar: the clock, quick time presets, a time slider
 * (5 AM – 9 PM) and the room's orientation. Each room keeps its own settings,
 * and every change can be undone like any other edit.
 */
export function TimeOfDayPanel({ roomLabel, lighting, onUpdate, onPreview, onCommit, onClose }: TimeOfDayPanelProps) {
  const night = sunPosition(lighting.time).elevation < 0
  return (
    <section className="time-panel" aria-label={`Time of day, ${roomLabel}`}>
      <div className="time-head">
        <span className="time-icon" aria-hidden="true">
          {night ? <MoonIcon /> : <SunIcon />}
        </span>
        <div>
          <p className="time-clock">{formatTime(lighting.time)}</p>
          <p className="time-desc">{describe(lighting)}</p>
        </div>
        <button className="icon-button time-close" onClick={onClose} aria-label="Close time of day">
          ✕
        </button>
      </div>

      <div className="time-presets" role="group" aria-label="Time presets">
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={Math.abs(preset.time - lighting.time) < 0.01 ? 'active' : ''}
            aria-pressed={Math.abs(preset.time - lighting.time) < 0.01}
            onClick={() => onUpdate({ time: preset.time })}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="time-field">
        <span>Time of day</span>
        <input
          className="time-slider"
          type="range"
          min={DAY_START}
          max={DAY_END}
          step={1 / 12}
          value={lighting.time}
          onChange={(e) => onPreview({ time: Number(e.target.value) })}
          aria-valuetext={formatTime(lighting.time)}
          {...commitHandlers(onCommit)}
        />
      </label>
      <div className="time-scale" aria-hidden="true">
        <span>5 AM</span>
        <span>9 AM</span>
        <span>1 PM</span>
        <span>5 PM</span>
        <span>9 PM</span>
      </div>

      <label className="time-field">
        <span>
          Room orientation · windows face <strong>{compassName(lighting.orientation)}</strong> ({lighting.orientation}°)
        </span>
        <input
          type="range"
          min={0}
          max={355}
          step={5}
          value={lighting.orientation}
          onChange={(e) => onPreview({ orientation: Number(e.target.value) })}
          aria-valuetext={`Windows face ${compassName(lighting.orientation)}, ${lighting.orientation} degrees`}
          {...commitHandlers(onCommit)}
        />
      </label>
      <div className="time-scale" aria-hidden="true">
        <span>N</span>
        <span>E</span>
        <span>S</span>
        <span>W</span>
        <span>N</span>
      </div>
    </section>
  )
}
