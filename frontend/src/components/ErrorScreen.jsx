import { Link } from 'react-router-dom'

/**
 * Full-page error screen for 403, 500, and offline states.
 * Shown inside the app layout for API-level failures.
 *
 * @param {{ type?: '403'|'500'|'offline', message?: string }} props
 */
export default function ErrorScreen({ type = '500', message }) {
  const screens = {
    403: {
      icon:   'bi-shield-lock-fill',
      color:  '#d29922',
      title:  'Access Denied',
      detail: message || "You don't have permission to view this page. Contact your admin if you think this is a mistake.",
      action: { label: 'Back to Dashboard', to: '/dashboard' },
    },
    500: {
      icon:   'bi-exclamation-octagon-fill',
      color:  '#f85149',
      title:  'Server Error',
      detail: message || 'Something went wrong on our end. Our team has been notified. Please try again.',
      action: { label: 'Retry', reload: true },
    },
    offline: {
      icon:   'bi-wifi-off',
      color:  '#8b949e',
      title:  'No Connection',
      detail: "Can't reach the server. Check your internet connection and try again.",
      action: { label: 'Try again', reload: true },
    },
  }

  const s = screens[type] ?? screens[500]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ fontSize: '3rem', color: s.color, marginBottom: '1rem' }}>
        <i className={`bi ${s.icon}`} />
      </div>
      <h3 style={{ color: '#e6edf3', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.2rem' }}>
        {s.title}
      </h3>
      <p style={{
        color: '#8b949e', fontSize: '0.87rem', marginBottom: '1.5rem',
        maxWidth: '380px', lineHeight: 1.6,
      }}>
        {s.detail}
      </p>

      {s.action.reload ? (
        <button
          className="btn rg-btn-primary btn-sm"
          onClick={() => window.location.reload()}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          {s.action.label}
        </button>
      ) : (
        <Link to={s.action.to} className="btn rg-btn-primary btn-sm">
          <i className="bi bi-house me-2" />
          {s.action.label}
        </Link>
      )}
    </div>
  )
}
