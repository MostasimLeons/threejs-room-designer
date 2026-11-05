import { useEffect, useRef, useState } from 'react'
import type { HouseDesign } from '../state/design'
import { listCount, listTotal, shoppingCsv, shoppingList } from '../state/shoppingList'
import { formatPrice } from '../scene/furniture/products'
import { ROOM_IDS, ROOMS, type RoomId } from '../scene/house'
import { downloadBlob } from '../utils/download'

interface ShoppingListDialogProps {
  open: boolean
  house: HouseDesign
  /** The room on screen: the list starts with just this room. */
  room: RoomId
  onClose: () => void
}

/**
 * Shopping list / quote: every piece in this room (or the whole house), identical
 * pieces combined, with example prices and a total. Download it as a CSV file for a
 * spreadsheet, or print it (the browser's print window can also save a PDF).
 */
export function ShoppingListDialog({ open, house, room, onClose }: ShoppingListDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [scope, setScope] = useState<'room' | 'house'>('room')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setScope('room')
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const rooms: RoomId[] = scope === 'room' ? [room] : ROOM_IDS
  const lines = open ? shoppingList(house, rooms) : []
  const title = scope === 'room' ? ROOMS[room].label : 'Whole house'

  function downloadCsv() {
    const name = `Shopping list - ${title}.csv`
    // The byte-order mark makes Excel read the file as UTF-8 (for "×" and "Ø").
    downloadBlob(new Blob(['﻿', shoppingCsv(lines)], { type: 'text/csv;charset=utf-8' }), name)
  }

  return (
    <dialog ref={dialogRef} className="designs-dialog shopping-dialog" onClose={onClose} aria-labelledby="shopping-title">
      <div className="dialog-header">
        <h2 id="shopping-title">Shopping list · {title}</h2>
        <button className="icon-button no-print" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="segmented no-print" role="group" aria-label="Which rooms">
        <button className={scope === 'room' ? 'active' : ''} aria-pressed={scope === 'room'} onClick={() => setScope('room')}>
          This room
        </button>
        <button className={scope === 'house' ? 'active' : ''} aria-pressed={scope === 'house'} onClick={() => setScope('house')}>
          Whole house
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="muted">No furniture here yet. Add some with + Add in the Objects list.</p>
      ) : (
        <div className="shopping-table-wrap">
          <table className="shopping-table">
            <thead>
              <tr>
                {scope === 'house' && <th>Room</th>}
                <th>Item</th>
                <th>Colour · finish</th>
                <th>Size</th>
                <th className="num">Qty</th>
                <th className="num">Price</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  {scope === 'house' && <td>{line.room}</td>}
                  <td>
                    <strong>{line.item}</strong>
                    <span className="item-detail">{line.option}</span>
                  </td>
                  <td>
                    {line.colour}
                    {line.finish !== 'Standard' && <span className="item-detail">{line.finish}</span>}
                  </td>
                  <td>{line.size}</td>
                  <td className="num">{line.quantity}</td>
                  <td className="num">{formatPrice(line.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={scope === 'house' ? 4 : 3}>Total</td>
                <td className="num">{listCount(lines)}</td>
                <td className="num">
                  <strong>{formatPrice(listTotal(lines))}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="muted small">
        Prices are examples for trying out the quote, not real shop prices. Built-in units (kitchen units, toilet) aren&apos;t included.
      </p>

      <div className="file-row no-print">
        <button className="primary-button" onClick={downloadCsv} disabled={lines.length === 0}>
          Download CSV
        </button>
        <button className="ghost-button" onClick={() => window.print()} disabled={lines.length === 0}>
          Print or save as PDF
        </button>
      </div>
    </dialog>
  )
}
