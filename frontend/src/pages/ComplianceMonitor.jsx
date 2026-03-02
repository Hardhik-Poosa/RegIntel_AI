import { useState, useEffect, useCallback } from 'react'
import { monitorsAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

const STATUS_STYLES = {
  PASS:    { badge: 'success', icon: 'bi-check-circle-fill' },
  FAIL:    { badge: 'danger',  icon: 'bi-x-circle-fill'     },
  WARNING: { badge: 'warning', icon: 'bi-exclamation-triangle-fill' },
}

export default function ComplianceMonitor() {
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [running, setRunning]     = useState(null)  // which check is running
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [githubToken, setGithubToken] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await monitorsAPI.list(50)
      setHistory(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function runCheck(type) {
    setError(''); setSuccess(''); setRunning(type)
    try {
      let result
      if (type === 'github') {
        if (!githubRepo.trim()) { setError('Enter a GitHub repository (owner/repo)'); setRunning(null); return }
        result = await monitorsAPI.runGitHub(githubRepo.trim(), githubToken.trim() || undefined)
      } else if (type === 'controls') {
        result = await monitorsAPI.runControlGaps()
      } else if (type === 'evidence') {
        result = await monitorsAPI.runEvidenceGaps()
      }
      setSuccess(`Check completed: ${result.data.status}`)
      await loadHistory()
    } catch (err) {
      setError(getErrorMessage(err, 'Check failed.'))
    } finally {
      setRunning(null)
    }
  }

  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#fff', fontSize: 22 }}
        >
          <i className="bi bi-activity" />
        </div>
        <div>
          <h4 className="mb-0 fw-bold">Compliance Monitoring</h4>
          <p className="mb-0 text-muted small">Run automated compliance checks and view results</p>
        </div>
      </div>

      {error   && <div className="alert alert-danger  py-2 small">{error}</div>}
      {success && <div className="alert alert-success py-2 small">{success}</div>}

      {/* ── Check Panels ────────────────────────────────── */}
      <div className="row g-4 mb-4">

        {/* GitHub Check */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-github fs-4" />
                <h6 className="mb-0 fw-semibold">GitHub Repository Check</h6>
              </div>
              <p className="text-muted small">Scans a GitHub repo for security files, branch protection, and compliance signals.</p>
              <div className="mb-2">
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="owner/repo (e.g. my-org/my-app)"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                />
                <input
                  className="form-control form-control-sm"
                  type="password"
                  placeholder="GitHub token (optional)"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                />
              </div>
              <button
                className="btn btn-dark btn-sm w-100 mt-2"
                onClick={() => runCheck('github')}
                disabled={!!running}
              >
                {running === 'github' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                Run GitHub Check
              </button>
            </div>
          </div>
        </div>

        {/* Control Gaps */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-shield-exclamation fs-4 text-danger" />
                <h6 className="mb-0 fw-semibold">Control Gap Analysis</h6>
              </div>
              <p className="text-muted small">Identifies HIGH-risk controls that are still in MISSING status and creates alerts.</p>
              <button
                className="btn btn-danger btn-sm w-100 mt-auto"
                onClick={() => runCheck('controls')}
                disabled={!!running}
              >
                {running === 'controls' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                Run Control Gap Check
              </button>
            </div>
          </div>
        </div>

        {/* Evidence Gaps */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-file-earmark-x fs-4 text-warning" />
                <h6 className="mb-0 fw-semibold">Evidence Gap Scan</h6>
              </div>
              <p className="text-muted small">Finds IMPLEMENTED controls that have no evidence uploaded and flags them as warnings.</p>
              <button
                className="btn btn-warning btn-sm w-100 mt-auto text-white"
                onClick={() => runCheck('evidence')}
                disabled={!!running}
              >
                {running === 'evidence' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                Run Evidence Gap Scan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── History Table ───────────────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
          <span className="fw-semibold"><i className="bi bi-clock-history me-1" /> Check History</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadHistory} disabled={loading}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-activity display-4 d-block mb-2 opacity-25" />
              No checks run yet. Use the panels above to start a check.
            </div>
          ) : (
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light small text-muted">
                <tr><th>Status</th><th>Type</th><th>Message</th><th>When</th></tr>
              </thead>
              <tbody>
                {history.map(r => {
                  const s = STATUS_STYLES[r.status] || { badge: 'secondary', icon: 'bi-dash-circle' }
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className={`badge bg-${s.badge} d-flex align-items-center gap-1`} style={{ width: 'fit-content' }}>
                          <i className={`bi ${s.icon}`} /> {r.status}
                        </span>
                      </td>
                      <td><span className="badge bg-light text-dark border">{r.check_type}</span></td>
                      <td className="small">{r.message || '—'}</td>
                      <td className="small text-muted">{fmt(r.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
