import { parseHouseDesign, type HouseDesign } from './design'

/**
 * Share links: the whole house (every room) packed into the link itself, after
 * `#design=`. The design is turned into JSON, compressed (deflate) and written in
 * URL-safe base64. Nothing is uploaded anywhere: the part after `#` never leaves
 * the browser, so whoever opens the link unpacks the design on their own computer.
 */

const HASH_KEY = 'design'
/** Unpacked designs larger than this are refused (a real house is ~10–20 KB). */
const MAX_JSON_BYTES = 1_000_000

/** Packs a house into the text used in a share link. */
export async function encodeShare(house: HouseDesign): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ v: 5, rooms: house }))
  const packed = await readAll(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw')))
  return toBase64Url(packed)
}

/** Unpacks the text from a share link. Null if it's damaged or not a design. */
export async function decodeShare(code: string): Promise<HouseDesign | null> {
  try {
    const packed = fromBase64Url(code)
    const json = await readAll(new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw')), MAX_JSON_BYTES)
    return parseHouseDesign(JSON.parse(new TextDecoder().decode(json)))
  } catch {
    return null
  }
}

/** A full link to this page that opens `house`. */
export async function shareUrl(house: HouseDesign, location: Pick<Location, 'origin' | 'pathname'> = window.location): Promise<string> {
  return `${location.origin}${location.pathname}#${HASH_KEY}=${await encodeShare(house)}`
}

/** The packed design in a page's `#…` part, if there is one. */
export function shareCodeFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const code = params.get(HASH_KEY)
  return code && /^[\w-]+$/.test(code) ? code : null
}

/** Reads a stream to the end, giving up past `limit` bytes. */
async function readAll(stream: ReadableStream<Uint8Array>, limit = Infinity): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.length
    if (length > limit) {
      await reader.cancel()
      throw new Error('Design too large')
    }
    chunks.push(value)
  }
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
