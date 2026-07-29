import { Component } from 'react'

/**
 * ErrorBoundary — catches unexpected React render/lifecycle errors
 * and shows a graceful fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload() {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#f85149' }}>
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <h2 style={{ color: '#e6edf3', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.3rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#8b949e', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            An unexpected error occurred. This has been noted. Try
            reloading the page — your data is safe.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <summary style={{ fontSize: '0.78rem', color: '#4f8ef7', cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error details
              </summary>
              <pre style={{
                fontSize: '0.72rem', color: '#f85149',
                background: '#161b22', padding: '0.75rem',
                borderRadius: '8px', overflowX: 'auto',
                border: '1px solid #30363d',
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            className="btn rg-btn-primary"
            onClick={this.handleReload}
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
