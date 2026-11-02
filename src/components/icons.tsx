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
