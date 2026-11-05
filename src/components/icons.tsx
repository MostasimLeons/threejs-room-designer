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

/** Showcase mode: a play/presentation symbol. */
/** Room measurements: a ruler. */
export const RulerIcon = () => (
  <Icon>
    <path d="m4 15 11-11 5 5L9 20Z" />
    <path d="m8 11 1.5 1.5M11 8l1.5 1.5M14 5l1.5 1.5M6.5 13.5 8 15M9.5 10.5 11 12" />
  </Icon>
)

/** Ambient sound: a speaker, with sound waves when on or a cross when muted. */
export const SoundIcon = ({ muted }: { muted: boolean }) => (
  <Icon>
    <path d="M4 9h4l5-4v14l-5-4H4Z" />
    {muted ? <path d="m17 9 5 6M22 9l-5 6" /> : <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" />}
  </Icon>
)

/** Compare: a frame split down the middle. */
export const CompareIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M12 3v18" />
    <path d="m9 10-2 2 2 2M15 10l2 2-2 2" />
  </Icon>
)

/** Record video: a video camera. */
export const VideoIcon = () => (
  <Icon>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3Z" />
  </Icon>
)

/** Shopping list: a list with bullet points. */
export const ListIcon = () => (
  <Icon>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="18" r="1" />
  </Icon>
)

/** Reset view: a frame with a centre point (back to the starting view). */
export const ResetViewIcon = () => (
  <Icon>
    <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
    <circle cx="12" cy="12" r="2.5" />
  </Icon>
)

export const CameraIcon = () => (
  <Icon>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
)

export const ShowcaseIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="m10 8.5 4 2-4 2Z" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
)
