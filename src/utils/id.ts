/**
 * Creates a unique id. `crypto.randomUUID()` only exists on secure pages
 * (https:// or localhost), so opening the app from another device via
 * http://192.168.x.x would otherwise crash when saving. The fallback is
 * unique enough for saved designs.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
