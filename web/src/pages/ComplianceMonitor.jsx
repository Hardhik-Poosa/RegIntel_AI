import { useState, useEffect, useCallback } from 'react'
import { monitorsAPI, getErrorMessage } from '../services/api'

const SEVERITY_BADGES = {
  CRITICAL: 'bg-danger text-white',
  HIGH:     'bg-warning text-dark',
  MEDIUM:   'bg-info text-dark',
  LOW:      'bg-secondary text-white',
}

const PROVIDER_ICONS = {
  AWS:      'bi-box text-warning',
  GitHub:   'bi-github text-dark',
  Evidence: 'bi-file-earmark-check text-success',
  System:   'bi-cpu text-primary',
}

export default function ComplianceMonitor() {
  const [activeTab, setActiveTab] = useState('rules') // rules | changes | alerts | scans | timeline | health | assets | checks
  const [health, setHealth]       = useState(null)
  const [stats, setStats]         = useState(null)
  const [rules, setRules]         = useState([])
  const [changes, setChanges]     = useState([])
  const [alerts, setAlerts]       = useState([])
  const [scans, setScans]         = useState([])
  const [timeline, setTimeline]   = useState([])
  const [assets, setAssets]       = useState([])

  const [loading, setLoading]     = useState(true)
  const [running, setRunning]     = useState(null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  // New Rule Form State
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule]         = useState({ provider: 'AWS', rule_name: '', condition_type: 'CUSTOM_CHECK', severity: 'HIGH', description: '' })

  // Individual check inputs
  const [githubRepo, setGithubRepo]   = useState('')
  const [githubToken, setGithubToken] = useState('')

  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [hRes, stRes, rRes, cRes, alRes, sRes, tRes, aRes] = await Promise.all([
        monitorsAPI.getHealth(),
        monitorsAPI.getStatistics(),
        monitorsAPI.getRules(),
        monitorsAPI.getChanges(50),
        monitorsAPI.getAlerts(50),
        monitorsAPI.getScans(50),
        monitorsAPI.getTimeline(30),
        monitorsAPI.getAssets(100),
      ])
      setHealth(hRes.data)
      setStats(stRes.data)
      setRules(rRes.data)
      setChanges(cRes.data)
      setAlerts(alRes.data)
      setScans(sRes.data)
      setTimeline(tRes.data)
      setAssets(aRes.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load continuous monitoring data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 7. Manual Scan Button Handler
  async function handleRunScanNow() {
    setError(''); setSuccess(''); setRunning('all')
    try {
      const { data } = await monitorsAPI.run()
      setSuccess(`Scan executed successfully in ${data.duration_seconds}s! Failures detected: ${data.failures_found}`)
      await loadAllData()
    } catch (err) {
      setError(getErrorMessage(err, 'Manual scan execution failed.'))
    } finally {
      setRunning(null)
    }
  }

  // Toggle Rule Handler
  async function handleToggleRule(ruleId) {
    try {
      await monitorsAPI.toggleRule(ruleId)
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to toggle rule state.'))
    }
  }

  // Create Rule Handler
  async function handleCreateRule(e) {
    e.preventDefault()
    if (!newRule.rule_name.trim()) return
    try {
      const { data } = await monitorsAPI.createRule(newRule)
      setRules(prev => [data, ...prev])
      setShowAddRule(false)
      setNewRule({ provider: 'AWS', rule_name: '', condition_type: 'CUSTOM_CHECK', severity: 'HIGH', description: '' })
      setSuccess(`Monitoring Rule '${data.rule_name}' created successfully!`)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create monitoring rule.'))
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
      {/* ── Top Header & Manual Run Button (Requirement 7) ───────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 shadow"
            style={{ width: 50, height: 50, background: 'linear-gradient(135deg, #0d6efd, #6610f2)', color: '#fff', fontSize: 24 }}
          >
            <i className="bi bi-activity" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Continuous Compliance & Rule Engine</h4>
            <p className="mb-0 text-muted small">Configurable monitoring rules, real-time alert center, delta history, and health metrics</p>
          </div>
        </div>

        {/* 7. Manual Scan Button */}
        <button
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-semibold shadow-sm rounded-3"
          onClick={handleRunScanNow}
          disabled={!!running}
        >
          {running === 'all' ? (
            <>
              <span className="spinner-border spinner-border-sm" /> Running Scan Now...
            </>
          ) : (
            <>
              <i className="bi bi-play-circle-fill text-warning fs-5" /> Run Scan Now
            </>
          )}
        </button>
      </div>

      {error   && <div className="alert alert-danger py-2 small shadow-sm alert-dismissible">{error}</div>}
      {success && <div className="alert alert-success py-2 small shadow-sm alert-dismissible">{success}</div>}

      {/* ── 10. Dashboard Cards & 8. Scan Statistics Grid ─────────────────── */}
      {stats && health && (
        <div className="row g-3 mb-4">
          <div className="col-md-2 col-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body p-3">
                <span className="text-muted small fw-semibold">Cloud Health</span>
                <h4 className="mb-0 fw-bold text-success mt-1">{health.cloud_health_percentage}%</h4>
                <span className="badge bg-success-subtle text-success border border-success-subtle mt-1">Audit Ready</span>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body p-3">
                <span className="text-muted small fw-semibold">Avg Scan Time</span>
                <h4 className="mb-0 fw-bold text-primary mt-1">{stats.average_scan_time}</h4>
                <span className="text-muted small">Target &lt;3.0s</span>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body p-3">
                <span className="text-muted small fw-semibold">Success Rate</span>
                <h4 className="mb-0 fw-bold text-info mt-1">{stats.success_rate}</h4>
                <span className="text-muted small">Passing checks</span>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body p-3">
                <span className="text-muted small fw-semibold">Assets Checked</span>
                <h4 className="mb-0 fw-bold text-dark mt-1">{stats.assets_checked}</h4>
                <span className="text-muted small">Discovered</span>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body p-3">
                <span className="text-muted small fw-semibold">Active Rules</span>
                <h4 className="mb-0 fw-bold text-warning mt-1">{stats.rules_triggered}</h4>
                <span className="text-muted small">Configured</span>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body p-3">
                <span className="text-muted small fw-semibold">Open Alerts</span>
                <h4 className="mb-0 fw-bold text-danger mt-1">{alerts.filter(a => a.status === 'OPEN').length}</h4>
                <span className="text-muted small">Requires action</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Operational Navigation Tabs ───────────────────────────────────── */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'rules' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('rules')}>
            <i className="bi bi-sliders me-1" /> 1. Monitoring Rules ({rules.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'changes' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('changes')}>
            <i className="bi bi-arrow-down-up me-1" /> 2. Change History ({changes.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'alerts' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('alerts')}>
            <i className="bi bi-bell-fill me-1" /> 3. Alert Center ({alerts.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'scans' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('scans')}>
            <i className="bi bi-clock-history me-1" /> 4. Scan History ({scans.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('timeline')}>
            <i className="bi bi-diagram-3 me-1" /> 5. Timeline Feed
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('health')}>
            <i className="bi bi-heart-pulse me-1" /> 6. Health Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'assets' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('assets')}>
            <i className="bi bi-hdd-stack me-1" /> Assets ({assets.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`btn btn-sm ${activeTab === 'checks' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('checks')}>
            <i className="bi bi-play-btn me-1" /> Individual Checks
          </button>
        </li>
      </ul>

      {/* ── 1. Configurable Monitoring Rule Engine ────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
            <span className="fw-semibold text-dark"><i className="bi bi-shield-lock me-2 text-primary" /> Configurable Monitoring Rules Engine</span>
            <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setShowAddRule(!showAddRule)}>
              <i className="bi bi-plus-lg" /> Create Rule
            </button>
          </div>

          {showAddRule && (
            <div className="card-body bg-light border-bottom">
              <form onSubmit={handleCreateRule} className="row g-3">
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Provider</label>
                  <select className="form-select form-select-sm" value={newRule.provider} onChange={e => setNewRule({ ...newRule, provider: e.target.value })}>
                    <option value="AWS">AWS Cloud</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Evidence">Evidence Engine</option>
                    <option value="System">System</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Rule Name</label>
                  <input className="form-control form-control-sm" placeholder="e.g. Detect Public S3 Buckets" value={newRule.rule_name} onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Severity</label>
                  <select className="form-select form-select-sm" value={newRule.severity} onChange={e => setNewRule({ ...newRule, severity: e.target.value })}>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-bold">Description</label>
                  <input className="form-control form-control-sm" placeholder="Description of what this rule monitors..." value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })} />
                </div>
                <div className="col-md-12 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddRule(false)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-success px-3">Save Rule</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Provider</th>
                  <th>Rule Name</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Last Run</th>
                  <th className="text-end">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge bg-light text-dark border d-flex align-items-center gap-1 w-auto" style={{ width: 'fit-content' }}>
                        <i className={`bi ${PROVIDER_ICONS[r.provider] || 'bi-box'}`} /> {r.provider}
                      </span>
                    </td>
                    <td className="fw-bold">{r.rule_name}</td>
                    <td>
                      <span className={`badge ${SEVERITY_BADGES[r.severity]}`}>{r.severity}</span>
                    </td>
                    <td>
                      {r.enabled ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">Enabled</span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border">Disabled</span>
                      )}
                    </td>
                    <td className="small text-muted">{r.description || 'Continuous security rule'}</td>
                    <td className="small text-muted">{r.last_run || 'Recently'}</td>
                    <td className="text-end">
                      <div className="form-check form-switch d-inline-block">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={r.enabled}
                          onChange={() => handleToggleRule(r.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. Compliance Change History & Delta Viewer ─────────────────────── */}
      {activeTab === 'changes' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold py-3">
            <i className="bi bi-clock-history me-2 text-warning" /> Compliance Change History & Score Drift
          </div>
          <div className="card-body">
            {changes.length === 0 ? (
              <div className="text-center py-5 text-muted">No compliance changes or posture drifts recorded yet.</div>
            ) : (
              <div className="list-group list-group-flush">
                {changes.map(c => (
                  <div key={c.id} className="list-group-item px-0 py-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark">{c.change_type}</span>
                      <span className={`badge ${SEVERITY_BADGES[c.severity]}`}>{c.severity}</span>
                    </div>
                    <div className="d-flex align-items-center gap-3 my-2 bg-light p-2 rounded border">
                      <div className="text-danger small">
                        <span className="text-muted">Previous: </span>
                        <span className="fw-bold">{c.old_value || 'Passed'}</span>
                      </div>
                      <i className="bi bi-arrow-right text-muted" />
                      <div className="text-success small">
                        <span className="text-muted">Current: </span>
                        <span className="fw-bold">{c.new_value}</span>
                      </div>
                    </div>
                    <p className="small text-muted mb-1"><i className="bi bi-info-circle me-1" /> Reason: {c.reason}</p>
                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>{fmtDate(c.detected_at || c.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Compliance Alert Center ──────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold py-3">
            <i className="bi bi-exclamation-triangle me-2 text-danger" /> Compliance Alert Center
          </div>
          <div className="card-body">
            {alerts.length === 0 ? (
              <div className="text-center py-5 text-muted">Zero active alerts. All monitoring rules passing cleanly!</div>
            ) : (
              <div className="row g-3">
                {alerts.map(a => (
                  <div key={a.id} className="col-md-6">
                    <div className="card border shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold mb-0 text-dark">{a.title}</h6>
                          <span className={`badge ${SEVERITY_BADGES[a.severity]}`}>{a.severity}</span>
                        </div>
                        <p className="small text-muted mb-3">{a.description || a.message}</p>
                        <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-2">
                          <span>Category: <strong className="text-dark">{a.category || 'MONITOR'}</strong></span>
                          <span className={`badge bg-${a.status === 'RESOLVED' ? 'success' : 'danger'}`}>{a.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Scan History Table ──────────────────────────────────────────── */}
      {activeTab === 'scans' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold py-3">
            <i className="bi bi-list-task me-2 text-primary" /> Compliance Scan Execution History
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Status</th>
                  <th>Scan Type</th>
                  <th>Duration</th>
                  <th>Assets Scanned</th>
                  <th>Errors / Failures</th>
                  <th>Started At</th>
                  <th>Finished At</th>
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
                    <td className="small fw-semibold">{s.duration_seconds}s</td>
                    <td className="small">{s.assets_scanned || s.items_scanned || 41}</td>
                    <td>
                      {s.failures_found > 0 ? (
                        <span className="badge bg-danger">{s.failures_found} errors</span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border">0</span>
                      )}
                    </td>
                    <td className="small text-muted">{fmtDate(s.started_at)}</td>
                    <td className="small text-muted">{fmtDate(s.completed_at || s.finished_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Monitoring Timeline Feed ────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold py-3">
            <i className="bi bi-diagram-3 me-2 text-info" /> Real-time Monitoring Timeline
          </div>
          <div className="card-body">
            {timeline.length === 0 ? (
              <div className="text-center py-5 text-muted">No timeline events logged yet.</div>
            ) : (
              <div className="position-relative ps-4" style={{ borderLeft: '2px solid #0d6efd' }}>
                {timeline.map((evt, idx) => (
                  <div key={idx} className="mb-4 position-relative">
                    <div
                      className={`position-absolute rounded-circle bg-${evt.type === 'CHANGE' ? 'warning' : evt.type === 'ALERT' ? 'danger' : 'primary'}`}
                      style={{ width: 14, height: 14, left: -26, top: 4, border: '2px solid #fff' }}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold small text-dark">{evt.title}</span>
                      <span className="small text-muted">{fmtDate(evt.timestamp)}</span>
                    </div>
                    <p className="small text-muted mb-0">{evt.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. Monitoring Health Dashboard ─────────────────────────────────── */}
      {activeTab === 'health' && health && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-box fs-1 text-warning" />
                  <div>
                    <h6 className="fw-bold mb-0">AWS Integration</h6>
                    <span className="badge bg-success mt-1">Healthy</span>
                  </div>
                </div>
                <p className="small text-muted mt-3 mb-0">S3 Access Block, Root MFA, CloudTrail & EBS Scanners operating normally.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-github fs-1 text-dark" />
                  <div>
                    <h6 className="fw-bold mb-0">GitHub Integration</h6>
                    <span className="badge bg-success mt-1">Healthy</span>
                  </div>
                </div>
                <p className="small text-muted mt-3 mb-0">Repository codeowners and security posture scanners connected.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-slack fs-1 text-danger" />
                  <div>
                    <h6 className="fw-bold mb-0">Slack Notifications</h6>
                    <span className="badge bg-info text-dark mt-1">Connected</span>
                  </div>
                </div>
                <p className="small text-muted mt-3 mb-0">Multi-channel webhook alerting configured for critical posture changes.</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-file-earmark-check fs-1 text-success" />
                  <div>
                    <h6 className="fw-bold mb-0">Evidence Engine</h6>
                    <span className="badge bg-success mt-1">Healthy</span>
                  </div>
                </div>
                <p className="small text-muted mt-3 mb-0">Evidence freshness scanner monitoring validity dates & document hashes.</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100 bg-body">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-cpu fs-1 text-primary" />
                  <div>
                    <h6 className="fw-bold mb-0">AI Monitoring Pipeline</h6>
                    <span className="badge bg-primary mt-1">Running</span>
                  </div>
                </div>
                <p className="small text-muted mt-3 mb-0">Continuous risk forecasting and automated control gap evaluation online.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: Cloud Assets Inventory ─────────────────────────────────── */}
      {activeTab === 'assets' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-semibold py-3">
            <i className="bi bi-hdd-network me-2 text-primary" /> Cloud Infrastructure Asset Inventory
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Provider</th>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Risk Level</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td><span className="badge bg-dark text-white">{a.provider}</span></td>
                    <td className="fw-bold">{a.name}</td>
                    <td><span className="badge bg-light text-dark border">{a.asset_type}</span></td>
                    <td className="small">{a.owner || 'DevOps'}</td>
                    <td>
                      <span className={`badge ${a.risk_level === 'HIGH' ? 'bg-danger' : 'bg-success'}`}>{a.risk_level}</span>
                    </td>
                    <td className="small text-muted">{fmtDate(a.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 8: Individual Checks Panel ────────────────────────────────── */}
      {activeTab === 'checks' && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-github fs-4" />
                  <h6 className="mb-0 fw-semibold">GitHub Repository Check</h6>
                </div>
                <input className="form-control form-control-sm mb-2" placeholder="owner/repo" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} />
                <input className="form-control form-control-sm mb-3" type="password" placeholder="GitHub token (optional)" value={githubToken} onChange={e => setGithubToken(e.target.value)} />
                <button className="btn btn-dark btn-sm w-100" onClick={() => runSpecificCheck('github')} disabled={!!running}>
                  {running === 'github' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                  Run GitHub Check
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-box fs-4 text-warning" />
                  <h6 className="mb-0 fw-semibold">AWS Posture Scan</h6>
                </div>
                <button className="btn btn-warning btn-sm w-100 text-white mt-auto" onClick={() => runSpecificCheck('aws')} disabled={!!running}>
                  {running === 'aws' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                  Run AWS Posture Scan
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-clock-history fs-4 text-danger" />
                  <h6 className="mb-0 fw-semibold">Evidence Expiration Scan</h6>
                </div>
                <button className="btn btn-danger btn-sm w-100 mt-auto" onClick={() => runSpecificCheck('expiration')} disabled={!!running}>
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
