import { useEffect, useRef } from 'react'

interface IntroScreenProps {
  /** "Start designing": go to the editor. */
  onStart: () => void
  /** "Take a tour": go straight into showcase mode. */
  onTour: () => void
}

/**
 * Welcome screen shown on the first visit (and with ?intro in the address). It sits
 * over the app with a blurred view of the room behind it, which also covers the
 * moment the 3D view is getting ready.
 */
export function IntroScreen({ onStart, onTour }: IntroScreenProps) {
  const startRef = useRef<HTMLButtonElement>(null)
  useEffect(() => startRef.current?.focus(), [])

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-card">
        <p className="intro-kicker">Interior design in your browser</p>
        <h1 id="intro-title" className="intro-title">
          Room Designer
        </h1>
        <p className="intro-text">
          Five rooms to furnish and style. Move and turn furniture, paint walls by clicking them, change floors, and watch the light move
          from sunrise to night.
        </p>
        <div className="intro-actions">
          <button ref={startRef} className="primary-button intro-start" onClick={onStart}>
            Start designing
          </button>
          <button className="ghost-button intro-tour" onClick={onTour}>
            Take a tour
          </button>
        </div>
      </div>
    </div>
  )
}
