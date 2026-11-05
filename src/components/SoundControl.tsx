import { useEffect, useState } from 'react'
import { isSoundOn, setSoundTime, setSoundVolume, soundOff, soundOn } from '../audio/sound'
import { loadSoundVolume, saveSoundVolume } from '../state/viewerPrefs'
import { SoundIcon } from './icons'

/**
 * Speaker button next to the clock: ambient sound on or off, with a volume slider
 * while it's on. It follows the time of day of the room on screen. Off when the
 * page opens (browsers only allow sound after a click); the volume is remembered.
 */
export function SoundControl({ time }: { time: number }) {
  const [on, setOn] = useState(isSoundOn)
  const [volume, setVolume] = useState(loadSoundVolume)

  useEffect(() => {
    if (on) setSoundTime(time)
  }, [on, time])

  return (
    <div className={`sound-control ${on ? 'on' : ''}`}>
      <button
        className={`time-toggle ${on ? 'active' : ''}`}
        aria-pressed={on}
        aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
        title={on ? 'Ambient sound: on' : 'Ambient sound: off'}
        onClick={() => {
          if (on) soundOff()
          else void soundOn(volume, time)
          setOn(!on)
        }}
      >
        <SoundIcon muted={!on} />
      </button>
      {on && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          aria-label="Sound volume"
          onChange={(e) => {
            const v = Number(e.target.value)
            setVolume(v)
            setSoundVolume(v)
            saveSoundVolume(v)
          }}
        />
      )}
    </div>
  )
}
