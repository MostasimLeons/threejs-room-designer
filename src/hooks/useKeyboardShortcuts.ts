import { useEffect, useRef } from 'react'
import type { FurnitureItem } from '../scene/furniture/catalog'
import type { ItemChanges } from '../state/useDesignHistory'

interface ShortcutActions {
  selectedItem: FurnitureItem | null
  undo: () => void
  redo: () => void
  deselect: () => void
  /** Change the selected item and record an undo step. */
  updateItem: (id: string, changes: ItemChanges) => void
  /** Change the selected item live; `commit` records it later. */
  previewItem: (id: string, changes: ItemChanges) => void
  commit: () => void
  /** Switch to the room at this position in the room bar (0 = first). */
  selectRoom: (index: number) => void
  /** Delete / duplicate the selected piece. */
  removeSelected: () => void
  duplicateSelected: () => void
}

const NUDGE = 0.05 // metres per arrow-key press
const NUDGE_FAST = 0.25 // with Shift held

/** Arrow key → direction on the floor [x, z]. "Up" moves toward the back wall. */
const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
}

/**
 * Global keyboard shortcuts:
 * Ctrl+Z / Ctrl+Y undo/redo · Esc deselect · R / Shift+R rotate · arrows move (Shift = faster)
 * · 1–5 switch room · Delete/Backspace remove · Ctrl+D duplicate.
 *
 * The listener is added once. It reads the latest values through a ref, so it
 * doesn't need to be removed and re-added on every render.
 */
export function useKeyboardShortcuts(actions: ShortcutActions) {
  const latest = useRef(actions)
  latest.current = actions

  useEffect(() => {
    // Arrow keys currently held down for a nudge. The move stays one undo step
    // until ALL of them are released, e.g. holding ↓ while tapping ←.
    const heldArrows = new Set<string>()

    function finishNudge() {
      heldArrows.clear()
      latest.current.commit()
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      // Typing in a text box (or the Designs window) should never trigger shortcuts.
      if (inInput && (target as HTMLInputElement).type !== 'range') return
      if (document.querySelector('dialog[open]')) return

      const { selectedItem, undo, redo, deselect, updateItem, previewItem, selectRoom, removeSelected, duplicateSelected } = latest.current
      const ctrl = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (ctrl && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (ctrl && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault()
        redo()
      } else if ((key === 'delete' || key === 'backspace') && selectedItem && !inInput) {
        event.preventDefault() // Backspace must not navigate back
        removeSelected()
      } else if (ctrl && key === 'd' && selectedItem) {
        event.preventDefault() // not the browser's bookmark shortcut
        duplicateSelected()
      } else if (/^[1-9]$/.test(event.key) && !ctrl && !event.altKey && !inInput) {
        selectRoom(Number(event.key) - 1)
      } else if (key === 'escape') {
        deselect()
      } else if (key === 'r' && !ctrl && selectedItem) {
        updateItem(selectedItem.id, { rotation: selectedItem.rotation + (event.shiftKey ? -45 : 45) })
      } else if (event.key in ARROWS && !ctrl && selectedItem && !inInput) {
        // Sliders use the arrow keys themselves, hence `!inInput`.
        event.preventDefault() // don't scroll the page
        const [dx, dz] = ARROWS[event.key]
        const step = event.shiftKey ? NUDGE_FAST : NUDGE
        const [x, z] = selectedItem.position
        // Live change while keys are held; releasing the last one = one undo step.
        previewItem(selectedItem.id, { position: [x + dx * step, z + dz * step] })
        heldArrows.add(event.key)
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (!heldArrows.delete(event.key)) return // not an arrow we were nudging with
      if (heldArrows.size === 0) finishNudge()
    }

    // Switching windows (Alt+Tab) while holding an arrow means the browser never
    // sends its keyup, so finish the move here instead of leaving it open.
    function handleBlur() {
      if (heldArrows.size > 0) finishNudge()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])
}
