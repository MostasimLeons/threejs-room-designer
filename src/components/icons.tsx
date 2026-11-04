import type { ReactNode } from 'react'

// Small line icons used by the toolbar and the view switch.
// `currentColor` makes them take the text colour of the button they're in.

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

export const UndoIcon = () => (
  <Icon>
    <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
)

export const RedoIcon = () => (
  <Icon>
    <path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </Icon>
)

export const ResetIcon = () => (
  <Icon>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
  </Icon>
)

export const SaveIcon = () => (
  <Icon>
    <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M7 3v5h8V3M7 21v-7h10v7" />
  </Icon>
)

export const CubeIcon = () => (
  <Icon>
    <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 0v9m0 0 8-4.5M12 12l-8-4.5" />
  </Icon>
)

export const PlanIcon = () => (
  <Icon>
    <path d="M4 4h16v16H4zM4 11h7V4M11 20v-5h9" />
  </Icon>
)

// ---------- Room icons (room bar) ----------

export const LivingRoomIcon = () => (
  <Icon>
    <path d="M5 11V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
    <path d="M3 13a1.5 1.5 0 0 1 3 0v1.5h12V13a1.5 1.5 0 0 1 3 0v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    <path d="M6 17.5V19M18 17.5V19" />
  </Icon>
)

export const BedroomIcon = () => (
  <Icon>
    <path d="M3 6v13M3 15h18M21 19v-5.5a2.5 2.5 0 0 0-2.5-2.5H11v4" />
    <path d="M5 15v-2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V15" />
  </Icon>
)

export const DiningRoomIcon = () => (
  <Icon>
    <path d="M8 11h8M10 11v8M14 11v8" />
    <path d="M4 6v13M4 14h3v5M20 6v13M20 14h-3v5" />
  </Icon>
)

export const KitchenIcon = () => (
  <Icon>
    <path d="M5 11h14v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" />
    <path d="M3 11h18M10 8h4M12 8v3" />
    <path d="M9 5c0-1 1-1 1-2M14 5c0-1 1-1 1-2" />
  </Icon>
)

export const BathroomIcon = () => (
  <Icon>
    <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" />
    <path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4v0A2.5 2.5 0 0 1 11 6.5" />
    <path d="M7 19l-1 2M17 19l1 2" />
  </Icon>
)

// ---------- Time of day ----------

export const SunIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)

export const MoonIcon = () => (
  <Icon>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Icon>
)
