import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Rendered instead of the broken subtree; `reset` re-attempts the render. */
  fallback: (reset: () => void) => ReactNode
  onError?: (error: unknown) => void
}

interface State {
  failed: boolean
}

/**
 * Catches render/lifecycle errors below it so one broken page can't white-
 * screen the whole app. The playback engine lives outside React entirely, so
 * music keeps playing while the fallback is shown.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Render error caught by boundary', error)
    this.props.onError?.(error)
  }

  reset = () => this.setState({ failed: false })

  render() {
    if (this.state.failed) return this.props.fallback(this.reset)
    return this.props.children
  }
}
