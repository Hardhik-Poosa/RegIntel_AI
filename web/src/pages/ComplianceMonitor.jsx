import { useState, useEffect, useCallback } from 'react'
import { monitorsAPI, getErrorMessage } from '../services/api'

const STATUS_STYLES = {
  PASS:    { badge: 'success', icon: 'bi-check-circle-fill' },
  FAIL:    { badge: 'danger',  icon: 'bi-x-circle-fill'     },
  WARNING: { badge: 'warning', icon: 'bi-exclamation-triangle-fill' },
  SUCCESS: { badge: 'success', icon: 'bi-check-circle-fill' },
}

export default function ComplianceMonitor() {
  const [activeTab, setActiveTab] = useState('assets') // assets | changes | scans | timeline | checks
  const [health, setHealth]       = useState(null)
  const [assets, setAssets]       = useState([])
  const [changes, setChanges]     = useState([])
  const [scans, setScans]         = useState([])
  const [timeline, setTimeline]   = useState([])
  const [history, setHistory]     = useState([])

  const [loading, setLoading]     = useState(true)
  const [running, setRunning]     = useState(null) // 'all' | 'github' | 'controls' | 'evidence' | 'aws'
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  const [githubRepo, setGithubRepo]   = useState('')
  const [githubToken, setGithubToken] = useState('')

  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [hRes, aRes, cRes, sRes, tRes, histRes] = await Promise.all([
        monitorsAPI.getHealth(),
        monitorsAPI.getAssets(100),
        monitorsAPI.getChanges(50),
        monitorsAPI.getScans(50),
        monitorsAPI.getTimeline(30),
        monitorsAPI.list(50),
      ])
      setHealth(hRes.data)
      setAssets(aRes.data)
      setChanges(cRes.data)
      setScans(sRes.data)
      setTimeline(tRes.data)
      setHistory(histRes.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load monitoring data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  async function handleRunScanNow() {
    setError(''); setSuccess(''); setRunning('all')
    try {
      const { data } = await monitorsAPI.runAll()
      setSuccess(`Full monitoring scan completed in ${data.duration_seconds}s! Failures detected: ${data.failures_found}`)
      await loadAllData()
    } catch (err) {
      setError(getErrorMessage(err, 'Manual scan failed.'))
    } finally {
      setRunning(null)
    }
  }

  async function runSpecificCheck(type) {
    setError(''); setSuccess(''); setRunning(type)
    try {
      let res
      if (type === 'github') {
        if (!githubRepo.trim()) { setError('Enter a GitHub repository (owner/repo)'); setRunning(null); return }
        res = await monitorsAPI.runGitHub(githubRepo.trim(), githubToken.trim() || undefined)
      } else if (type === 'controls') {
        res = await monitorsAPI.runControlGaps()
      } else if (type === 'evidence') {
        res = await monitorsAPI.runEvidenceGaps()
      } else if (type === 'aws') {
        res = await monitorsAPI.runAWS()
      } else if (type === 'expiration') {
        res = await monitorsAPI.runEvidenceExpiration()
      }
      setSuccess(`Check completed: ${res.data.status}`)
      await loadAllData()
    } catch (err) {
      setError(getErrorMessage(err, 'Check failed.'))
    } finally {
      setRunning(null)
    }
  }

  function fmtDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* ── Top Header ─────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#fff', fontSize: 22 }}
          >
            <i className="bi bi-activity" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Continuous Compliance & Operational Intelligence</h4>
            <p className="mb-0 text-muted small">Real-time cloud posture, asset inventory, state-drift changes, and automated monitoring engine</p>
          </div>
        </div>

        <button
          className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
          onClick={handleRunScanNow}
          disabled={!!running}
        >
          {running === 'all' ? (
            <>
              <span className="spinner-border spinner-border-sm" /> Running Full Scan...
            </>
          ) : (
            <>
              <i className="bi bi-lightning-charge-fill text-warning fs-5" /> Run Scan Now
            </>
          )}
        </button>
      </div>

      {error   && <div className="alert alert-danger py-2 small shadow-sm">{error}</div>}
      {success && <div className="alert alert-success py-2 small shadow-sm">{success}</div>}

      {/* ── 🏥 System Health Cards Row ──────────────────── */}
      {health && (
        <div className="row g-3 mb-4">
          {/* Cloud Health Score */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <span className="text-muted small fw-semibold">Cloud Health Score</span>
                <div className="d-flex align-items-baseline gap-2 mt-2">
                  <h2 className="mb-0 fw-bold text-success">{health.cloud_health_percentage}%</h2>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    <i className="bi bi-shield-check me-1" /> Audit Ready
                  </span>
                </div>
                <div className="progress mt-3" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${health.cloud_health_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <span className="text-muted small fw-semibold">Open Security Alerts</span>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <h2 className="mb-0 fw-bold text-danger">{health.alerts.total_open}</h2>
                  <div className="d-flex flex-column gap-1">
                    <span className="badge bg-danger">Critical: {health.alerts.critical}</span>
                    <span className="badge bg-warning text-dark">High: {health.alerts.high}</span>
                  </div>
                </div>
                <p className="text-muted small mb-0 mt-2">Open alert items across all monitors</p>
              </div>
            </div>
          </div>

          {/* Engine Status */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <span className="text-muted small fw-semibold">Monitoring System Status</span>
                <div className="mt-2">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="spinner-grow spinner-grow-sm text-success" />
                    <span className="fw-bold small">Engine: {health.monitoring_status}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-cpu text-primary small" />
                    <span className="small text-muted">AI Analysis: {health.ai_engine_status}</span>
                  </div>
                </div>
                <span className="text-muted small d-block mt-2">Total Scans Executed: {health.total_scans_run}</span>
              </div>
            </div>
          </div>

          {/* Connected Integrations */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <span className="text-muted small fw-semibold">Integrations Status</span>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <i className="bi bi-github text-dark" /> GitHub: {health.integrations.github}
                  </span>
                  <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <i className="bi bi-box text-warning" /> AWS: {health.integrations.aws}
                  </span>
                  <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <i className="bi bi-slack text-danger" /> Slack: {health.integrations.slack}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Operational Navigation Tabs ───────────────── */}
      <ul className="nav nav-tabs mb-4 border-bottom-0">
        <li className="nav-item">
          <button
            className={`nav-item-btn btn btn-sm me-2 ${activeTab === 'assets' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('assets')}
          >
            <i className="bi bi-hdd-stack me-1" /> Asset Inventory ({assets.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn btn-sm me-2 ${activeTab === 'changes' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('changes')}
          >
            <i className="bi bi-arrow-repeat me-1" /> State Drift & Changes ({changes.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn btn-sm me-2 ${activeTab === 'scans' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('scans')}
          >
            <i className="bi bi-card-checklist me-1" /> Scan History ({scans.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn btn-sm me-2 ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('timeline')}
          >
            <i className="bi bi-clock-history me-1" /> Activity Timeline
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn btn-sm ${activeTab === 'checks' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('checks')}
          >
            <i className="bi bi-play-btn me-1" /> Individual Checks
          </button>
        </li>
      </ul>

      {/* ── TAB 1: Asset Inventory Table ───────────────── */}
      {activeTab === 'assets' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
            <span className="fw-semibold"><i className="bi bi-box-seam me-1" /> Monitored Cloud Infrastructure Assets</span>
            <button className="btn btn-sm btn-outline-secondary" onClick={loadAllData} disabled={loading}>
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : assets.length === 0 ? (
              <div className="text-center py-5 text-muted">No cloud assets discovered yet. Run a scan above.</div>
            ) : (
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light small text-muted">
                  <tr>
                    <th>Provider</th>
                    <th>Asset Name</th>
                    <th>Asset Type</th>
                    <th>Owner</th>
                    <th>Risk Level</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id}>
                      <td>
                        <span className="badge bg-dark text-white me-1">{a.provider}</span>
                      </td>
                      <td className="fw-bold">{a.name}</td>
                      <td><span className="badge bg-light text-dark border">{a.asset_type}</span></td>
                      <td className="small">{a.owner || '—'}</td>
                      <td>
                        <span className={`badge bg-${a.risk_level === 'HIGH' ? 'danger' : 'success'}`}>
                          {a.risk_level}
                        </span>
                      </td>
                      <td className="small text-muted">{fmtDate(a.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: State Drift & Changes Feed ───────────── */}
      {activeTab === 'changes' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold">
            <i className="bi bi-git me-1" /> Compliance State Drift & Differences
          </div>
          <div className="card-body">
            {changes.length === 0 ? (
              <div className="text-center py-4 text-muted">No posture drift detected. System is stable.</div>
            ) : (
              <div className="list-group list-group-flush">
                {changes.map(c => (
                  <div key={c.id} className="list-group-item px-0 py-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark">{c.change_type}</span>
                      <span className={`badge bg-${c.severity === 'CRITICAL' || c.severity === 'HIGH' ? 'danger' : 'warning'}`}>
                        {c.severity}
                      </span>
                    </div>
                    <div className="small text-muted d-flex align-items-center gap-2 mb-1">
                      <span className="text-decoration-line-through text-danger">{c.old_value || 'None'}</span>
                      <i className="bi bi-arrow-right text-muted" />
                      <span className="fw-semibold text-success">{c.new_value}</span>
                    </div>
                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>{fmtDate(c.detected_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Scan & Job History Table ─────────────── */}
      {activeTab === 'scans' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold">
            <i className="bi bi-clock-history me-1" /> Historical Scan Execution Logs
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Status</th>
                  <th>Scan Type</th>
                  <th>Duration</th>
                  <th>Items Scanned</th>
                  <th>Failures</th>
                  <th>Started At</th>
                </tr>
              </thead>
              <tbody>
                {scans.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span className={`badge bg-${s.status === 'SUCCESS' ? 'success' : 'warning'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="fw-bold">{s.scan_type}</td>
                    <td className="small"><i className="bi bi-speedometer2 me-1" />{s.duration_seconds}s</td>
                    <td className="small">{s.items_scanned}</td>
                    <td>
                      {s.failures_found > 0 ? (
                        <span className="badge bg-danger">{s.failures_found} failed</span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border">0</span>
                      )}
                    </td>
                    <td className="small text-muted">{fmtDate(s.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Activity Timeline Stream ────────────── */}
      {activeTab === 'timeline' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold">
            <i className="bi bi-stream me-1" /> Real-time Activity Timeline Feed
          </div>
          <div className="card-body">
            {timeline.length === 0 ? (
              <div className="text-center py-4 text-muted">No activity recorded yet.</div>
            ) : (
              <div className="position-relative ps-4" style={{ borderLeft: '2px solid #dee2e6' }}>
                {timeline.map((evt, idx) => (
                  <div key={idx} className="mb-4 position-relative">
                    <div
                      className={`position-absolute rounded-circle bg-${evt.type === 'CHANGE' ? 'warning' : evt.type === 'ALERT' ? 'danger' : 'primary'}`}
                      style={{ width: 12, height: 12, left: -25, top: 4 }}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold small">{evt.title}</span>
                      <span className="small text-muted" style={{ fontSize: '0.75rem' }}>{fmtDate(evt.timestamp)}</span>
                    </div>
                    <p className="small text-muted mb-0">{evt.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: Individual Check Action Panels ──────── */}
      {activeTab === 'checks' && (
        <div className="row g-4">
          {/* GitHub Check */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-github fs-4" />
                  <h6 className="mb-0 fw-semibold">GitHub Repository Check</h6>
                </div>
                <p className="text-muted small">Scans repo for security policies and branch protection signals.</p>
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="owner/repo (e.g. my-org/my-app)"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                />
                <input
                  className="form-control form-control-sm mb-3"
                  type="password"
                  placeholder="GitHub token (optional)"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                />
                <button
                  className="btn btn-dark btn-sm w-100"
                  onClick={() => runSpecificCheck('github')}
                  disabled={!!running}
                >
                  {running === 'github' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                  Run GitHub Check
                </button>
              </div>
            </div>
          </div>

          {/* AWS Cloud Posture */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-box fs-4 text-warning" />
                  <h6 className="mb-0 fw-semibold">AWS Posture Scan</h6>
                </div>
                <p className="text-muted small">Scans S3 Public Access, Root MFA, CloudTrail logging, and EBS encryption.</p>
                <button
                  className="btn btn-warning btn-sm w-100 text-white mt-auto"
                  onClick={() => runSpecificCheck('aws')}
                  disabled={!!running}
                >
                  {running === 'aws' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                  Run AWS Posture Scan
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Expiration */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-clock-history fs-4 text-danger" />
                  <h6 className="mb-0 fw-semibold">Evidence Expiration Scan</h6>
                </div>
                <p className="text-muted small">Detects evidence documents expiring in &lt;30 days or already expired.</p>
                <button
                  className="btn btn-danger btn-sm w-100 mt-auto"
                  onClick={() => runSpecificCheck('expiration')}
                  disabled={!!running}
                >
                  {running === 'expiration' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                  Run Expiration Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
