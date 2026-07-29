import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/helpers'

const navItems = [
  { to: '/dashboard',    icon: 'bi-grid-1x2-fill',          label: 'Dashboard'    },
  { to: '/controls',     icon: 'bi-shield-check',            label: 'Controls'     },
  { to: '/frameworks',   icon: 'bi-diagram-3-fill',          label: 'Frameworks'   },
  { to: '/library',      icon: 'bi-journals',                label: 'FW Library'   },
  { to: '/evidence',     icon: 'bi-file-earmark-check',      label: 'Evidence'     },
  { to: '/copilot',      icon: 'bi-chat-dots-fill',          label: 'AI Copilot'   },
  { to: '/compliance',   icon: 'bi-bar-chart-fill',          label: 'Compliance'   },
  { to: '/policies',     icon: 'bi-file-earmark-text-fill',  label: 'Policies'     },
  { to: '/vendors',      icon: 'bi-building-check',          label: 'Vendors'      },
  { to: '/monitoring',   icon: 'bi-activity',                label: 'Monitoring'   },
  { to: '/alerts',       icon: 'bi-bell-fill',               label: 'Alerts'       },
  { to: '/regulatory',   icon: 'bi-newspaper',               label: 'Regulatory'   },
  { to: '/integrations', icon: 'bi-plug-fill',               label: 'Integrations' },
  { to: '/reports',      icon: 'bi-file-earmark-bar-graph',  label: 'Reports'      },
  { to: '/audit',        icon: 'bi-clock-history',           label: 'Audit Logs'   },
  { to: '/ai',           icon: 'bi-robot',                   label: 'AI Insights'  },
  { to: '/settings',     icon: 'bi-gear',                    label: 'Settings'     },
]

/**
 * Fixed sidebar navigation.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

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

          {/* Admin — only visible to ADMIN role users */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `rg-nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-speedometer2" />
              Admin
            </NavLink>
          )}
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
