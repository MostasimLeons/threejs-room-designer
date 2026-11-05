import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches crashes in the 3D view (for example when the browser or graphics
 * card doesn't support WebGL) and shows a friendly message instead of a
 * blank page. The rest of the app keeps working.
 *
 * React only supports this as a class component, which is why it looks
 * different from the other components.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D view crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="error-panel" role="alert">
        <p className="empty-title">The 3D view couldn't start</p>
        <p className="muted">
          Your browser or graphics card may not support WebGL, or something went wrong while drawing the room. Your design is still saved.
          Try reloading, or open the app in an up-to-date Chrome, Edge or Firefox.
        </p>
        <p className="muted small">Details: {this.state.error.message}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
