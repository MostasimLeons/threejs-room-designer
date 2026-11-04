import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { HouseDesign } from '../state/design'
import { deleteSave, exportDesign, importDesign, listSaves, saveDesign, type SavedDesign } from '../state/storage'

interface DesignsDialogProps {
  open: boolean
  /** Every room: saving and exporting always include the whole house. */
  design: HouseDesign
  onClose: () => void
  /** Called with a house to restore (from a save or an imported file). */
  onLoad: (design: HouseDesign, name: string) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date)
}

/** Save, restore, export and import room designs. */
export function DesignsDialog({ open, design, onClose, onLoad }: DesignsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [saves, setSaves] = useState<SavedDesign[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  // <dialog> is opened/closed with methods, so sync it with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setSaves(listSaves())
      setMessage(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleSave(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const overwriting = saves.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    if (overwriting && !window.confirm(`Replace the saved design "${trimmed}"?`)) return
    const next = saveDesign(trimmed, design)
    if (next) {
      setSaves(next)
      setName('')
      setMessage({ text: `Saved "${trimmed}".` })
    } else {
      setMessage({ text: 'Could not save. Browser storage may be full or blocked.', error: true })
    }
  }

  function handleDelete(save: SavedDesign) {
    if (!window.confirm(`Delete the saved design "${save.name}"? This cannot be undone.`)) return
    setSaves(deleteSave(save.id))
    setMessage({ text: `Deleted "${save.name}".` })
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const imported = await importDesign(file)
      onLoad(imported, file.name.replace(/\.json$/i, ''))
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Could not read that file.', error: true })
    } finally {
      if (fileRef.current) fileRef.current.value = '' // allow choosing the same file again
    }
  }

  return (
    <dialog ref={dialogRef} className="designs-dialog" onClose={onClose} aria-labelledby="designs-title">
      <div className="dialog-header">
        <h2 id="designs-title">Designs</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <form className="save-row" onSubmit={handleSave}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this design, e.g. Cosy corner"
          maxLength={60}
          aria-label="Design name"
        />
        <button className="primary-button" type="submit" disabled={!name.trim()}>
          Save
        </button>
      </form>

      {message && (
        <p className={`dialog-message ${message.error ? 'error' : ''}`} role="status">
          {message.text}
        </p>
      )}

      <h3>Saved in this browser</h3>
      {saves.length === 0 ? (
        <p className="muted">No saved designs yet. Your current room is also kept automatically when you reload.</p>
      ) : (
        <ul className="save-list">
          {saves.map((save) => (
            <li key={save.id}>
              <div>
                <span className="item-name">{save.name}</span>
                <span className="item-detail">
                  {formatDate(save.savedAt)} · {save.design.living.items.length + save.design.bedroom.items.length} items in 2 rooms
                </span>
              </div>
              <button className="ghost-button" onClick={() => onLoad(save.design, save.name)}>
                Load
              </button>
              <button className="ghost-button danger" onClick={() => handleDelete(save)} aria-label={`Delete ${save.name}`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3>File</h3>
      <p className="muted small">
        Saves and files include all rooms. Export a .json file to back up or share a design, and import it on any computer.
      </p>
      <div className="file-row">
        <button className="ghost-button" onClick={() => exportDesign(design, name.trim() || 'room-design')}>
          Export file
        </button>
        <button className="ghost-button" onClick={() => fileRef.current?.click()}>
          Import file…
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => handleImport(e.target.files?.[0])} />
      </div>
    </dialog>
  )
}
