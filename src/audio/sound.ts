import { Ambience } from './ambience'

/**
 * The one ambient sound player for the app, made the first time sound is switched
 * on (browsers only allow audio after a click). Shared so the video recorder can
 * include the sound.
 */
let player: Ambience | null = null
let on = false

export async function soundOn(volume: number, time: number) {
  player ??= new Ambience()
  player.setVolume(volume)
  player.setTime(time)
  on = true
  await player.play()
}

export function soundOff() {
  on = false
  player?.pause()
}

export const isSoundOn = () => on

export function setSoundVolume(volume: number) {
  player?.setVolume(volume)
}

/** Follow the time of day of the room on screen. */
export function setSoundTime(time: number) {
  player?.setTime(time)
}

/** A short dip while the view fades to another room. */
export function soundDip() {
  if (on) player?.dip()
}

/** The sound as a stream for a video recording, or null when it's off. */
export const soundStream = (): MediaStream | null => (on && player ? player.stream : null)
