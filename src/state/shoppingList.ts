import { FURNITURE_INFO, getVariant, type FurnitureItem } from '../scene/furniture/catalog'
import { FRAME_FINISHES } from '../scene/furniture/frames'
import { productPrice, productSize } from '../scene/furniture/products'
import { ROOMS, type RoomId } from '../scene/house'
import type { HouseDesign } from './design'

/**
 * The shopping list (quote): every piece of furniture in the chosen rooms, with
 * identical pieces (same item, option, colour and finish, in the same room)
 * combined into one line with a quantity. Built-in parts of a room (windows,
 * doors, kitchen units, the toilet) aren't furniture items, so they never appear.
 */
export interface ShoppingLine {
  room: string
  item: string
  option: string
  colour: string
  finish: string
  size: string
  quantity: number
  /** Example price of one, in dollars (products.ts). */
  unitPrice: number
  total: number
}

/** A swatch's name, or the colour code for a custom colour. */
function colourName(item: FurnitureItem): string {
  const swatch = FURNITURE_INFO[item.type].swatches.find((s) => s.color.toLowerCase() === item.color.toLowerCase())
  return swatch?.name ?? `Custom ${item.color.toUpperCase()}`
}

export function shoppingList(house: HouseDesign, rooms: RoomId[]): ShoppingLine[] {
  const lines: ShoppingLine[] = []
  for (const room of rooms) {
    const byKey = new Map<string, ShoppingLine>()
    for (const item of house[room].items) {
      const key = [item.type, getVariant(item.type, item.variant).id, item.color.toLowerCase(), item.frame ?? '', item.size?.join('x') ?? ''].join('|')
      const existing = byKey.get(key)
      if (existing) {
        existing.quantity += 1
        existing.total = existing.quantity * existing.unitPrice
        continue
      }
      const unitPrice = productPrice(item.type, item.variant)
      const line: ShoppingLine = {
        room: ROOMS[room].label,
        item: FURNITURE_INFO[item.type].label,
        option: getVariant(item.type, item.variant).label + (item.size ? ', custom size' : ''),
        colour: colourName(item),
        finish: item.frame ? FRAME_FINISHES[item.frame].name : 'Standard',
        size: productSize(item),
        quantity: 1,
        unitPrice,
        total: unitPrice,
      }
      byKey.set(key, line)
      lines.push(line)
    }
  }
  return lines
}

export const listTotal = (lines: ShoppingLine[]) => lines.reduce((sum, line) => sum + line.total, 0)
export const listCount = (lines: ShoppingLine[]) => lines.reduce((sum, line) => sum + line.quantity, 0)

/**
 * One CSV cell: quoted when needed. A cell that starts with = + - @ is prefixed
 * with ' so spreadsheet apps show it as text instead of running it as a formula.
 */
function csvCell(value: string | number): string {
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** The list as CSV (opens in Excel, Numbers, Google Sheets), with a total line. */
export function shoppingCsv(lines: ShoppingLine[]): string {
  const header = ['Room', 'Item', 'Option', 'Colour', 'Legs/frame', 'Size', 'Quantity', 'Example unit price (USD)', 'Example total (USD)']
  const rows = lines.map((l) => [l.room, l.item, l.option, l.colour, l.finish, l.size, l.quantity, l.unitPrice, l.total])
  rows.push(['', 'Total', '', '', '', '', listCount(lines), '', listTotal(lines)])
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
