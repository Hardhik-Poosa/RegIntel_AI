import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/controls':   'Controls Management',
  '/compliance': 'Compliance Analytics',
  '/audit':      'Audit Logs',
  '/ai':         'AI Insights',
}

/**
 * Top navigation bar — shows page title and mobile menu toggle.
 * @param {{ onMenuClick: () => void }} props
 */
export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'RegIntel AI'

  return (
    <header className="rg-topnav">
      {/* Mobile hamburger */}
      <button
        className="btn btn-sm d-lg-none me-2"
        onClick={onMenuClick}
        style={{ color: '#8b949e', border: '1px solid #30363d', borderRadius: '8px' }}
      >
        <i className="bi bi-list" style={{ fontSize: '1.1rem' }} />
      </button>

      <h1 className="rg-page-title">{title}</h1>

      {/* Right-side actions */}
      <div className="d-flex align-items-center gap-2">
        <span
          style={{
            fontSize: '0.72rem',
            background: 'rgba(79,142,247,0.12)',
            color: '#4f8ef7',
            border: '1px solid rgba(79,142,247,0.25)',
            borderRadius: '6px',
            padding: '0.2rem 0.6rem',
            fontWeight: 600,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.45rem', verticalAlign: 'middle' }} />
          Live
        </span>
      </div>
    </header>
  )
}
