import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/helpers'

const navItems = [
  { to: '/dashboard',   icon: 'bi-grid-1x2-fill',        label: 'Dashboard'   },
  { to: '/controls',    icon: 'bi-shield-check',          label: 'Controls'    },
  { to: '/compliance',  icon: 'bi-bar-chart-fill',        label: 'Compliance'  },
  { to: '/audit',       icon: 'bi-clock-history',         label: 'Audit Logs'  },
  { to: '/ai',          icon: 'bi-robot',                 label: 'AI Insights' },
  { to: '/admin',       icon: 'bi-speedometer2',          label: 'Admin'       },
]

/**
 * Fixed sidebar navigation.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="d-lg-none"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1039,
          }}
        />
      )}

      <aside className={`rg-sidebar ${open ? 'open' : ''}`}>
        {/* Brand */}
        <a className="rg-sidebar-brand" href="/dashboard">
          <div className="brand-icon">
            <i className="bi bi-shield-fill-check" />
          </div>
          <div>
            <div className="brand-name">RegIntel AI</div>
            <div className="brand-tag">Compliance Platform</div>
          </div>
        </a>

        {/* Nav links */}
        <nav className="rg-nav-section">
          <div className="rg-nav-label">Main Menu</div>

          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rg-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <i className={`bi ${icon}`} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="rg-sidebar-footer">
          <div className="rg-user-info">
            <div className="rg-avatar">{initials(user?.email)}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="rg-user-email">{user?.email ?? 'User'}</div>
              <div className="rg-user-role">{user?.role ?? 'member'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'none', border: 'none',
                color: '#8b949e', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
