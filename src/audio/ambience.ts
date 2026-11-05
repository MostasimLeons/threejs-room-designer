import { sunPosition } from '../scene/sun'

/**
 * Ambient sound (Phase 13), made live in the browser with the Web Audio API, so
 * there's nothing to download:
 * - room tone: a low, soft hum that's always there
 * - outdoor air: filtered noise that slowly drifts, by day
 * - birds: an occasional short chirp, from sunrise to the evening
 * - crickets: a quiet pulsing trill at night
 * How loud each layer is follows the room's time of day (ambienceMix).
 */

export interface AmbienceMix {
  room: number
  air: number
  birds: number
  crickets: number
}

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Loudness of each layer (0–1) at a time of day, from the sun's height. */
export function ambienceMix(time: number): AmbienceMix {
  const elevation = sunPosition(time).elevation // degrees; below 0 = night
  const day = smooth(-4, 10, elevation)
  const night = 1 - smooth(-8, 2, elevation)
  // Birds sing most around sunrise and sunset, less at midday, not at night.
  const lowSun = 1 - smooth(25, 50, elevation)
  return {
    room: 0.6,
    air: 0.25 + 0.55 * day,
    birds: day * (0.35 + 0.65 * lowSun),
    crickets: night,
  }
}

/** A buffer of noise: 'white' (hiss) or 'brown' (deep rumble). Looped as a sound source. */
function noiseBuffer(ctx: AudioContext, kind: 'white' | 'brown', seconds = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    if (kind === 'white') data[i] = white
    else {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }
  return buffer
}

export class Ambience {
  private ctx: AudioContext
  private master: GainNode
  private layers: Record<keyof AmbienceMix, GainNode>
  private destination: MediaStreamAudioDestinationNode
  private mix: AmbienceMix = ambienceMix(12)
  private volume = 0.5
  private timers: number[] = []

  constructor() {
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(this.ctx.destination)
    // A copy of the sound for video recordings.
    this.destination = this.ctx.createMediaStreamDestination()
    this.master.connect(this.destination)
    const gain = () => {
      const g = this.ctx.createGain()
      g.gain.value = 0
      g.connect(this.master)
      return g
    }
    this.layers = { room: gain(), air: gain(), birds: gain(), crickets: gain() }
    this.buildRoomTone()
    this.buildAir()
    this.buildCrickets()
    this.scheduleBird()
  }

  /** The sound as a stream, for recording it into a video. */
  get stream(): MediaStream {
    return this.destination.stream
  }

  /** Starts (or resumes) playing, fading in. Must follow a click (browser rule). */
  async play() {
    await this.ctx.resume()
    this.ramp(this.master.gain, this.volume, 1.2)
    this.applyMix(0.5)
  }

  /** Fades out and pauses. */
  pause() {
    this.ramp(this.master.gain, 0, 0.4)
  }

  setVolume(volume: number) {
    this.volume = volume
    this.ramp(this.master.gain, volume, 0.15)
  }

  /** Follows the room's time of day (a gentle cross-fade). */
  setTime(time: number) {
    this.mix = ambienceMix(time)
    this.applyMix(1.5)
  }

  /** A short dip, as the view fades between rooms. */
  dip() {
    const g = this.master.gain
    const now = this.ctx.currentTime
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(this.volume * 0.35, now + 0.18)
    g.linearRampToValueAtTime(this.volume, now + 0.7)
  }

  /** Stops everything and frees the audio device. */
  close() {
    this.timers.forEach((t) => clearTimeout(t))
    void this.ctx.close()
  }

  private ramp(param: AudioParam, value: number, seconds: number) {
    const now = this.ctx.currentTime
    param.cancelScheduledValues(now)
    param.setValueAtTime(param.value, now)
    param.linearRampToValueAtTime(value, now + seconds)
  }

  private applyMix(seconds: number) {
    // Overall levels per layer, so they sit together at full mix.
    const level: AmbienceMix = { room: 0.35, air: 0.12, birds: 0.18, crickets: 0.05 }
    for (const key of Object.keys(level) as (keyof AmbienceMix)[]) this.ramp(this.layers[key].gain, level[key] * this.mix[key], seconds)
  }

  private loop(buffer: AudioBuffer): AudioBufferSourceNode {
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.start()
    return source
  }

  /** A low, warm hum: deep noise through a low-pass filter. */
  private buildRoomTone() {
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 220
    this.loop(noiseBuffer(this.ctx, 'brown')).connect(filter)
    filter.connect(this.layers.room)
  }

  /** Outdoor air: hiss through a band-pass filter whose loudness drifts slowly (like a breeze). */
  private buildAir() {
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 900
    filter.Q.value = 0.4
    const drift = this.ctx.createGain()
    drift.gain.value = 0.7
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.07
    const depth = this.ctx.createGain()
    depth.gain.value = 0.3
    lfo.connect(depth).connect(drift.gain)
    lfo.start()
    this.loop(noiseBuffer(this.ctx, 'white')).connect(filter).connect(drift).connect(this.layers.air)
  }

  /** Crickets: a high tone switched on and off quickly, in short bursts. */
  private buildCrickets() {
    const tone = this.ctx.createOscillator()
    tone.frequency.value = 4400
    // Gains of 0.5 ± 0.5: the square waves switch the tone fully on and off.
    const chirp = this.ctx.createGain()
    chirp.gain.value = 0.5
    const pulse = this.ctx.createOscillator()
    pulse.type = 'square'
    pulse.frequency.value = 28
    const pulseDepth = this.ctx.createGain()
    pulseDepth.gain.value = 0.5
    pulse.connect(pulseDepth).connect(chirp.gain)
    // Bursts: on for about a third of a second, a couple of times a second.
    const burst = this.ctx.createOscillator()
    burst.type = 'square'
    burst.frequency.value = 1.7
    const burstGain = this.ctx.createGain()
    burstGain.gain.value = 0.5
    const burstDepth = this.ctx.createGain()
    burstDepth.gain.value = 0.5
    burst.connect(burstDepth).connect(burstGain.gain)
    tone.connect(chirp).connect(burstGain).connect(this.layers.crickets)
    tone.start()
    pulse.start()
    burst.start()
  }

  /** One bird call (two or three quick rising whistles), then the next one in 2–7 seconds. */
  private scheduleBird() {
    const delay = 2000 + Math.random() * 5000
    this.timers.push(
      window.setTimeout(() => {
        if (this.ctx.state === 'running') this.bird()
        this.scheduleBird()
      }, delay),
    )
  }

  private bird() {
    const start = this.ctx.currentTime
    const notes = 2 + Math.floor(Math.random() * 2)
    const base = 2600 + Math.random() * 1400
    for (let i = 0; i < notes; i++) {
      const t = start + i * 0.13
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.frequency.setValueAtTime(base, t)
      osc.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.08)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.5, t + 0.015)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
      osc.connect(env).connect(this.layers.birds)
      osc.start(t)
      osc.stop(t + 0.12)
    }
  }
}
