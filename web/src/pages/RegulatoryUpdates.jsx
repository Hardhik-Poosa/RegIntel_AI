import { useState, useEffect, useCallback } from 'react'
import { regulatoryAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

const CATEGORY_COLORS = {
  'Financial':    '#4361ee',
  'Security':     '#dc3545',
  'AI Governance':'#6f42c1',
  'Privacy':      '#198754',
}

const JURISDICTION_FLAGS = { India: '🇮🇳', EU: '🇪🇺', USA: '🇺🇸', Global: '🌐' }

export default function RegulatoryUpdates() {
  const [updates, setUpdates]           = useState([])
  const [feeds, setFeeds]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [error, setError]               = useState('')
  const [catFilter, setCatFilter]       = useState('All')
  const [jurisFilter, setJurisFilter]   = useState('All')

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true); else setLoading(true)
    setError('')
    try {
      const [uRes, fRes] = await Promise.all([
        regulatoryAPI.updates(catFilter !== 'All' ? catFilter : null, jurisFilter !== 'All' ? jurisFilter : null, force),
        regulatoryAPI.feeds(),
      ])
      setUpdates(uRes.data)
      setFeeds(fRes.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load regulatory updates.'))
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [catFilter, jurisFilter])

  useEffect(() => { load() }, [load])

  const categories   = ['All', ...new Set(feeds.map(f => f.category))]
  const jurisdictions = ['All', ...new Set(feeds.map(f => f.jurisdiction))]

  function fmtDate(str) {
    if (!str) return ''
    try {
      return new Date(str).toLocaleDateString('en-IN', { dateStyle: 'medium' })
    } catch { return str.slice(0, 25) }
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0dcaf0,#0d6efd)', color: '#fff', fontSize: 22 }}
          >
            <i className="bi bi-newspaper" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Regulatory Updates</h4>
            <p className="mb-0 text-muted small">
              Live feeds from RBI, SEBI, NIST, EU AI Act, PCI-DSS and more
            </p>
          </div>
        </div>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          {refreshing
            ? <><span className="spinner-border spinner-border-sm me-1" />Refreshing…</>
            : <><i className="bi bi-arrow-clockwise me-1" />Refresh Feeds</>}
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* ── Feed Sources ──────────────────────────────────── */}
      {feeds.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {feeds.map(f => (
            <div key={f.id} className="chip d-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-pill small">
              <span>{JURISDICTION_FLAGS[f.jurisdiction] || '🌐'}</span>
              <span className="fw-semibold">{f.name}</span>
              <span
                className="badge rounded-pill"
                style={{ background: CATEGORY_COLORS[f.category] || '#6c757d', color: '#fff', fontSize: '0.65rem' }}
              >
                {f.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        <div>
          <label className="form-label fw-semibold small mb-1">Category</label>
          <div className="d-flex gap-1 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label fw-semibold small mb-1">Jurisdiction</label>
          <div className="d-flex gap-1 flex-wrap">
            {jurisdictions.map(j => (
              <button
                key={j}
                className={`btn btn-sm ${jurisFilter === j ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                onClick={() => setJurisFilter(j)}
              >
                {JURISDICTION_FLAGS[j] || ''} {j}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Updates ───────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-info" /></div>
      ) : updates.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <i className="bi bi-newspaper display-4 d-block mb-2 opacity-25" />
            No updates found. Try refreshing or changing filters.
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {updates.map((u, i) => (
            <div key={i} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex gap-1 flex-wrap">
                      <span
                        className="badge"
                        style={{
                          background: CATEGORY_COLORS[u.category] || '#6c757d',
                          color: '#fff',
                          fontSize: '0.72rem',
                        }}
                      >
                        {u.category}
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                        {JURISDICTION_FLAGS[u.jurisdiction] || '🌐'} {u.jurisdiction}
                      </span>
                    </div>
                    {u.published && (
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>{fmtDate(u.published)}</span>
                    )}
                  </div>

                  <h6 className="fw-semibold mb-1" style={{ lineHeight: 1.4, fontSize: '0.9rem' }}>
                    {u.title}
                  </h6>

                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <span className="text-muted small">
                      <i className="bi bi-broadcast me-1" />{u.source}
                    </span>
                    {u.link && (
                      <a href={u.link} target="_blank" rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary">
                        Read <i className="bi bi-box-arrow-up-right ms-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
