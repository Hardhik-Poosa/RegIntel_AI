import { useState, useEffect, useCallback } from 'react'
import { alertsAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

const SEVERITY_STYLES = {
  CRITICAL: { badge: 'danger',    icon: 'bi-exclamation-octagon-fill', ring: '#dc354540' },
  HIGH:     { badge: 'danger',    icon: 'bi-exclamation-triangle-fill', ring: '#dc354530' },
  MEDIUM:   { badge: 'warning',   icon: 'bi-exclamation-circle-fill',  ring: '#fd7e1420' },
  LOW:      { badge: 'secondary', icon: 'bi-info-circle-fill',         ring: '#6c757d15' },
}

export default function Alerts() {
  const [alerts, setAlerts]   = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')  // all | unacked
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const unacked = filter === 'unacked'
      const [aRes, sRes] = await Promise.all([alertsAPI.list(unacked), alertsAPI.summary()])
      setAlerts(aRes.data)
      setSummary(sRes.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function acknowledge(id) {
    try { await alertsAPI.acknowledge(id); await load() }
    catch (err) { setError(getErrorMessage(err)) }
  }

  async function acknowledgeAll() {
    try { await alertsAPI.acknowledgeAll(); await load() }
    catch (err) { setError(getErrorMessage(err)) }
  }

  async function deleteAlert(id) {
    if (!window.confirm('Delete this alert?')) return
    try { await alertsAPI.delete(id); await load() }
    catch (err) { setError(getErrorMessage(err)) }
  }

  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const unreadCount = summary?.unacknowledged ?? 0

  return (
    <div className="container-fluid px-4 py-4">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 position-relative"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#dc3545,#fd7e14)', color: '#fff', fontSize: 22 }}
          >
            <i className="bi bi-bell-fill" />
            {unreadCount > 0 && (
              <span
                className="badge bg-white text-danger rounded-pill position-absolute"
                style={{ top: -6, right: -6, fontSize: '0.65rem', lineHeight: 1.4, padding: '2px 5px' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Compliance Alerts</h4>
            <p className="mb-0 text-muted small">
              {unreadCount > 0 ? `${unreadCount} unacknowledged alert${unreadCount > 1 ? 's' : ''}` : 'All alerts acknowledged'}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button className={`btn btn-outline-secondary ${filter === 'all'    ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`btn btn-outline-secondary ${filter === 'unacked' ? 'active' : ''}`} onClick={() => setFilter('unacked')}>Unread</button>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-outline-success" onClick={acknowledgeAll}>
              <i className="bi bi-check-all me-1" /> Acknowledge All
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* ── Summary Bar ──────────────────────────────────── */}
      {summary && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total',           value: summary.total,           color: '#4361ee', icon: 'bi-bell' },
            { label: 'Unacknowledged',  value: summary.unacknowledged,  color: '#dc3545', icon: 'bi-bell-fill' },
            { label: 'Critical',        value: summary.critical,        color: '#6f42c1', icon: 'bi-exclamation-octagon-fill' },
            { label: 'High',            value: summary.high,            color: '#fd7e14', icon: 'bi-exclamation-triangle-fill' },
          ].map(c => (
            <div key={c.label} className="col-6 col-xl-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body d-flex align-items-center gap-3 py-3">
                  <div className="rounded-3 p-2" style={{ background: c.color + '18', color: c.color, fontSize: 20 }}>
                    <i className={`bi ${c.icon}`} />
                  </div>
                  <div>
                    <div className="fs-4 fw-bold">{c.value}</div>
                    <div className="text-muted small">{c.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Alert List ────────────────────────────────────── */}
      <div className="d-flex flex-column gap-3">
        {loading && (
          <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
        )}
        {!loading && alerts.length === 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5 text-muted">
              <i className="bi bi-bell-slash display-4 d-block mb-2 opacity-25" />
              {filter === 'unacked' ? 'No unacknowledged alerts.' : 'No alerts yet. Run compliance checks to generate alerts.'}
            </div>
          </div>
        )}
        {alerts.map(a => {
          const s = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.LOW
          return (
            <div key={a.id} className={`card border-0 shadow-sm ${a.acknowledged ? 'opacity-60' : ''}`}
              style={{ borderLeft: `4px solid var(--bs-${s.badge})` }}>
              <div className="card-body d-flex align-items-start gap-3">
                <div style={{ color: `var(--bs-${s.badge})`, fontSize: 24, marginTop: 2 }}>
                  <i className={`bi ${s.icon}`} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className={`badge bg-${s.badge}`}>{a.severity}</span>
                    {a.category && <span className="badge bg-light text-dark border small">{a.category}</span>}
                    {a.acknowledged && <span className="badge bg-success-subtle text-success border small"><i className="bi bi-check me-1" />Acknowledged</span>}
                  </div>
                  <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>{a.message}</p>
                  <div className="text-muted small">{fmt(a.created_at)}</div>
                </div>
                <div className="d-flex gap-1">
                  {!a.acknowledged && (
                    <button className="btn btn-sm btn-outline-success" title="Acknowledge" onClick={() => acknowledge(a.id)}>
                      <i className="bi bi-check-lg" />
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => deleteAlert(a.id)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
