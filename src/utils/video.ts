/**
 * Recording the 3D view as a video file (Phase 13), with the browser's own
 * MediaRecorder: it records the canvas as it's drawn (effects included) plus,
 * if given, the ambient sound.
 */

/** Formats to try, best first: MP4 (plays everywhere) where the browser can make it, otherwise WebM. */
export const VIDEO_FORMATS = [
  'video/mp4;codecs=avc1.640028',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const

/** The first format this browser can record, or null if it can't record video at all. */
export function chooseVideoFormat(isSupported: (type: string) => boolean): string | null {
  return VIDEO_FORMATS.find((type) => isSupported(type)) ?? null
}

/** File extension for a recorded format. */
export const videoExtension = (type: string) => (type.startsWith('video/mp4') ? 'mp4' : 'webm')

export interface Recording {
  /** The format being recorded. */
  type: string
  /** Stops recording and returns the video file. */
  stop: () => Promise<Blob>
  /** Stops and throws the recording away. */
  cancel: () => void
}

/** Starts recording a canvas (and an optional audio stream). Null if this browser can't record. */
export function startRecording(canvas: HTMLCanvasElement, audio?: MediaStream | null, fps = 30): Recording | null {
  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') return null
  const type = chooseVideoFormat((t) => MediaRecorder.isTypeSupported(t))
  if (!type) return null
  const stream = canvas.captureStream(fps)
  for (const track of audio?.getAudioTracks() ?? []) stream.addTrack(track)
  // About 12 Mbit/s: sharp at 1080p without huge files (a 12-second turntable is about 18 MB).
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 12_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  recorder.start(1000)
  const end = () => stream.getVideoTracks().forEach((track) => track.stop())
  return {
    type,
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          end()
          resolve(new Blob(chunks, { type: type.split(';')[0] }))
        }
        recorder.stop()
      }),
    cancel: () => {
      recorder.onstop = end
      if (recorder.state !== 'inactive') recorder.stop()
    },
  }
}
