import { describe, expect, it } from 'vitest'
import { decodeShare, encodeShare, shareCodeFromHash, shareUrl } from './share'
import { DEFAULT_HOUSE } from './design'

describe('share links', () => {
  it('packs and unpacks the whole house unchanged', async () => {
    const house = { ...DEFAULT_HOUSE, living: { ...DEFAULT_HOUSE.living, items: DEFAULT_HOUSE.living.items.slice(1) } }
    expect(await decodeShare(await encodeShare(house))).toEqual(house)
  })

  it('uses only URL-safe characters and stays short', async () => {
    const code = await encodeShare(DEFAULT_HOUSE)
    expect(code).toMatch(/^[\w-]+$/)
    expect(code.length).toBeLessThan(8000)
  })

  it('builds a link whose #design part reads back', async () => {
    const url = await shareUrl(DEFAULT_HOUSE, { origin: 'https://example.test', pathname: '/app/' })
    expect(url.startsWith('https://example.test/app/#design=')).toBe(true)
    const code = shareCodeFromHash(new URL(url).hash)
    expect(code).not.toBeNull()
    expect(await decodeShare(code!)).toEqual(DEFAULT_HOUSE)
  })

  it('returns null for damaged links instead of throwing', async () => {
    expect(await decodeShare('not-a-design')).toBeNull()
    expect(await decodeShare('')).toBeNull()
    const code = await encodeShare(DEFAULT_HOUSE)
    expect(await decodeShare(code.slice(0, code.length / 2))).toBeNull()
  })

  it('ignores page hashes without a design', () => {
    expect(shareCodeFromHash('')).toBeNull()
    expect(shareCodeFromHash('#other=1')).toBeNull()
    expect(shareCodeFromHash('#design=bad code!')).toBeNull()
  })
})
