import { useState, useEffect, useMemo } from 'react'
import { auditAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import AlertMessage  from '../components/AlertMessage'
import { formatAction, formatDate, initials } from '../utils/helpers'

// Dot colours by action type
function getDotStyle(action = '') {
  const a = action.toUpperCase()
  if (a.includes('CREATE') || a.includes('ADD'))    return { bg: '#3fb950' }
  if (a.includes('UPDATE') || a.includes('EDIT'))   return { bg: '#4f8ef7' }
  if (a.includes('DELETE') || a.includes('REMOVE')) return { bg: '#f85149' }
  return { bg: '#d29922' }
}

export default function Audit() {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [dateFilter, setDateFilter]     = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await auditAPI.getLogs()
        if (!cancelled) setLogs(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.detail ?? 'Failed to load audit logs.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const set = new Set(logs.map((l) => l.action).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [logs])

  // Apply filters
  const filtered = logs.filter((log) => {
    const matchSearch = search === '' ||
      (log.action ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_type ?? '').toLowerCase().includes(search.toLowerCase())
    const matchAction = actionFilter === 'ALL' || log.action === actionFilter
    const matchDate   = !dateFilter ||
      (log.created_at && new Date(log.created_at).toISOString().slice(0, 10) === dateFilter)
    return matchSearch && matchAction && matchDate
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          Audit Logs
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: 0 }}>
          Full activity timeline for your organisation
        </p>
      </div>

      {/* Filters */}
      <div className="rg-card mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRight: 'none', color: '#8b949e' }}>
                <i className="bi bi-search" />
              </span>
              <input type="text" className="rg-input form-control" style={{ borderLeft: 'none' }}
                placeholder="Search action or entity…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="rg-input form-control form-select"
              value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              {actionTypes.map((a) => (
                <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : formatAction(a)}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <input type="date" className="rg-input form-control"
              value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>
          <div className="col-12 col-md-2 text-end">
            {(search || actionFilter !== 'ALL' || dateFilter) && (
              <button className="btn btn-sm" style={{ color: '#8b949e', fontSize: '0.8rem' }}
                onClick={() => { setSearch(''); setActionFilter('ALL'); setDateFilter('') }}>
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Events',   value: logs.length,            icon: 'bi-list-ul',       color: '#4f8ef7' },
          { label: 'Showing',        value: filtered.length,        icon: 'bi-funnel',         color: '#d29922' },
          { label: 'Unique Actions', value: actionTypes.length - 1, icon: 'bi-lightning',      color: '#3fb950' },
        ].map((s) => (
          <div className="col-4" key={s.label}>
            <div className="rg-card text-center">
              <i className={`bi ${s.icon}`} style={{ fontSize: '1.1rem', color: s.color }} />
              <div className="rg-metric-value mt-2" style={{ fontSize: '1.6rem' }}>{s.value}</div>
              <div className="rg-metric-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {error   && <AlertMessage type="error" message={error} />}
      {loading && <LoadingSpinner text="Loading audit logs…" />}

      {/* Timeline */}
      {!loading && !error && (
        filtered.length === 0 ? (
          <div className="rg-card">
            <div className="rg-empty">
              <i className="bi bi-clock-history" />
              <div className="rg-empty-title">
                {logs.length === 0 ? 'No activity yet' : 'No results found'}
              </div>
              <p style={{ fontSize: '0.82rem' }}>
                {logs.length === 0
                  ? 'Audit logs appear here as you create, update, or delete controls.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rg-card">
            <div className="rg-timeline">
              {filtered.map((log) => {
                const dot = getDotStyle(log.action)
                return (
                  <div className="rg-timeline-item" key={log.id}>
                    <div className="rg-timeline-dot" style={{ background: dot.bg }}>
                      <i className="bi bi-circle-fill" style={{ color: '#fff', fontSize: '0.4rem' }} />
                    </div>
                    <div className="rg-timeline-content">
                      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                        <div>
                          <div className="rg-timeline-action">{formatAction(log.action)}</div>
                          <div className="rg-timeline-meta d-flex gap-2 flex-wrap mt-1">
                            {log.entity_type && (
                              <span>
                                <i className="bi bi-box me-1" />
                                {log.entity_type}
                              </span>
                            )}
                            {log.user_id && (
                              <span>
                                <i className="bi bi-person me-1" />
                                {log.user_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#484f58', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {formatDate(log.created_at)}
                        </span>
                      </div>

                      {log.changes && (
                        <details style={{ marginTop: '0.5rem' }}>
                          <summary style={{ fontSize: '0.75rem', color: '#4f8ef7', cursor: 'pointer' }}>
                            View changes
                          </summary>
                          <pre style={{ fontSize: '0.72rem', color: '#8b949e', marginTop: '0.4rem', whiteSpace: 'pre-wrap', background: '#0d1117', padding: '0.5rem', borderRadius: '6px' }}>
                            {typeof log.changes === 'string' ? log.changes : JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      )}
    </div>
  )
}
